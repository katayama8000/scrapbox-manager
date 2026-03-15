import { IScrapboxPageNotification } from "@/application/ports/scrapbox-page-notification.ts";

export class ScrapboxPayloadBuilder implements IScrapboxPageNotification {
  private pageProjectName?: string;
  private pageTitle?: string;
  private pageContent?: string;

  projectName(projectName: string): this {
    this.pageProjectName = projectName;
    return this;
  }

  title(title: string): this {
    this.pageTitle = title;
    return this;
  }

  content(content: string): this {
    this.pageContent = content;
    return this;
  }

  build(): {
    projectName: string;
    title: string;
    content: string;
  } {
    if (!this.pageProjectName || !this.pageTitle || !this.pageContent) {
      throw new Error("Project name, title, and content must be provided.");
    }

    return {
      projectName: this.pageProjectName,
      title: this.pageTitle,
      content: this.pageContent,
    };
  }
}
