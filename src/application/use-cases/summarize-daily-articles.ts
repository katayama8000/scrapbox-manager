import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";
import { ScrapboxPayloadBuilder } from "@/infrastructure/adapters/scrapbox/scrapbox-payload-builder.ts";

export class SummarizeDailyArticlesUseCase {
  constructor(private readonly generativeAIProvider: GenerativeAIProvider) {}

  async execute(_projectName: string): Promise<void> {
    const summary = await this.generateSummaryTest("hello");
    console.log(summary);
  }

  private async generateSummary(pages: ScrapboxPage[]): Promise<string> {
    const content = pages
      .map((page) => {
        const builder = new ScrapboxPayloadBuilder();
        page.notify(builder);
        const { lines } = builder.build();
        return lines.join("\n");
      })
      .join("\n\n");

    const prompt = `Please summarize the following daily notes:

${content}`;
    return await this.generativeAIProvider.generateContentJa(prompt);
  }

  private async generateSummaryTest(content: string): Promise<string> {
    const prompt = `Please summarize the following daily notes:

${content}`;
    return await this.generativeAIProvider.generateContentJa(prompt);
  }
}
