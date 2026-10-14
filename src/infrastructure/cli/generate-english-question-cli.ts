/// <reference lib="deno.ns" />

import "dotenv/load.ts";
import { GenerateEnglishQuestionUseCase } from "@/application/use-cases/generate-english-question.ts";
import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";
import { ScrapboxRepositoryImpl } from "@/infrastructure/adapters/scrapbox/scrapbox-repository-impl.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";
import { createGenerativeAIProviderFromEnv } from "@/infrastructure/adapters/generative-ai/generative-ai-provider-factory.ts";

const main = async () => {
  let generativeAiProvider: GenerativeAIProvider;
  try {
    generativeAiProvider = createGenerativeAIProviderFromEnv();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`Generative AI configuration error: ${detail}`);
    Deno.exit(1);
  }

  const projectName = "katayama8000";

  const scrapboxRepository = new ScrapboxRepositoryImpl();
  const dateProvider = new DateProviderImpl();

  const generateEnglishQuestionUseCase = new GenerateEnglishQuestionUseCase(
    scrapboxRepository,
    generativeAiProvider,
    dateProvider,
    projectName,
  );

  try {
    const { title, question } = await generateEnglishQuestionUseCase.execute();
    console.log(
      `Successfully posted generated questions to Scrapbox: ${title}`,
    );
    console.log("Generated English Question:");
    console.log(question);
  } catch (error) {
    console.error("Failed to generate English question:", error);
    Deno.exit(1);
  }
};

main().catch((error) => {
  console.error("Unexpected error:", error);
  Deno.exit(1);
});
