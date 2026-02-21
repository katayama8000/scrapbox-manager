/// <reference lib="deno.ns" />

import "dotenv/load.ts";
import { PostWeeklyBlogUseCase } from "@/application/use-cases/post-weekly-blog.ts";
import { CalculateAverageWakeUpTimeUseCase } from "@/application/use-cases/calculate_average_wake_up_time.ts";
import { CalculateAverageSleepQualityUseCase } from "@/application/use-cases/calculate_average_sleep_quality.ts";
import { ScrapboxRepositoryImpl } from "@/infrastructure/adapters/scrapbox/scrapbox-repository-impl.ts";
import { DateProviderImpl } from "@/infrastructure/adapters/date/date-provider-impl.ts";

const main = async () => {
  const sessionId = Deno.env.get("SCRAPBOX_SID");
  if (!sessionId) {
    console.error("Please set the SCRAPBOX_SID environment variable.");
    Deno.exit(1);
  }

  const scrapboxRepository = new ScrapboxRepositoryImpl(sessionId);
  const dateProvider = new DateProviderImpl();

  const calculateAverageWakeUpTimeUseCase =
    new CalculateAverageWakeUpTimeUseCase(scrapboxRepository, dateProvider);
  const calculateAverageSleepQualityUseCase =
    new CalculateAverageSleepQualityUseCase(
      scrapboxRepository,
      dateProvider,
    );
  const postWeeklyBlogUseCase = new PostWeeklyBlogUseCase(
    scrapboxRepository,
    dateProvider,
    calculateAverageWakeUpTimeUseCase,
    calculateAverageSleepQualityUseCase,
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
