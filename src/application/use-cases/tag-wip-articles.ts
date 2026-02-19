import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";

export class TagWipArticlesUseCase {
  constructor(
    private readonly scrapboxRepository: ScrapboxRepository,
    private readonly projectName: string,
  ) {}

  private canUseColor(): boolean {
    return Deno.stdout.isTerminal() && !Deno.noColor;
  }

  private color(text: string, code: string): string {
    if (!this.canUseColor()) {
      return text;
    }
    return `\x1b[${code}m${text}\x1b[0m`;
  }

  private buildProgressBar(current: number, total: number): string {
    const width = 24;
    const ratio = total > 0 ? current / total : 0;
    const filled = Math.min(width, Math.round(width * ratio));
    const filledBar = this.color("█".repeat(filled), "32");
    const emptyBar = this.color("░".repeat(width - filled), "90");
    const percent = this.color(
      `${Math.round(ratio * 100)}`.padStart(3, " "),
      "36",
    );
    return `[${filledBar}${emptyBar}] ${percent}%`;
  }

  private truncateTitle(title: string, maxLength = 52): string {
    if (title.length <= maxLength) {
      return title;
    }
    return `${title.slice(0, maxLength - 1)}…`;
  }

  async execute(): Promise<void> {
    const pages = await this.scrapboxRepository.listPages(this.projectName);
    if (!pages) {
      console.log("No pages found.");
      return;
    }

    const totalPages = pages.length;
    console.log(this.color(`🚀 tagWip started: ${totalPages} pages`, "35"));

    let processedCount = 0;
    let taggedCount = 0;
    let alreadyTaggedCount = 0;
    let nonEmptyCount = 0;
    for (const page of pages) {
      processedCount++;
      const title = page.getTitle();
      const progress = this.buildProgressBar(processedCount, totalPages);
      console.log(
        `${progress} ${processedCount}/${totalPages} ${
          this.truncateTitle(title)
        }`,
      );

      const isPotentiallyEmpty = (page.getLines()?.length ?? 0) <= 2;

      if (isPotentiallyEmpty) {
        const v = await this.scrapboxRepository.getPage(
          this.projectName,
          title,
        );

        if (v) {
          const lines = v.getLines() ?? [];
          const bodyLines = lines
            .slice(1)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
          const isActuallyEmpty = bodyLines.length === 0;
          const content = v.getContent();

          if (isActuallyEmpty) {
            if (!content.includes("#WIP")) {
              const newContent = content + "\n#WIP";
              const newPage = v.update({ content: newContent });
              await this.scrapboxRepository.post(newPage);
              taggedCount++;
              console.log(this.color("   ✍️  Added #WIP", "32"));
            } else {
              alreadyTaggedCount++;
              console.log(this.color("   ⏭️  Already tagged", "33"));
            }
          } else {
            nonEmptyCount++;
            console.log(this.color("   📄 Not empty", "90"));
          }
        } else {
          nonEmptyCount++;
          console.log(this.color("   ❓ Could not load page details", "31"));
        }
      } else {
        nonEmptyCount++;
      }
    }

    console.log(this.color("✅ Processing finished.", "35"));
    console.log(
      this.color(
        `Summary: tagged=${taggedCount}, alreadyTagged=${alreadyTaggedCount}, nonEmptyOrSkipped=${nonEmptyCount}`,
        "36",
      ),
    );
  }
}
