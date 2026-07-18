import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { config } from "./lib/config.js";
import { deckRoutes } from "./routes/decks.js";

/** Builds the Fastify app (not listening). Used by both the local server and the serverless entry. */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });

  app.get("/api/health", async () => ({ ok: true, aiProvider: config.aiProvider }));
  await app.register(deckRoutes);

  return app;
}
