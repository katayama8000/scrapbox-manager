import { GenerativeAIProvider } from "@/application/ports/generative-ai-provider.ts";
import { GenerativeAIProviderImpl } from "@/infrastructure/adapters/generative-ai/generative-ai-provider-impl.ts";

export type GenerativeAIBackend = "sarashina" | "gemini";

type ProviderConfig = {
  backend: GenerativeAIBackend;
  apiKey: string;
};

// now I want to use sarashina as the default backend but if you want to switch to gemini, you can modify this function accordingly.
export const getGenerativeAIBackendFromEnv = (): GenerativeAIBackend => {
  return "sarashina";
};

export const createGenerativeAIProviderFromEnv = (): GenerativeAIProvider => {
  const config = loadProviderConfig();

  return new GenerativeAIProviderImpl(config.apiKey, {
    provider: config.backend,
  });
};

const loadProviderConfig = (): ProviderConfig => {
  const apiKey = Deno.env.get("SARASHINA_API_KEY") ?? "";
  if (!apiKey) {
    throw new Error("SARASHINA_API_KEY is required.");
  }

  return { backend: "sarashina", apiKey };
};
