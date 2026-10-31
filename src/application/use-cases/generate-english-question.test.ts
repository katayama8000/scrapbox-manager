import { assertEquals, assertRejects } from "std/assert/mod.ts";
import { GenerateEnglishQuestionUseCase } from "./generate-english-question.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";
import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";

const page = (title: string, tag = "#english") =>
  ScrapboxPage.reconstruct({
    projectName: "katayama8000",
    title,
    content: `${title} notes\n${tag}`,
  });

function fixture() {
  const sources = [
    page("by and until", "#English"),
    page("conditionals"),
    page("might as well"),
    page("articles"),
  ];
  const postedPages: ScrapboxPage[] = [];
  const prompts: string[] = [];
  const selections: string[][] = [];
  const selected = ["might as well", "by and until", "conditionals"];
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
    // Deliberately return a different order from AI's selection.
    listPagesByPageTitle: () => Promise.resolve(sources),
    listPagesByKeyword: () =>
      Promise.resolve([
        ...sources,
        sources[0],
        page("not English", "#english-extra"),
        page("plain mention", "english"),
      ]),
  };
  const aiProvider: GenerativeAIProvider = {
    generateContentJa: () => Promise.resolve(""),
    generateContentEn: () => Promise.resolve(""),
    selectEnglishPages: (titles) => {
      selections.push(titles);
      return Promise.resolve(selected);
    },
    generateEnglishQuestions: (prompt) => {
      prompts.push(prompt);
      const title = prompt.split("\n")[0].slice("Title: ".length);
      return Promise.resolve([1, 2, 3].map((n) => `${title} question ${n}? `));
    },
  };
  const useCase = new GenerateEnglishQuestionUseCase(
    repository,
    aiProvider,
    { now: () => new Date(2026, 9, 27, 12, 17) },
    "katayama8000",
  );
  return {
    sources,
    postedPages,
    prompts,
    selections,
    selected,
    repository,
    aiProvider,
    useCase,
  };
}

Deno.test("AI selects 3 distinct tagged pages and generates 3 questions per source", async () => {
  const f = fixture();
  const { title, questions } = await f.useCase.execute();
  assertEquals(title, "English Questions 2026/10/27 12:17");
  assertEquals(f.selections, [f.sources.map((source) => source.getTitle())]);
  assertEquals(
    f.prompts,
    f.selected.map((title) => {
      const source = f.sources.find((source) => source.getTitle() === title)!;
      return `Title: ${title}\nContent:\n${source.getContent()}`;
    }),
  );
  assertEquals(questions.length, 9);
  assertEquals(f.postedPages.length, 1);
  assertEquals(
    f.postedPages[0].getContent(),
    "[**** Generated English Questions]\n" +
      f.selected.map((title) =>
        `[*** [${title}]]\n` +
        [1, 2, 3].map((n) => `${title} question ${n}?`).join("\n")
      ).join("\n\n") +
      "\n\n#generated-english-question",
  );
});

Deno.test("fewer than 3 eligible pages fails without AI generation or posting", async () => {
  const f = fixture();
  f.repository.listPagesByKeyword = () =>
    Promise.resolve(f.sources.slice(0, 2));
  await assertRejects(() => f.useCase.execute(), Error, "At least 3 distinct");
  assertEquals(f.selections, []);
  assertEquals(f.prompts, []);
  assertEquals(f.postedPages, []);
});

for (
  const selected of [
    ["by and until", "by and until", "conditionals"],
    ["by and until", "conditionals", "invented"],
    ["by and until", "conditionals"],
  ]
) {
  Deno.test(`invalid AI selection is not published: ${selected}`, async () => {
    const f = fixture();
    f.aiProvider.selectEnglishPages = () => Promise.resolve(selected);
    await assertRejects(
      () => f.useCase.execute(),
      Error,
      "3 distinct eligible",
    );
    assertEquals(f.prompts, []);
    assertEquals(f.postedPages, []);
  });
}

Deno.test("missing selected page is not published", async () => {
  const f = fixture();
  f.repository.listPagesByPageTitle = () => Promise.resolve([]);
  await assertRejects(
    () => f.useCase.execute(),
    Error,
    "Selected English page not found",
  );
  assertEquals(f.postedPages, []);
});

for (const questions of [[], ["one", "two"], ["one", "two", " "]]) {
  Deno.test(`invalid question count/content is not published: ${JSON.stringify(questions)}`, async () => {
    const f = fixture();
    f.aiProvider.generateEnglishQuestions = () => Promise.resolve(questions);
    await assertRejects(
      () => f.useCase.execute(),
      Error,
      "Expected 3 non-empty questions",
    );
    assertEquals(f.postedPages, []);
  });
}

Deno.test("searches lowercase and legacy tag spellings without assuming case-insensitivity", async () => {
  const f = fixture();
  const keywords: string[] = [];
  f.repository.listPagesByKeyword = (_project, keyword) => {
    keywords.push(keyword);
    return Promise.resolve(
      keyword === "English" ? [f.sources[0]] : f.sources.slice(1),
    );
  };
  await f.useCase.execute();
  assertEquals(keywords, ["english", "English"]);
  assertEquals(f.postedPages.length, 1);
});
