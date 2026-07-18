import type { GeneratedCard, ScrapedDoc } from "@flashswipe/shared";

/** Strategy interface over an LLM. Swap impls via env (see factory). */
export interface AIProvider {
  name(): string;
  generateCards(doc: ScrapedDoc): Promise<GeneratedCard[]>;
}
