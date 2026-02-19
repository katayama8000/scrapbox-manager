import { ScrapboxRepository } from '@/application/ports/scrapbox-repository.ts';

export class TagWipArticlesUseCase {
  constructor(
    private readonly scrapboxRepository: ScrapboxRepository,
    private readonly projectName: string,
  ) {}

  async execute(): Promise<void> {
    const pages = await this.scrapboxRepository.listPages(this.projectName);
    if (!pages) {
      console.log('No pages found.');
      return;
    }

    const totalPages = pages.length;
    console.log(`Found ${totalPages} pages. Starting to process...`);

    let processedCount = 0;
    for (const page of pages) {
      processedCount++;
      console.log(
        `[${processedCount}/${totalPages}] Checking "${page.getTitle()}"...`,
      );

      const isEmpty = (page.getLines()?.length ?? 0) <= 1;

      if (isEmpty) {
        console.log(`  -> Page is empty. Checking for #WIP tag...`);
        const v = await this.scrapboxRepository.getPage(
          this.projectName,
          page.getTitle(),
        );

        if (v) {
          const content = v.getContent();
          if (!content.includes('#WIP')) {
            console.log(`  -> #WIP tag not found. Adding it.`);
            const newContent = content + '\n#WIP';
            const newPage = v.update({ content: newContent });
            await this.scrapboxRepository.post(newPage);
          } else {
            console.log(`  -> #WIP tag already exists. Skipping.`);
          }
        }
      }
    }
    console.log('Processing finished.');
  }
}
