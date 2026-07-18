import type { GeneratedCard, ScrapedDoc } from "@flashswipe/shared";
import type { AIProvider } from "./provider.js";

/**
 * Deterministic provider — no GPU / no network. Turns each scraped section into a card
 * by extracting sentences. Good enough to exercise the full pipeline and UI offline.
 */
export class MockProvider implements AIProvider {
  name() {
    return "mock";
  }

  async generateCards(doc: ScrapedDoc): Promise<GeneratedCard[]> {
    return doc.sections
      .filter((s) => s.text.trim().length > 0)
      .map((s) => {
        const sentences = splitSentences(s.text);
        const explanation = sentences.slice(0, 2).join(" ").slice(0, 320);
        const takeaways = sentences.slice(0, 3).map((x) => trimTo(x, 90));
        return {
          title: trimTo(s.heading, 80),
          explanation: explanation || trimTo(s.text, 240),
          keyTakeaways: takeaways.length ? takeaways : [trimTo(s.text, 90)],
          interviewTips: [`Be ready to explain "${trimTo(s.heading, 50)}" in one minute.`],
          commonMistakes: ["Reciting definitions without a concrete example."],
          analogy: null,
          difficulty: "medium" as const,
          tags: keywords(s.heading),
          readingSeconds: Math.min(30, Math.max(15, Math.round(explanation.length / 12))),
        };
      });
  }
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function trimTo(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

function keywords(heading: string): string[] {
  return heading
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);
}
