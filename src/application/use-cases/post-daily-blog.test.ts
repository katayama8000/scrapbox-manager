import { assertEquals, assertStringIncludes } from "std/assert/mod.ts";
import { PostDailyBlogUseCase } from "./post-daily-blog.ts";
import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { DateProvider } from "@/application/ports/date-provider.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";

const createPostedPage = async (now: Date): Promise<ScrapboxPage> => {
  const postedPages: ScrapboxPage[] = [];

  const repository: ScrapboxRepository = {
    post: (page) => {
      postedPages.push(page);
      return Promise.resolve();
    },
    update: () => Promise.resolve(),
    exists: () => Promise.resolve(false),
    getPage: () => Promise.resolve(null),
    getPageCount: () => Promise.resolve(null),
    listPages: () => Promise.resolve(null),
    listPagesByPageTitle: () => Promise.resolve(null),
  };

  const dateProvider: DateProvider = {
    now: () => now,
  };

  const useCase = new PostDailyBlogUseCase(repository, dateProvider);

  await useCase.execute("katayama8000");

  assertEquals(postedPages.length, 1);
  return postedPages[0];
};

Deno.test("PostDailyBlogUseCase.execute uses JST date for daily note URL", async () => {
  const postedPage = await createPostedPage(
    new Date("2026-09-29T15:30:00Z"), // 2026-09-30 00:30 JST
  );
  assertStringIncludes(
    postedPage.getContent(),
    "https://github.com/katayama8000/obsidian-vault/blob/main/daily/2026-09-30.md",
  );
});

Deno.test("PostDailyBlogUseCase.execute zero-pads day for 10/1", async () => {
  const postedPage = await createPostedPage(
    new Date("2026-09-30T15:30:00Z"), // 2026-10-01 00:30 JST
  );

  assertStringIncludes(
    postedPage.getContent(),
    "https://github.com/katayama8000/obsidian-vault/blob/main/daily/2026-10-01.md",
  );
});

Deno.test("PostDailyBlogUseCase.execute zero-pads month and day for 2/2", async () => {
  const postedPage = await createPostedPage(
    new Date("2026-02-01T15:30:00Z"), // 2026-02-02 00:30 JST
  );

  assertStringIncludes(
    postedPage.getContent(),
    "https://github.com/katayama8000/obsidian-vault/blob/main/daily/2026-02-02.md",
  );
});
