import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";

export class TagWipArticlesUseCase {
  constructor(
    private readonly scrapboxRepository: ScrapboxRepository,
    private readonly projectName: string,
  ) {}

  async execute(): Promise<void> {
    const pages = await this.scrapboxRepository.listPages(this.projectName);
    if (!pages) {
      console.log("No pages found.");
      return;
    }

    const totalPages = pages.length;
    console.log(`Found ${totalPages} pages. Starting to process...`);

    let processedCount = 0;
    for (const page of pages) {
      processedCount++;
      const title = page.getTitle();
      console.log(`[${processedCount}/${totalPages}] Checking "${title}"...`);

      const isPotentiallyEmpty = (page.getLines()?.length ?? 0) <= 2;

      if (isPotentiallyEmpty) {
        console.log(`  -> Page may be empty. Checking for #WIP tag...`);
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
              console.log(`  -> #WIP tag not found. Adding it.`);
              const newPage = v.update({ content: "\n#WIP" });
              await this.scrapboxRepository.post(newPage);
            } else {
              console.log(`  -> #WIP tag already exists. Skipping.`);
            }
          } else {
            console.log(`  -> Page is not empty. Skipping.`);
          }
        }
      }
    }
    console.log("Processing finished.");
  }
}
