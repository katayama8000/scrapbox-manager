/// <reference lib="deno.ns" />

import "dotenv/load.ts";
import { GenerateEnglishQuestionUseCase } from "@/application/use-cases/generate-english-question.ts";
import { ScrapboxRepositoryImpl } from "@/infrastructure/adapters/scrapbox/scrapbox-repository-impl.ts";
import { GenerativeAIProviderImpl } from "@/infrastructure/adapters/generative-ai/generative-ai-provider-impl.ts";

const main = async () => {
  const sessionId = Deno.env.get("SCRAPBOX_SID");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!sessionId) {
    console.error("Please set the SCRAPBOX_SID environment variable.");
    Deno.exit(1);
  }
  if (!geminiApiKey) {
    console.error("Please set the GEMINI_API_KEY environment variable.");
    Deno.exit(1);
  }

  const projectName = "katayama8000";

  const scrapboxRepository = new ScrapboxRepositoryImpl(sessionId);
  const generativeAiProvider = new GenerativeAIProviderImpl(geminiApiKey);

  const generateEnglishQuestionUseCase = new GenerateEnglishQuestionUseCase(
    scrapboxRepository,
    generativeAiProvider,
    projectName,
  );

  try {
    const question = await generateEnglishQuestionUseCase.execute();

    if (question) {
      console.log("Generated English Question:");
    } else {
      console.log(
        "No pages found for the given keyword, or question could not be generated.",
      );
    }
  } catch (error) {
    console.error("Failed to generate English question:", error);
    Deno.exit(1);
  }
};

main().catch((error) => {
  console.error("Unexpected error:", error);
  Deno.exit(1);
});
