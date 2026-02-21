export interface GenerativeAIProvider {
  generateContentJa(prompt: string): Promise<string>;
  generateContentEn(prompt: string): Promise<string>;
}
