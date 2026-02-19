import { IScrapboxPageNotification } from "@/application/ports/scrapbox-page-notification.ts";

export class ScrapboxPage {
  private constructor(
    private readonly projectName: string,
    private readonly title: string,
    private readonly content: string,
    private readonly lines?: string[],
  ) {}

  static create({
    projectName,
    title,
    content,
    lines,
  }: {
    projectName: string;
    title: string;
    content: string;
    lines?: string[];
  }): ScrapboxPage {
    return new ScrapboxPage(projectName, title, content, lines);
  }

  static reconstruct({
    projectName,
    title,
    content,
    lines,
  }: {
    projectName: string;
    title: string;
    content: string;
    lines?: string[];
  }): ScrapboxPage {
    return new ScrapboxPage(projectName, title, content, lines);
  }

  update({
    content,
    lines,
  }: {
    content: string;
    lines?: string[];
  }): ScrapboxPage {
    return new ScrapboxPage(
      this.projectName,
      this.title,
      content,
      lines ?? this.lines,
    );
  }

  notify(notification: IScrapboxPageNotification): void {
    notification
      .projectName(this.projectName)
      .title(this.title)
      .content(this.content);
    if (this.lines) {
      notification.lines(this.lines);
    }
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

  getLines(): string[] | undefined {
    return this.lines;
  }
}
