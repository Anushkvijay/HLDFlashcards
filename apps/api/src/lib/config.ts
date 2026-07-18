export const config = {
  port: Number(process.env.PORT ?? 3001),
  aiProvider: (process.env.AI_PROVIDER ?? "mock") as "mock" | "ollama" | "groq",
  // Ollama (local dev)
  ollamaUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "gemma3:4b",
  // Groq (hosted open-source LLM — cloud/prod)
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  groqBaseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
};
