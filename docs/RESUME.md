# Resume — FlashSwipe (handoff)

Last worked: 2026-07-19. **Deployed to Vercel and working end-to-end.**

## Where things stand
- **Design doc** (`docs/DESIGN.md`) ✅
- **MVP** ✅ built + verified: React PWA swipe deck + Fastify API (scrape → AI → persist).
- **Deployed on Vercel** ✅ **LIVE:** https://flashcards-eight-ebon.vercel.app
  - Frontend (PWA) served at `/`; Fastify API as serverless fn at `/api/*` (same origin).
  - DB: **Neon Postgres** (schema pushed, decks/cards persist).
  - LLM: **Groq** `llama-3.3-70b-versatile` (free tier). Verified generating cards.

Repo: https://github.com/Anushkvijay/HLDFlashcards.git

## Deploy bugs found + fixed (this session)
Serverless API was returning 500 / hanging. Four separate causes, all fixed:
1. **ERR_REQUIRE_ESM** — `api/[...path].ts` is bundled CommonJS but imports ESM
   `apps/api/dist/app.js`. Fixed: dynamic `import()` instead of static import.
2. **`server.emit("request")` didn't dispatch** to Fastify on Vercel's runtime → hang.
   Fixed: capture Fastify's raw handler via `serverFactory` (`app.ts` → `getRequestHandler()`)
   and call it directly; handler awaits `res` `finish`/`close`.
3. **`@flashswipe/shared` `exports` pointed at `src/index.ts`** (TS source) → Node runtime
   `ERR_MODULE_NOT_FOUND` (can't import `.ts`). **This was the real crash.** Fixed:
   `packages/shared/package.json` `exports` → `dist/index.js` + `dist/index.d.ts`.
4. **Vercel catch-all only matched one path segment** — generated route was `^/api/([^/]+)$`,
   so `/api/decks/:id` (depth ≥2) 404'd at the edge. Fixed: explicit rewrite in `vercel.json`
   `{"source":"/api/(.*)","destination":"/api/[...path]?path=$1"}` (matches all depths) +
   the handler reconstructs the real URL from the `path` query param before dispatching.

Also: **Vercel Authentication** (`ssoProtection: all_except_custom_domains`) was walling off
`/api` on `.vercel.app` URLs → requests never reached the function. Disabled in project
Settings → Deployment Protection. (Re-enable as "Standard Protection" if you only want
previews protected.)

## Verified live
- `GET /api/health` → 200 `{ok:true,aiProvider:"groq"}`
- `GET /api/decks`, `/api/decks/:id`, `/api/decks/:id/cards` → 200 (reads Neon)
- `POST /api/decks {url}` → scrape → Groq → persist → 200 with cards (tested 3 + 9 cards)
- `/` + `/manifest.webmanifest` → 200

## Do next
- **ROTATE the Neon password** — it was pasted into a chat/terminal this session. Neon
  dashboard → Roles → reset `neondb_owner` password → update `DATABASE_URL` env var in Vercel
  (`vercel env rm DATABASE_URL` + `vercel env add DATABASE_URL` for all 3 environments).
  No `db:push` needed after rotation.
- (optional) Add a **custom domain** so protection can be re-enabled without blocking the API.
- Redeploy: `npx vercel --prod` (CLI uploads local working tree). GitHub auto-connect failed
  during `vercel link` (repo access) — connect it in the dashboard if you want git-push deploys.

## Env vars (Vercel — all set)
`DATABASE_URL` (Neon pooled), `AI_PROVIDER=groq`, `GROQ_API_KEY`, `GROQ_MODEL=llama-3.3-70b-versatile`

## Run locally (reminder)
```bash
npm install
npm run build -w @flashswipe/shared     # shared must be built (exports now point to dist)
npm run db:push -w @flashswipe/api       # needs a Postgres DATABASE_URL in apps/api/.env
npm run dev:api                          # :3001
npm run dev:web                          # :5173
```
Note: `@flashswipe/shared` `exports` now resolve to `dist/` — build it before running the API
or web locally (the top-level `npm run build` does this in order).

## Phase 3 backlog (not started)
Auth/OAuth, cross-device sync, Redis+BullMQ queue, AI images (Mermaid/SVG), search, collections,
per-card AI actions, analytics/heatmap/streaks, FSRS spaced repetition.
