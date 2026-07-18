import { GeneratedCardsSchema, type GeneratedCard, type ScrapedDoc } from "@flashswipe/shared";
import type { AIProvider } from "./provider.js";
import { promptBuilder } from "./promptBuilder.js";

/** JSON schema passed to Ollama structured outputs — forces an object with a `cards` array.
 *  Small models (e.g. gemma3:4b) otherwise return a single object; this guarantees the shape. */
const cardItemSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    explanation: { type: "string" },
    keyTakeaways: { type: "array", items: { type: "string" } },
    interviewTips: { type: "array", items: { type: "string" } },
    commonMistakes: { type: "array", items: { type: "string" } },
    analogy: { type: ["string", "null"] },
    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
    tags: { type: "array", items: { type: "string" } },
    readingSeconds: { type: "integer" },
  },
  required: ["title", "explanation", "keyTakeaways", "interviewTips", "commonMistakes"],
} as const;

const responseSchema = {
  type: "object",
  properties: { cards: { type: "array", items: cardItemSchema } },
  required: ["cards"],
} as const;

/** Calls a local Ollama server. Open-source LLM, no API key. Adapter pattern over Ollama HTTP. */
export class OllamaProvider implements AIProvider {
  constructor(
    private url: string,
    private model: string,
  ) {}

  name() {
    return `ollama:${this.model}`;
  }

  async generateCards(doc: ScrapedDoc): Promise<GeneratedCard[]> {
    const res = await fetch(`${this.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: responseSchema, // structured output
        options: { temperature: 0.4 },
        messages: [
          { role: "system", content: promptBuilder.system() },
          { role: "user", content: promptBuilder.user(doc) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { message?: { content?: string } };
    return parseCards(data.message?.content ?? "[]");
  }
}

/** Tolerant parse: accepts an array, `{cards:[...]}`, or a single card object. Validates with Zod. */
export function parseCards(raw: string): GeneratedCard[] {
  let parsed: unknown = tryJson(raw);

  // unwrap common object wrappers
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    const wrapperKey = ["cards", "flashcards", "items", "result"].find((k) => Array.isArray(obj[k]));
    if (wrapperKey) parsed = obj[wrapperKey];
    else if ("title" in obj && "explanation" in obj) parsed = [obj]; // single card -> array
  }

  const result = GeneratedCardsSchema.safeParse(parsed);
  return result.success ? result.data : [];
}

function tryJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    return [];
  }
}
