# FlashSwipe

Flashcard revision PWA for interview prep — Inshorts-style. Paste an interview-prep URL,
get AI-generated swipeable revision cards.

- **Design doc:** [`docs/DESIGN.md`](docs/DESIGN.md)
- **Stack:** React + Vite + Tailwind + Framer Motion (PWA) · Node + Fastify + Prisma + SQLite
- **AI:** pluggable `AIProvider` — `mock` (default, no deps) or `ollama` (open-source LLM)

## Quick start

```bash
npm install                      # installs all workspaces

# backend
npm run db:push -w @flashswipe/api     # create SQLite schema
npm run seed   -w @flashswipe/api      # optional: seed a demo deck
npm run dev:api                        # API on :3001

# frontend (separate terminal)
npm run dev:web                        # PWA on :5173 (proxies /api -> :3001)
```

Open http://localhost:5173, paste a HelloInterview URL (e.g.
`https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction`), swipe.

## Using a real LLM (optional)

```bash
# install Ollama, then:
ollama pull qwen2.5:7b
# in apps/api/.env set:  AI_PROVIDER=ollama
npm run dev:api
```

## Layout

```
packages/shared   # Card/Deck/Progress types + Zod schemas (shared FE/BE)
apps/api          # Fastify API: scrape -> AI -> persist
apps/web          # React PWA: URL form + swipe deck + offline cache
```

## Controls

Swipe up/down · `↑`/`↓` arrows · `Space` next · `B` bookmark · `D` mark hard.

## Roadmap (Phase 3)

Auth + cross-device sync, Postgres+Redis, AI images (Mermaid/SVG), search, collections,
per-card AI actions, analytics/heatmap/streaks, spaced repetition (FSRS), background sync.
See `docs/DESIGN.md`.
