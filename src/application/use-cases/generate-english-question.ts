import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";
import { DateProvider } from "@/application/ports/date-provider.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";

export class GenerateEnglishQuestionUseCase {
  constructor(
    private scrapboxRepository: ScrapboxRepository,
    private generativeAiProvider: GenerativeAIProvider,
    private dateProvider: DateProvider,
    private projectName: string,
  ) {}

  private formatDateForTitle(date: Date): string {
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
  }

  private buildQuestionPageContent(
    questions: string[],
    sourceTitles: string[],
  ): string {
    const sourceSection = sourceTitles.length > 0
      ? `\n\n${sourceTitles.map((title) => `[${title}]`).join("\n")}`
      : "";

    return `[**** Generated English Questions]\n${
      questions.map((question) => question.trim()).join("\n")
    }${sourceSection}\n\n#generated-english-question`;
  }

  async execute(): Promise<{ title: string; questions: string[] }> {
    const keyword = "English";
    const pages = await this.scrapboxRepository.listPagesByKeyword(
      this.projectName,
      keyword,
    );

    if (!pages || pages.length === 0) {
      throw new Error(`No pages found with the keyword "${keyword}".`);
    }

    // filter by #English
    const englishPagesTitles = pages
      .filter((page) => page.getContent().includes(`#${keyword}`))
      .map((page) => page.getTitle());

    // pick up 3 pages randomly
    const selectedPagesTitles = englishPagesTitles
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    if (selectedPagesTitles.length === 0) {
      throw new Error(`No pages include "#${keyword}" in content.`);
    }

    // fetch pages by title
    const selectedPages = await this.scrapboxRepository.listPagesByPageTitle(
      this.projectName,
      selectedPagesTitles,
    );

    if (!selectedPages || selectedPages.length === 0) {
      throw new Error(
        `No pages found with the title "${selectedPagesTitles.join(", ")}".`,
      );
    }

    const prompt = selectedPages
      .map(
        (page) => `Title: ${page.getTitle()}\nContent:\n${page.getContent()}`,
      )
      .join("\n\n---\n\n");

    const questions = await this.generativeAiProvider
      .generateEnglishQuestions(prompt);

    const title = `English Questions ${
      this.formatDateForTitle(this.dateProvider.now())
    }`;
    const content = this.buildQuestionPageContent(
      questions,
      selectedPagesTitles,
    );

    const page = ScrapboxPage.create({
      projectName: this.projectName,
      title,
      content,
    });
    await this.scrapboxRepository.post(page);

    return { title, questions };
  }
}
