import { config } from "../lib/config.js";
import type { AIProvider } from "./provider.js";
import { MockProvider } from "./mockProvider.js";
import { OllamaProvider } from "./ollamaProvider.js";
import { GroqProvider } from "./groqProvider.js";

/** Factory — selects the AI provider by env. Defaults to Mock (no external deps). */
export function createAIProvider(): AIProvider {
  switch (config.aiProvider) {
    case "groq":
      return new GroqProvider(config.groqApiKey, config.groqModel, config.groqBaseUrl);
    case "ollama":
      return new OllamaProvider(config.ollamaUrl, config.ollamaModel);
    default:
      return new MockProvider();
  }
}

export type { AIProvider };
