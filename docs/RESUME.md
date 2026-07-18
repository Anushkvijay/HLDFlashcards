# Resume — FlashSwipe (handoff)

Last worked: 2026-07-18. Pick up here tomorrow.

## Where things stand
- **Design doc** (`docs/DESIGN.md`) ✅
- **MVP** ✅ built + verified: React PWA swipe deck + Fastify API (scrape → AI → persist).
- **gemma3:4b** wired via Ollama for local dev ✅ (proven generating cards).
- **Vercel-ready** ✅ code committed & pushed (`main`, commit `fb35ea9`) — but **not deployed yet**.

Repo: https://github.com/Anushkvijay/HLDFlashcards.git

## Do next — deploy (needs your accounts, ~5 min)
1. **Neon** — create free Postgres at neon.tech, copy the **pooled** URL. Then push schema:
   ```bash
   DATABASE_URL="postgresql://...neon.../db?sslmode=require" npm run db:push -w @flashswipe/api
   ```
2. **Groq** — free key at https://console.groq.com/keys
3. **Deploy**:
   ```bash
   npx vercel login        # interactive — run in your terminal
   npx vercel link
   npx vercel env add DATABASE_URL     # Neon pooled url
   npx vercel env add AI_PROVIDER      # value: groq
   npx vercel env add GROQ_API_KEY     # your key
   npx vercel env add GROQ_MODEL       # value: llama-3.3-70b-versatile
   npx vercel --prod
   ```
   (or import the repo at vercel.com/new + add the 4 env vars.)

Full detail: `docs/DEPLOY.md`.

## Watch-outs
- **Local dev now needs Postgres** (schema off SQLite). Set `DATABASE_URL` to Neon in
  `apps/api/.env`; keep `AI_PROVIDER=ollama` locally for gemma3:4b. Old `dev.db` is orphaned.
- **Serverless import risk**: `api/[...path].ts` imports `apps/api/dist/app.js` (build output).
  Assumes Vercel runs `vercel-build` before bundling functions. If the first deploy errors on that
  import → switch handler to import source + add esbuild resolve for `.js`→`.ts`.
- **Timeout**: scrape + Groq usually <10s; huge pages may near the 60s cap. Phase 3 queue fixes it.

## Run locally (reminder)
```bash
npm install
npm run db:push -w @flashswipe/api    # needs a Postgres DATABASE_URL now
npm run dev:api                        # :3001
npm run dev:web                        # :5173
```

## Phase 3 backlog (not started)
Auth/OAuth, cross-device sync, Redis+BullMQ queue, AI images (Mermaid/SVG), search, collections,
per-card AI actions, analytics/heatmap/streaks, FSRS spaced repetition.
