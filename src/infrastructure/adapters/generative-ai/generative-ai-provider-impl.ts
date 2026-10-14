import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ProviderType = "gemini" | "sarashina";

type GenerativeAIProviderOptions = {
  provider?: ProviderType;
  model?: string;
  baseUrl?: string;
};

export class GenerativeAIProviderImpl implements GenerativeAIProvider {
  private readonly provider: ProviderType;
  private readonly ai: GoogleGenerativeAI | null;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string, options: GenerativeAIProviderOptions = {}) {
    this.provider = options.provider ?? "gemini";
    this.model = options.model ??
      (this.provider === "sarashina"
        ? "sarashina3-mini"
        : "gemini-2.5-flash-lite");
    this.baseUrl = options.baseUrl ?? "https://api.sarashina.ai/v1";
    this.apiKey = apiKey;
    this.ai = this.provider === "gemini"
      ? new GoogleGenerativeAI(apiKey)
      : null;
  }

  private async generateContent(prompt: string): Promise<string> {
    if (this.provider === "gemini") {
      return await this.generateWithGemini(prompt);
    }

    return await this.generateWithSarashina(prompt);
  }

  private async generateWithGemini(prompt: string): Promise<string> {
    if (!this.ai) {
      throw new Error("Gemini client is not initialized.");
    }

    const model = this.ai.getGenerativeModel({ model: this.model });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private async generateWithSarashina(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Sarashina API request failed: ${response.status} ${response.statusText} - ${body}`,
      );
    }

    const data: unknown = await response.json();
    const content = extractMessageContent(data);
    if (!content) {
      throw new Error("Sarashina API returned an empty response content.");
    }

    return content;
  }

  async generateContentJa(prompt: string): Promise<string> {
    return await this.generateContent(prompt);
  }

  async generateContentEn(prompt: string): Promise<string> {
    const v = summaryTemplate(prompt);
    return await this.generateContent(v);
  }

  async generateEnglishQuestion(prompt: string): Promise<string> {
    const v = questionTemplate(prompt);
    return await this.generateContent(v);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object";
};

const extractMessageContent = (data: unknown): string | null => {
  if (!isRecord(data)) {
    return null;
  }

  const choices = data["choices"];
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const firstChoice = choices[0];
  if (!isRecord(firstChoice)) {
    return null;
  }

  const message = firstChoice["message"];
  if (!isRecord(message)) {
    return null;
  }

  const content = message["content"];
  if (typeof content !== "string") {
    return null;
  }

  return content.trim();
};

const summaryTemplate = (v: string) =>
  `Summarize the content in one paragraph and tell me what I should focus on next. Do not collect, restate, or include items that are already covered by the template (average wake-up time, average sleep quality, and Today's Tasks). Please follow Scrapbox format by starting every line with 「>」 and write in English. The content is below:\n\n${v}`;

const questionTemplate = (v: string) =>
  `Please create 3 questions in English that make sentences based on the following content. The content is below:\n\n${v}`;
