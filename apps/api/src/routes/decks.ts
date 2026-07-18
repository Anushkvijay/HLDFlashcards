import type { FastifyInstance } from "fastify";
import { CreateDeckSchema, UpdateProgressSchema } from "@flashswipe/shared";
import { DeckService } from "../services/deckService.js";
import { ProgressService } from "../services/progressService.js";
import { HttpError } from "../services/scraperService.js";

const decks = new DeckService();
const progress = new ProgressService();

export async function deckRoutes(app: FastifyInstance) {
  // Create deck from URL (MVP: synchronous)
  app.post("/api/decks", async (req, reply) => {
    const parsed = CreateDeckSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "Invalid body", details: parsed.error.flatten() } });
    }
    try {
      const deck = await decks.createFromUrl(parsed.data.url);
      return reply.status(201).send(deck);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.get("/api/decks", async (req, reply) => {
    const q = req.query as { page?: string; pageSize?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize ?? 20)));
    return reply.send(await decks.list(page, pageSize));
  });

  app.get("/api/decks/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const deck = await decks.get(id);
    if (!deck) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Deck not found" } });
    return reply.send(deck);
  });

  app.get("/api/decks/:id/cards", async (req, reply) => {
    const { id } = req.params as { id: string };
    const deck = await decks.get(id);
    if (!deck) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Deck not found" } });
    return reply.send(deck.cards ?? []);
  });

  app.patch("/api/cards/:id/progress", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = UpdateProgressSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: "BAD_REQUEST", message: "Invalid status" } });
    }
    const card = await progress.setStatus(id, parsed.data.status);
    if (!card) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Card not found" } });
    return reply.send(card);
  });
}

function sendError(reply: any, err: unknown) {
  if (err instanceof HttpError) {
    return reply.status(err.status).send({ error: { code: "GENERATION_ERROR", message: err.message } });
  }
  reply.log.error(err);
  return reply.status(500).send({ error: { code: "INTERNAL", message: "Unexpected error" } });
}
