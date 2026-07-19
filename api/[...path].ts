import type { IncomingMessage, ServerResponse } from "node:http";

// Build the Fastify app once per warm serverless instance and capture its raw request handler.
// Dynamic import: this handler is bundled as CommonJS, but dist/app.js is ESM —
// a static import would compile to require() and throw ERR_REQUIRE_ESM at runtime.
const handlerPromise = import("../apps/api/dist/app.js").then(async ({ buildApp, getRequestHandler }) => {
  const app = await buildApp();
  await app.ready();
  const h = getRequestHandler();
  if (!h) throw new Error("Fastify request handler not captured");
  return h;
});

/**
 * Vercel serverless entry. Catch-all for every /api/* request. Dispatches to Fastify via its
 * captured raw handler and resolves only when the response has finished, so Vercel keeps the
 * invocation alive until the response flushes.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const dispatch = await handlerPromise;
  // Vercel rewrites every /api/* request to this catch-all as `/api/[...path]?path=<rest>`
  // (see vercel.json). Reconstruct the real URL so Fastify's router matches the actual path.
  try {
    const u = new URL(req.url ?? "/", "http://localhost");
    const p = u.searchParams.get("path");
    if (p !== null) {
      u.searchParams.delete("path");
      const qs = u.searchParams.toString();
      req.url = "/api/" + p + (qs ? "?" + qs : "");
    }
  } catch {
    /* leave req.url as-is */
  }
  await new Promise<void>((resolve) => {
    res.on("close", resolve);
    res.on("finish", resolve);
    dispatch(req, res);
  });
}

export const config = { maxDuration: 60 };
