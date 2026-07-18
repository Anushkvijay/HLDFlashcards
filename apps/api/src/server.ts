import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { config } from "./lib/config.js";
import { deckRoutes } from "./routes/decks.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });

app.get("/api/health", async () => ({ ok: true, aiProvider: config.aiProvider }));

await app.register(deckRoutes);

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
  app.log.info(`FlashSwipe API on :${config.port} (AI provider: ${config.aiProvider})`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
