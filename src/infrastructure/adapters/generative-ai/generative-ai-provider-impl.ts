import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export class GenerativeAIProviderImpl implements GenerativeAIProvider {
  private readonly ai: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(prompt: string, modelName: string): Promise<string> {
    const model = this.ai.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }

  async generateContentJa(prompt: string): Promise<string> {
    return await this.generateContent(prompt, "gemini-2.5-flash-lite");
  }

  async generateContentEn(prompt: string): Promise<string> {
    const v = summaryTemplate(prompt);
    return await this.generateContent(v, "gemini-2.5-flash-lite");
  }

  // Asks for a JSON array so the model has no room for the Markdown it writes
  // by default, which Scrapbox shows as literal `**`.
  async generateEnglishQuestions(prompt: string): Promise<string[]> {
    const model = this.ai.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          minItems: 3,
          maxItems: 3,
        },
      },
    });
    const result = await model.generateContent(questionTemplate(prompt));
    return JSON.parse(result.response.text());
  }
}

const summaryTemplate = (v: string) =>
  `Summarize the content in one paragraph and tell me what I should focus on next. Do not collect, restate, or include items that are already covered by the template (average wake-up time, average sleep quality, and Today's Tasks). Please follow Scrapbox format by starting every line with 「>」 and write in English. The content is below:\n\n${v}`;

const questionTemplate = (v: string) =>
  `Please create 3 questions in English that make sentences based on the following content. The content is below:\n\n${v}`;
