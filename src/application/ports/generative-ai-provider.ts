export interface GenerativeAIProvider {
  generateContentJa(prompt: string): Promise<string>;
  generateContentEn(prompt: string): Promise<string>;
  selectEnglishPages(titles: string[]): Promise<string[]>;
  generateEnglishQuestions(prompt: string): Promise<string[]>;
}
