/// <reference lib="deno.ns" />

import "dotenv/load.ts";
import { PostDailyBlogUseCase } from "@/application/use-cases/post-daily-blog.ts";
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

  const postDailyBlogUseCase = new PostDailyBlogUseCase(
    scrapboxRepository,
    dateProvider,
  );
  try {
    await postDailyBlogUseCase.execute("katayama8000");
    console.log("Successfully posted daily blog.");
  } catch (error) {
    console.error("Failed to post daily blog:", error);
    Deno.exit(1);
  }
};

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});
