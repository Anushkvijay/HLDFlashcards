export const config = {
  port: Number(process.env.PORT ?? 3001),
  aiProvider: (process.env.AI_PROVIDER ?? "mock") as "mock" | "ollama",
  ollamaUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5:7b",
};
