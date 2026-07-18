import { nanoid } from "nanoid";
import type { Card, Deck, GeneratedCard } from "@flashswipe/shared";
import { prisma } from "../lib/prisma.js";
import { ScraperService, HttpError } from "./scraperService.js";
import { createAIProvider, type AIProvider } from "../ai/index.js";

/** Orchestrates deck creation: scrape -> AI generate -> persist. Reads decks/cards. */
export class DeckService {
  private scraper = new ScraperService();
  private ai: AIProvider = createAIProvider();

  /** MVP: synchronous create (scrape+generate in request). Full app moves this to a queue. */
  async createFromUrl(url: string): Promise<Deck> {
    const doc = await this.scraper.scrape(url);
    let generated: GeneratedCard[] = [];
    try {
      generated = await this.ai.generateCards(doc);
    } catch (err) {
      throw new HttpError(502, `AI generation failed: ${(err as Error).message}`);
    }
    if (generated.length === 0) {
      throw new HttpError(422, "No cards could be generated from that URL");
    }

    const deckId = nanoid();
    await prisma.deck.create({
      data: {
        id: deckId,
        title: doc.title,
        sourceUrl: url,
        status: "ready",
        cards: {
          create: generated.map((g, i) => ({
            id: nanoid(),
            position: i,
            title: g.title,
            explanation: g.explanation,
            keyTakeaways: JSON.stringify(g.keyTakeaways),
            interviewTips: JSON.stringify(g.interviewTips),
            commonMistakes: JSON.stringify(g.commonMistakes),
            analogy: g.analogy ?? null,
            difficulty: g.difficulty ?? "medium",
            tags: JSON.stringify(g.tags ?? []),
            readingSeconds: g.readingSeconds ?? 20,
            status: "new",
          })),
        },
      },
    });
    return (await this.get(deckId))!;
  }

  async list(page = 1, pageSize = 20): Promise<{ items: Deck[]; page: number; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.deck.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { cards: true } } },
      }),
      prisma.deck.count(),
    ]);
    return {
      items: rows.map((d) => ({
        id: d.id,
        title: d.title,
        sourceUrl: d.sourceUrl,
        status: d.status as Deck["status"],
        createdAt: d.createdAt.toISOString(),
        cardCount: d._count.cards,
      })),
      page,
      total,
    };
  }

  async get(id: string): Promise<Deck | null> {
    const d = await prisma.deck.findUnique({
      where: { id },
      include: { cards: { orderBy: { position: "asc" } } },
    });
    if (!d) return null;
    return {
      id: d.id,
      title: d.title,
      sourceUrl: d.sourceUrl,
      status: d.status as Deck["status"],
      createdAt: d.createdAt.toISOString(),
      cardCount: d.cards.length,
      cards: d.cards.map(toCard),
    };
  }
}

/** Map a Prisma row (JSON stored as strings for SQLite) to the shared Card type. */
export function toCard(c: {
  id: string;
  deckId: string;
  position: number;
  title: string;
  explanation: string;
  keyTakeaways: string;
  interviewTips: string;
  commonMistakes: string;
  analogy: string | null;
  difficulty: string;
  tags: string;
  readingSeconds: number;
  status: string;
}): Card {
  return {
    id: c.id,
    deckId: c.deckId,
    position: c.position,
    title: c.title,
    explanation: c.explanation,
    keyTakeaways: safeParse(c.keyTakeaways),
    interviewTips: safeParse(c.interviewTips),
    commonMistakes: safeParse(c.commonMistakes),
    analogy: c.analogy,
    difficulty: c.difficulty as Card["difficulty"],
    tags: safeParse(c.tags),
    readingSeconds: c.readingSeconds,
    status: c.status as Card["status"],
  };
}

function safeParse(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
