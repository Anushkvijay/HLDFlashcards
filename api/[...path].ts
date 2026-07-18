import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../apps/api/dist/app.js";

// Build the Fastify app once per warm serverless instance.
const appPromise = buildApp().then(async (app) => {
  await app.ready();
  return app;
});

/**
 * Vercel serverless entry. This catch-all handles every /api/* request and hands it to
 * Fastify, whose routes are registered under /api/... (same paths as local dev).
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  app.server.emit("request", req, res);
}

export const config = { maxDuration: 60 };
