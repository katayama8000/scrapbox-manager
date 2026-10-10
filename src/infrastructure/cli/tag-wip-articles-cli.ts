import { TagWipArticlesUseCase } from "@/application/use-cases/tag-wip-articles.ts";
import { ScrapboxRepositoryImpl } from "@/infrastructure/adapters/scrapbox/scrapbox-repository-impl.ts";

async function main() {
  const scrapboxRepository = new ScrapboxRepositoryImpl();
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
