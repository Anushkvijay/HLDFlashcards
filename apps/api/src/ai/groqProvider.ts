import { GeneratedCardsSchema, type GeneratedCard, type ScrapedDoc } from "@flashswipe/shared";
import type { AIProvider } from "./provider.js";
import { promptBuilder } from "./promptBuilder.js";
import { parseCards } from "./ollamaProvider.js";

/**
 * Hosted open-source LLM via Groq (OpenAI-compatible API). Fast enough for a serverless
 * request path. Runs Llama/Qwen/etc. Adapter pattern — same interface as Mock/Ollama.
 */
export class GroqProvider implements AIProvider {
  constructor(
    private apiKey: string,
    private model: string,
    private baseUrl: string,
  ) {
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  }

  name() {
    return `groq:${this.model}`;
  }

  async generateCards(doc: ScrapedDoc): Promise<GeneratedCard[]> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              promptBuilder.system() +
              '\nReturn a JSON object of the form { "cards": [ ...card objects... ] }.',
          },
          { role: "user", content: promptBuilder.user(doc) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return parseCards(data.choices?.[0]?.message?.content ?? "[]");
  }
}
