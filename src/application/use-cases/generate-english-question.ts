import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";

export class GenerateEnglishQuestionUseCase {
  constructor(
    private scrapboxRepository: ScrapboxRepository,
    private generativeAiProvider: GenerativeAIProvider,
    private projectName: string,
  ) {}

  async execute(): Promise<string | null> {
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

    console.log("generating Q ...");

    // Generate the English question
    const generatedQuestion = await this.generativeAiProvider
      .generateEnglishQuestion(prompt);

    console.log("generated Q", generatedQuestion);

    return generatedQuestion;
  }
}
