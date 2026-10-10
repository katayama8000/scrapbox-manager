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
    listPagesByKeyword: () => Promise.resolve(null),
  };

  const dateProvider: DateProvider = {
    now: () => now,
  };

  const useCase = new PostDailyBlogUseCase(repository, dateProvider);

  await useCase.execute("katayama8000");

  assertEquals(postedPages.length, 1);
  return postedPages[0];
};

Deno.test("PostDailyBlogUseCase.execute includes weekly connect link", async () => {
  const postedPage = await createPostedPage(
    new Date("2026-09-29T15:30:00Z"), // 2026-09-30 00:30 JST
  );

  assertStringIncludes(postedPage.getContent(), "#2026/09/28~2026/10/04");
});

Deno.test("PostDailyBlogUseCase.execute handles Sunday as week end", async () => {
  const postedPage = await createPostedPage(
    new Date("2026-10-03T15:30:00Z"), // 2026-10-04 00:30 JST (Sunday)
  );

  assertStringIncludes(postedPage.getContent(), "#2026/09/28~2026/10/04");
});

Deno.test("PostDailyBlogUseCase.execute includes daily tag", async () => {
  const postedPage = await createPostedPage(
    new Date("2026-02-01T15:30:00Z"), // 2026-02-02 00:30 JST
  );

  assertStringIncludes(postedPage.getContent(), "#daily");
});
