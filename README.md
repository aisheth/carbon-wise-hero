# 🌱 Carbon Coach

AI-powered carbon footprint tracking, weekly eco-missions, and a personal sustainability coach.

## Features

- 🔐 **Auth** — Email + Google (managed by Lovable Cloud)
- 📋 **Carbon Assessment** — 5 categories (transport, electricity, food, shopping, waste)
- 📊 **Dashboard** — total footprint, monthly trend, category pie, biggest sources
- 🌍 **Impact Dashboard** — translates CO₂ avoided into trees, water, and energy equivalents
- ✨ **Top 3 AI Recommendations** — ranked by estimated carbon reduction
- 🤖 **AI Coach** — streaming chat powered by Lovable AI (Google Gemini)
- 🎯 **Weekly Eco Missions** — auto-generated, ranked by your worst categories
- 🛡️ **Verified Actions** — upload photo proof for completed missions (pending/approved/rejected)
- 🤝 **Community Challenges** — join collective goals and watch shared progress
- 🧪 **Carbon Savings Simulator** — live "what-if" sliders
- 🧾 **Receipt Scanner** — paste OCR text, get item-level CO₂ estimates
- 🏆 **Gamification** — points, badges, streaks, leaderboard

## Stack

| Concern   | Choice                                                                        |
| --------- | ----------------------------------------------------------------------------- |
| Framework | **TanStack Start** (React 19 + Vite 7)                                        |
| Language  | TypeScript (strict mode)                                                      |
| Styling   | Tailwind CSS v4 + shadcn/ui                                                   |
| Backend   | **Lovable Cloud** (Supabase under the hood — managed Postgres, Auth, Storage) |
| AI        | **Lovable AI Gateway** (Google Gemini, no external key required)              |
| Charts    | Recharts                                                                      |
| State     | TanStack Query                                                                |
| Tests     | Vitest + React Testing Library + jsdom                                        |
| CI        | GitHub Actions                                                                |

> The original brief asked for Next.js + Firebase + OpenAI. Lovable's runtime is TanStack Start + Lovable Cloud (Supabase) + Lovable AI Gateway, which give us the same capabilities (SSR, auth, DB, storage, server functions, AI) without external accounts or API keys.

## Architecture

```
src/
  lib/
    carbon.ts            # pure calc engine (fully unit-tested)
    missions.ts          # deterministic weekly mission generator
    receipt.ts           # item-keyword → CO2 estimator
    ai-gateway.server.ts # Lovable AI provider (server-only)
  components/
    app-shell.tsx        # sidebar + mobile nav
    ui/                  # shadcn primitives
  integrations/supabase/ # auto-generated client + auth middleware
  routes/
    __root.tsx           # head, providers, auth listener
    index.tsx            # public landing page
    auth.tsx             # email + Google sign in
    api/chat.ts          # streaming AI Coach endpoint
    _authenticated/      # route group gated by Supabase session
      dashboard.tsx
      assessment.tsx
      coach.tsx
      missions.tsx
      simulator.tsx
      scanner.tsx
      leaderboard.tsx
tests/
  unit/                  # carbon, missions, receipt
  integration/           # data-layer with mocked Supabase
  components/            # UI smoke tests
```

### Clean architecture principles applied

- Pure business logic (`lib/carbon.ts`, `lib/missions.ts`, `lib/receipt.ts`) has **no I/O dependencies** and is fully unit-testable.
- Server-only code is suffixed `.server.ts` and never imported by client code.
- Database access goes through Supabase RLS policies (every table scoped to `auth.uid()`).
- Error boundaries are wired in `__root.tsx` (`errorComponent` + `notFoundComponent`).

## Database schema

| Table                            | Purpose                                                        |
| -------------------------------- | -------------------------------------------------------------- |
| `profiles`                       | display_name, avatar, points, streaks (auto-created on signup) |
| `assessments`                    | per-submission inputs + category breakdown + score             |
| `emissions_log`                  | monthly trend snapshots                                        |
| `missions`                       | weekly auto-generated goals, completion tracking               |
| `badges` / `user_badges`         | seeded achievements + earned set                               |
| `chat_threads` / `chat_messages` | AI Coach history                                               |
| `receipts`                       | OCR text + parsed items + CO₂ estimate                         |

RLS is enabled on every table. All policies scope to `auth.uid()`, except `profiles` SELECT which is broad so the leaderboard works.

## Local setup

```bash
bun install
bun run dev          # http://localhost:5173
```

Environment is wired automatically by Lovable Cloud — no manual `.env` setup.

## Testing

```bash
bun run test         # watch
bun run test:run     # single CI run
bun run test:coverage
```

Coverage targets (in `vitest.config.ts`): **80% lines / statements / functions, 70% branches** on `src/lib` and `src/components`. UI primitives under `src/components/ui` are excluded as they're vendored from shadcn.

Test layers:

- **Unit**: carbon calculation engine, score function, recommendation engine, mission generator, receipt parser, utility helpers — all pure, deterministic, fast.
- **Integration**: data-layer with a fully-mocked Supabase client; verifies assessment writes and mission updates use the correct tables/payloads.
- **Component**: smoke tests for shadcn-derived primitives.

### Adding E2E

A full E2E suite (Playwright/Cypress) requires test accounts and a running database. Recommended pattern:

```bash
bun add -d @playwright/test
bunx playwright install --with-deps
```

Then create `e2e/` specs that sign up a throwaway user, take the assessment, and verify the dashboard renders the expected score. CI provisions a test Lovable Cloud project per branch.

## CI / CD

`.github/workflows/ci.yml` runs on every push/PR:

1. `bun install --frozen-lockfile`
2. `bun run lint`
3. `bunx tsc --noEmit`
4. `bunx vitest run --coverage` → uploads `coverage/` artifact
5. `bun run build` (gated on tests passing)

## Accessibility

- All interactive elements use semantic HTML (`<button>`, `<a>`, `<label>`).
- Icon-only buttons carry `aria-label`.
- Forms validated client-side with Zod and clear inline messages.
- Color tokens defined in `oklch` for predictable contrast in light/dark.
- `h-dvh` used for full-height layouts to respect mobile viewports.

## Documentation

Deep-dive docs live under [`docs/`](./docs):

- [Architecture](./docs/ARCHITECTURE.md) — layering, request lifecycle, mermaid diagram
- [Database schema](./docs/DATABASE.md) — full ER diagram and RLS surface
- [Security](./docs/SECURITY.md) — auth, RLS, storage, secret handling
- [Testing](./docs/TESTING.md) — layers, coverage thresholds, CI
- [API](./docs/API.md) — `/api/chat` endpoint and database RPCs

## Roadmap

- Real image OCR for receipts (Google Vision or Tesseract.js)
- Threaded AI Coach conversations (server fn already provisions `chat_threads`)
- Real-time leaderboard updates via Lovable Cloud Realtime
- Apple sign-in
- Push notifications for mission reminders
- Admin review queue for verified-action proofs
