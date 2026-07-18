import { config } from "../lib/config.js";
import type { AIProvider } from "./provider.js";
import { MockProvider } from "./mockProvider.js";
import { OllamaProvider } from "./ollamaProvider.js";

/** Factory — selects the AI provider by env. Defaults to Mock (no external deps). */
export function createAIProvider(): AIProvider {
  if (config.aiProvider === "ollama") {
    return new OllamaProvider(config.ollamaUrl, config.ollamaModel);
  }
  return new MockProvider();
}

export type { AIProvider };
