import { IScrapboxPageNotification } from "@/application/ports/scrapbox-page-notification.ts";

export class ScrapboxPage {
  private constructor(
    private readonly projectName: string,
    private readonly title: string,
    private readonly content: string,
  ) {}

  static create({
    projectName,
    title,
    content,
  }: {
    projectName: string;
    title: string;
    content: string;
  }): ScrapboxPage {
    return new ScrapboxPage(projectName, title, content);
  }

  static reconstruct({
    projectName,
    title,
    content,
  }: {
    projectName: string;
    title: string;
    content: string;
  }): ScrapboxPage {
    return new ScrapboxPage(projectName, title, content);
  }

  update({ content }: { content: string }): ScrapboxPage {
    return new ScrapboxPage(this.projectName, this.title, content);
  }

  notify(notification: IScrapboxPageNotification): void {
    notification
      .projectName(this.projectName)
      .title(this.title)
      .content(this.content);
  }

  // Getters
  getProjectName(): string {
    return this.projectName;
  }

  getTitle(): string {
    return this.title;
  }

  getContent(): string {
    return this.content;
  }
}
