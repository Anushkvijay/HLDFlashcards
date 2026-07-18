import { buildApp } from "./app.js";
import { config } from "./lib/config.js";

const app = await buildApp();

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
  app.log.info(`FlashSwipe API on :${config.port} (AI provider: ${config.aiProvider})`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
