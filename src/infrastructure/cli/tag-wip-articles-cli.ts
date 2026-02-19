import { TagWipArticlesUseCase } from "@/application/use-cases/tag-wip-articles.ts";
import { ScrapboxRepositoryImpl } from "@/infrastructure/adapters/scrapbox/scrapbox-repository-impl.ts";

async function main() {
  const sessionId = Deno.env.get("SCRAPBOX_SID");
  if (!sessionId) {
    console.error("Please set the SCRAPBOX_SID environment variable.");
    Deno.exit(1);
  }

  const scrapboxRepository = new ScrapboxRepositoryImpl(sessionId);
  const tagWipArticlesUseCase = new TagWipArticlesUseCase(
    scrapboxRepository,
    "katayama8000",
  );

  await tagWipArticlesUseCase.execute();
}

main().catch((error) => {
  console.error(error);
  Deno.exit(1);
});
