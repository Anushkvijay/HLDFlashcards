import http from "node:http";
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { config } from "./lib/config.js";
import { deckRoutes } from "./routes/decks.js";

/**
 * Fastify's raw (req, res) request handler, captured via serverFactory. The serverless
 * entry calls this directly — more reliable than `server.emit("request")`, which does not
 * dispatch to Fastify on Vercel's runtime (the request hangs until the function times out).
 */
export type NodeRequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;
let requestHandler: NodeRequestHandler | undefined;

/** Builds the Fastify app (not listening). Used by both the local server and the serverless entry. */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    // Capture the handler Fastify would hand to http.createServer, so serverless can call it directly.
    serverFactory: (handler) => {
      requestHandler = handler as NodeRequestHandler;
      return http.createServer(handler);
    },
  });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });

  app.get("/api/health", async () => ({ ok: true, aiProvider: config.aiProvider }));
  await app.register(deckRoutes);

  return app;
}

/** Returns Fastify's raw Node request handler. Call `buildApp()` + `app.ready()` first. */
export function getRequestHandler(): NodeRequestHandler | undefined {
  return requestHandler;
}
