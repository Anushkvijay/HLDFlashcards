# Deploying FlashSwipe to Vercel

Single Vercel project: React PWA served at `/`, Fastify API as a serverless function at `/api/*`
(same origin — no CORS needed). SQLite → **Neon Postgres**. Local Ollama → **Groq** (hosted
open-source LLM) in the cloud.

## Architecture on Vercel
- `apps/web` → static build (`apps/web/dist`), served at `/`.
- `api/[...path].ts` → serverless function wrapping the Fastify app; handles every `/api/*` route.
- `vercel.json` → build command, output dir, function `maxDuration`, SPA rewrite.
- `npm run vercel-build` → `prisma generate` + build shared/api/web.

## One-time setup

### 1. Neon Postgres (free)
1. Create a project at https://neon.tech → copy the **pooled** connection string.
2. Push the schema (from your machine, with that URL):
   ```bash
   DATABASE_URL="postgresql://...neon.../db?sslmode=require" \
     npm run db:push -w @flashswipe/api
   ```
3. (optional) seed a demo deck:
   ```bash
   DATABASE_URL="postgresql://...neon.../db?sslmode=require" \
     npm run seed -w @flashswipe/api
   ```

### 2. Groq API key (free)
https://console.groq.com/keys → create a key.

### 3. Deploy
Either the dashboard or the CLI.

**Dashboard:** Import `Anushkvijay/HLDFlashcards` at https://vercel.com/new. Framework preset
"Other". It reads `vercel.json`. Add env vars (below). Deploy.

**CLI:**
```bash
npx vercel login          # run yourself — interactive
npx vercel link           # link repo -> project
# add env vars (Production + Preview + Development):
npx vercel env add DATABASE_URL
npx vercel env add AI_PROVIDER      # value: groq
npx vercel env add GROQ_API_KEY
npx vercel env add GROQ_MODEL       # value: llama-3.3-70b-versatile
npx vercel --prod
```

## Environment variables (Vercel project settings)
| Var | Value |
|-----|-------|
| `DATABASE_URL` | Neon pooled connection string |
| `AI_PROVIDER` | `groq` |
| `GROQ_API_KEY` | from Groq console |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |

## Notes / limits
- **Function timeout:** scrape + Groq usually < 10s. Big pages may approach the 60s cap
  (`maxDuration` in `vercel.json`; hobby plan caps lower). Phase 3 moves generation to a queue.
- **Local dev also uses Postgres now** — set `DATABASE_URL` to your Neon string in `apps/api/.env`
  (or run a local Postgres). Keep `AI_PROVIDER=ollama` locally to use gemma3:4b.
- Cold starts: first request after idle is slower (Fastify + Prisma init).
