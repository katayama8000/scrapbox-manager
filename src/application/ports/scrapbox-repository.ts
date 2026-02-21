import { ScrapboxPage } from "@/domain/models/scrapbox-page.ts";

export interface ScrapboxRepository {
  post(page: ScrapboxPage): Promise<void>;
  update(page: ScrapboxPage): Promise<void>;
  exists(projectName: string, title: string): Promise<boolean>;
  getPage(projectName: string, title: string): Promise<ScrapboxPage | null>;
  getPageCount(projectName: string): Promise<number | null>;
  listPages(projectName: string): Promise<ScrapboxPage[] | null>;
  listPagesByPageTitle(
    projectName: string,
    pageTitles: string[],
  ): Promise<ScrapboxPage[] | null>;
}
