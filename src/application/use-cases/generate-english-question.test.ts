import { assertEquals } from "std/assert/mod.ts";
import { GenerateEnglishQuestionUseCase } from "./generate-english-question.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";
import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";

Deno.test("GenerateEnglishQuestionUseCase puts one question per line", async () => {
  const sourcePage = ScrapboxPage.reconstruct({
    projectName: "katayama8000",
    title: "by and until",
    content: "by vs until\n#English",
  });
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
    listPagesByPageTitle: () => Promise.resolve([sourcePage]),
    listPagesByKeyword: () => Promise.resolve([sourcePage]),
  };

  const aiProvider: GenerativeAIProvider = {
    generateContentJa: () => Promise.resolve(""),
    generateContentEn: () => Promise.resolve(""),
    generateEnglishQuestions: () =>
      Promise.resolve([
        "What does by mean? ",
        "What does until mean?",
        "Which one fits here?",
      ]),
  };

  const useCase = new GenerateEnglishQuestionUseCase(
    repository,
    aiProvider,
    { now: () => new Date(2026, 9, 27, 12, 17) },
    "katayama8000",
  );
  const { title } = await useCase.execute();

  assertEquals(title, "English Questions 2026/10/27 12:17");
  assertEquals(
    postedPages[0].getContent(),
    "[**** Generated English Questions]\n" +
      "What does by mean?\n" +
      "What does until mean?\n" +
      "Which one fits here?\n" +
      "\n" +
      "[by and until]\n" +
      "\n" +
      "#generated-english-question",
  );
});
