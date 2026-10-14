/// <reference lib="deno.ns" />

import "dotenv/load.ts";
import { PostWeeklyBlogUseCase } from "@/application/use-cases/post-weekly-blog.ts";
import { CalculateAverageWakeUpTimeUseCase } from "@/application/use-cases/calculate_average_wake_up_time.ts";
import { CalculateAverageSleepQualityUseCase } from "@/application/use-cases/calculate_average_sleep_quality.ts";
import { ScrapboxRepositoryImpl } from "@/infrastructure/adapters/scrapbox/scrapbox-repository-impl.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";
import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";
import {
  createGenerativeAIProviderFromEnv,
  getGenerativeAIBackendFromEnv,
} from "@/infrastructure/adapters/generative-ai/generative-ai-provider-factory.ts";

const main = async () => {
  let generativeAIProvider: GenerativeAIProvider;
  try {
    generativeAIProvider = createGenerativeAIProviderFromEnv();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(
      `Generative AI is not configured (${detail}). The weekly page will be created without an AI-generated summary.`,
    );

    generativeAIProvider = {
      generateContentJa(): Promise<string> {
        throw new Error("Generative AI is not configured.");
      },
      generateContentEn(): Promise<string> {
        throw new Error("Generative AI is not configured.");
      },
      generateEnglishQuestion(): Promise<string> {
        throw new Error("Generative AI is not configured.");
      },
    };
  }

  const selectedBackend = getGenerativeAIBackendFromEnv();
  console.log(`Using AI provider: ${selectedBackend}`);

  const scrapboxRepository = new ScrapboxRepositoryImpl();
  const dateProvider = new DateProviderImpl();

  const calculateAverageWakeUpTimeUseCase =
    new CalculateAverageWakeUpTimeUseCase(scrapboxRepository, dateProvider);
  const calculateAverageSleepQualityUseCase =
    new CalculateAverageSleepQualityUseCase(scrapboxRepository, dateProvider);
  const postWeeklyBlogUseCase = new PostWeeklyBlogUseCase(
    scrapboxRepository,
    dateProvider,
    calculateAverageWakeUpTimeUseCase,
    calculateAverageSleepQualityUseCase,
    generativeAIProvider,
  );
  try {
    await postWeeklyBlogUseCase.execute("katayama8000");
    console.log("Successfully posted weekly blog.");
  } catch (error) {
    console.error("Failed to post weekly blog:", error);
    Deno.exit(1);
  }
};

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});
