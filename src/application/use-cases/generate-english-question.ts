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
    const sections = sourceTitles.map((title, index) =>
      `[*** [${title}]]\n${
        questions.slice(index * 3, index * 3 + 3)
          .map((question) => question.trim()).join("\n")
      }`
    );
    return `[**** Generated English Questions]\n${
      sections.join("\n\n")
    }\n\n#generated-english-question`;
  }

  async execute(): Promise<{ title: string; questions: string[] }> {
    // Search both spellings without relying on API case-insensitivity.
    const results = await Promise.all(
      ["english", "English"].map((keyword) =>
        this.scrapboxRepository.listPagesByKeyword(this.projectName, keyword)
      ),
    );
    const pages = results.flatMap((pages) => pages ?? []);

    if (pages.length === 0) {
      throw new Error("No English pages found.");
    }

    // Keep the existing #English tag compatible with lowercase #english.
    const englishPagesTitles = [
      ...new Set(
        pages
          .filter((page) => /(?:^|\s)#english(?=\s|$)/i.test(page.getContent()))
          .map((page) => page.getTitle()),
      ),
    ];

    if (englishPagesTitles.length < 3) {
      throw new Error(
        "At least 3 distinct pages tagged #english are required.",
      );
    }

    const selectedPagesTitles = await this.generativeAiProvider
      .selectEnglishPages(englishPagesTitles);
    if (
      !Array.isArray(selectedPagesTitles) ||
      selectedPagesTitles.length !== 3 ||
      new Set(selectedPagesTitles).size !== 3 ||
      selectedPagesTitles.some((title) => !englishPagesTitles.includes(title))
    ) {
      throw new Error("AI must select 3 distinct eligible English pages.");
    }

    const selectedPages = await this.scrapboxRepository.listPagesByPageTitle(
      this.projectName,
      selectedPagesTitles,
    );
    const questions: string[] = [];
    for (const sourceTitle of selectedPagesTitles) {
      const sourcePage = selectedPages?.find((page) =>
        page.getTitle() === sourceTitle
      );
      if (!sourcePage) {
        throw new Error(`Selected English page not found: "${sourceTitle}".`);
      }
      const sourceQuestions = await this.generativeAiProvider
        .generateEnglishQuestions(
          `Title: ${sourceTitle}\nContent:\n${sourcePage.getContent()}`,
        );
      if (
        !Array.isArray(sourceQuestions) ||
        sourceQuestions.length !== 3 ||
        sourceQuestions.some((question) =>
          typeof question !== "string" || question.trim().length === 0
        )
      ) {
        throw new Error(`Expected 3 non-empty questions for "${sourceTitle}".`);
      }
      questions.push(...sourceQuestions);
    }

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
