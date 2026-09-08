# Tesla Explorer

AI-planned leisure routes for Tesla drivers exploring the USA — personal cabinet, home/work anchors, Mapbox route cinema, and charging-aware itineraries via [Go-Ai](https://github.com/JakuninOleg/Go-Ai).

**Not affiliated with Tesla, Inc.**

## Product loop

1. Sign in with Google → save **home** and **work** addresses (+ Tesla model, interests).
2. In the cabinet, brief a trip: start (home / work / other), **battery now**, hours, free-text intent  
   (e.g. “from office home for the kids, then explore nearby”).
3. Review a **proposed** plan → Approve / Adjust / Decline.
4. On an approved route: Mapbox map + **Play drive** cinema, Maps/YouTube place links, rating + notes  
   (notes feed the next plan).

## Stack

- Next.js (App Router) + React + TypeScript + Tailwind CSS v4
- Vitest (required in CI / ship gate)
- Auth.js + Google + Neon (Drizzle, DB sessions + profile + routes)
- next-intl (en / ru) + light/dark theme
- Mapbox (Geocoding, Directions, GL map)
- Go-Ai gateway for LLM calls (server-only)
- PWA (manifest + shell service worker + install CTA)

## Local setup

```bash
npm ci
cp .env.example .env.local
```

Fill `.env.local`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `http://localhost:3000` locally |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth Web client |
| `GO_AI_BASE_URL` / `GO_AI_SHARED_SECRET` | Go-Ai gateway |
| `GO_AI_MODEL` | optional, default `default` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox publishable token |

Google OAuth redirect: `http://localhost:3000/api/auth/callback/google`  
(and production: `https://<your-domain>/api/auth/callback/google`).

```bash
npm run db:push   # or apply SQL under drizzle/
npm run dev
```

## Demo checklist

- [ ] Sign in → onboarding with home + work (Mapbox suggest if token set)
- [ ] Cabinet greets you by name; plan from work with battery %
- [ ] Proposed route → Approve; map + Play drive; Maps/YouTube on stops
- [ ] Rate + notes; plan again and confirm preferences influence the prompt
- [ ] Locale en/ru and theme toggle

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (required) |
| `npm run build` | Production build |
| `npm run db:push` | Push Drizzle schema to Neon |

## CI / CD

- **CI:** GitHub Actions on `main` and PRs — lint, typecheck, **test**, build.
- **CD:** Vercel deploys from `main` (Preview on PRs).
- **Ship gate:** eslint → tests → Bugbot/security review → build (see `AGENTS.md`).

## Agent docs

See [`AGENTS.md`](./AGENTS.md) for engineering standards and skills under `.cursor/skills/` / `.agents/skills/`.
