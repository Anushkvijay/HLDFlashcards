import { z } from "zod";

/** Progress status for a card (per user; MVP is single anonymous user). */
export const CardStatus = z.enum(["new", "completed", "bookmarked", "difficult"]);
export type CardStatus = z.infer<typeof CardStatus>;

export const Difficulty = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof Difficulty>;

/** A single revision flashcard. Kept short — 15–30s read. */
export const CardSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  position: z.number().int(),
  title: z.string(),
  explanation: z.string(),
  keyTakeaways: z.array(z.string()),
  interviewTips: z.array(z.string()),
  commonMistakes: z.array(z.string()),
  analogy: z.string().nullable().optional(),
  difficulty: Difficulty.default("medium"),
  tags: z.array(z.string()).default([]),
  readingSeconds: z.number().int().default(20),
  status: CardStatus.default("new"),
});
export type Card = z.infer<typeof CardSchema>;

/** LLM output shape (before we assign ids/positions). */
export const GeneratedCardSchema = CardSchema.pick({
  title: true,
  explanation: true,
  keyTakeaways: true,
  interviewTips: true,
  commonMistakes: true,
  analogy: true,
  difficulty: true,
  tags: true,
  readingSeconds: true,
}).partial({
  analogy: true,
  difficulty: true,
  tags: true,
  readingSeconds: true,
});
export type GeneratedCard = z.infer<typeof GeneratedCardSchema>;

export const GeneratedCardsSchema = z.array(GeneratedCardSchema);

export const DeckStatus = z.enum(["pending", "ready", "failed"]);
export type DeckStatus = z.infer<typeof DeckStatus>;

export const DeckSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceUrl: z.string(),
  status: DeckStatus,
  createdAt: z.string(),
  cardCount: z.number().int().optional(),
  cards: z.array(CardSchema).optional(),
});
export type Deck = z.infer<typeof DeckSchema>;

/** POST /api/decks body. */
export const CreateDeckSchema = z.object({
  url: z.string().url(),
});
export type CreateDeck = z.infer<typeof CreateDeckSchema>;

/** PATCH /api/cards/:id/progress body. */
export const UpdateProgressSchema = z.object({
  status: CardStatus,
});
export type UpdateProgress = z.infer<typeof UpdateProgressSchema>;

/** Scraped document from a source URL. */
export interface ScrapedSection {
  heading: string;
  text: string;
}
export interface ScrapedDoc {
  title: string;
  sourceUrl: string;
  sections: ScrapedSection[];
}
