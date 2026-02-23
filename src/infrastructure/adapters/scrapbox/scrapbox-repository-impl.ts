import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";
import { checkPageExist } from "@/infrastructure/adapters/scrapbox/checkPageExist.ts";
import { postToScrapbox } from "@/infrastructure/adapters/scrapbox/postToScrapbox.ts";
import { updateScrapboxPage } from "@/infrastructure/adapters/scrapbox/updateScrapboxPage.ts";
import { ScrapboxPayloadBuilder } from "./scrapbox-payload-builder.ts";

type ScrapboxSearchPageSchema = {
  id: string;
  title: string;
  words?: string[];
  lines?: string[];
};

const toDomainScrapboxPage = (
  projectName: string,
  schema: ScrapboxSearchPageSchema,
): ScrapboxPage | null => {
  if (typeof schema.title !== "string" || schema.title.length === 0) {
    return null;
  }

  const contentLines = schema.lines ?? [];

  return ScrapboxPage.reconstruct({
    projectName,
    title: schema.title,
    content: contentLines.join("\n"),
    lines: schema.lines,
  });
};

export class ScrapboxRepositoryImpl implements ScrapboxRepository {
  constructor(private readonly sessionId: string) {}

  async post(page: ScrapboxPage): Promise<void> {
    const builder = new ScrapboxPayloadBuilder();
    page.notify(builder);
    const { projectName, title, content } = builder.build();

    const pageExists = await this.exists(projectName, title);
    if (pageExists) {
      await updateScrapboxPage(this.sessionId, projectName, title, content);
    } else {
      await postToScrapbox(this.sessionId, projectName, title, content);
    }
  }

  async update(page: ScrapboxPage): Promise<void> {
    const builder = new ScrapboxPayloadBuilder();
    page.notify(builder);
    const { projectName, title, content } = builder.build();

    await updateScrapboxPage(this.sessionId, projectName, title, content);
  }

  async exists(projectName: string, title: string): Promise<boolean> {
    return await checkPageExist(projectName, title);
  }

  async getPage(
    projectName: string,
    title: string,
  ): Promise<ScrapboxPage | null> {
    try {
      const { getPage } = (
        await import("@katayama8000/cosense-client")
      ).CosenseClient(projectName);
      const data = await getPage(title);
      if (!data) return null;

      return ScrapboxPage.reconstruct({
        projectName,
        title,
        content: data.lines.map((l) => l.text).join("\n"),
        lines: data.lines.map((l) => l.text),
      });
    } catch (error) {
      console.error("getPage error:", error);
      return null;
    }
  }

  async listPages(projectName: string): Promise<ScrapboxPage[] | null> {
    const limit = 1000;
    type ScrapboxPageListItem = {
      title: string;
      lines?: string[];
      linesCount?: number;
    };
    const fetchAllPages = async (
      skip: number,
      pages: ScrapboxPage[],
      totalCount: number | null,
    ): Promise<ScrapboxPage[]> => {
      const url =
        `https://scrapbox.io/api/pages/${projectName}?skip=${skip}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP Error! status: ${response.status}`);
      }

      const data = await response.json();
      const resolvedTotalCount = totalCount ?? data.count;
      const fetchedItems = (data.pages ?? []) as ScrapboxPageListItem[];
      const fetchedPages = fetchedItems.map((item) => {
        const fallbackCount = typeof item.linesCount === "number"
          ? Math.min(item.linesCount, 2)
          : 0;
        const lines = item.lines ??
          (fallbackCount > 0 ? Array(fallbackCount).fill("") : undefined);

        return ScrapboxPage.reconstruct({
          projectName,
          title: item.title,
          content: lines ? lines.join("\n") : "",
          lines,
        });
      });
      const nextPages = pages.concat(fetchedPages);
      const nextSkip = skip + fetchedPages.length;

      if (fetchedPages.length === 0 || nextSkip >= resolvedTotalCount) {
        return nextPages;
      }

      return await fetchAllPages(nextSkip, nextPages, resolvedTotalCount);
    };

    try {
      return await fetchAllPages(0, [], null);
    } catch (error) {
      console.error("Failed to fetch Scrapbox pages:", error);
      return null;
    }
  }

  async getPageCount(projectName: string): Promise<number | null> {
    const url = `https://scrapbox.io/api/pages/${projectName}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP Error! status: ${response.status}`);
      }

      const data = await response.json();
      const pageCount: number = data.count;
      return pageCount;
    } catch (error) {
      console.error("Failed to fetch Scrapbox pages:", error);
      return null;
    }
  }

  async listPagesByPageTitle(
    projectName: string,
    pageTitles: string[],
  ): Promise<ScrapboxPage[] | null> {
    try {
      const pages = await Promise.all(
        pageTitles.map((title) => this.getPage(projectName, title)),
      );
      return pages.filter((page): page is ScrapboxPage => page !== null);
    } catch (error) {
      console.error("Failed to fetch Scrapbox pages by title:", error);
      return null;
    }
  }

  async listPagesByKeyword(
    projectName: string,
    keyword: string,
  ): Promise<ScrapboxPage[] | null> {
    try {
      const url =
        `https://scrapbox.io/api/pages/${projectName}/search/query?q=${keyword}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP Error! status: ${response.status}`);
      }

      const data = await response.json();
      return ((data.pages ?? []) as ScrapboxSearchPageSchema[])
        .map((item) => toDomainScrapboxPage(projectName, item))
        .filter((page): page is ScrapboxPage => page !== null);
    } catch (error) {
      console.error("Failed to fetch Scrapbox pages by keyword:", error);
      return null;
    }
  }
}
