import "dotenv/load.ts";
import { SummarizeDailyArticlesUseCase } from "@/application/use-cases/summarize-daily-articles.ts";
import { GenerativeAIProviderImpl } from "@/infrastructure/adapters/generative-ai/generative-ai-provider-impl.ts";

const main = async () => {
  const sessionId = Deno.env.get("SCRAPBOX_SID");
  if (!sessionId) {
    console.error("Please set the SCRAPBOX_SID environment variable.");
    Deno.exit(1);
  }

  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    console.error("Please set the GEMINI_API_KEY environment variable.");
    Deno.exit(1);
  }

  const generativeAIProvider = new GenerativeAIProviderImpl(geminiApiKey);

  const summarizeDailyArticlesUseCase = new SummarizeDailyArticlesUseCase(
    generativeAIProvider,
  );

  try {
    await summarizeDailyArticlesUseCase.execute("katayama8000");
    console.log("Successfully summarized daily articles.");
  } catch (error) {
    console.error("Failed to summarize daily articles:", error);
    Deno.exit(1);
  }
};

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});
