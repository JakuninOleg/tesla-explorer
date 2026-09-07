# Tesla Explorer

AI-planned leisure routes for Tesla drivers exploring the USA — maps, cinematic playback, and charging-aware itineraries via [Go-Ai](https://github.com/JakuninOleg/Go-Ai).

## Stack

- Next.js (App Router) + React + TypeScript + Tailwind CSS v4
- Vitest (required in CI / ship gate)
- Auth.js + Neon (in progress)
- next-intl (en / ru) + light/dark theme
- Mapbox (planned)
- Go-Ai gateway for LLM calls (server-only)
- PWA (manifest + shell service worker + install CTA)

## Local setup

```bash
npm ci
cp .env.example .env.local
# fill GO_AI_* and other keys as needed
npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (required) |
| `npm run build` | Production build |

## CI / CD

- **CI:** GitHub Actions on `main` and PRs — lint, typecheck, **test**, build (`.github/workflows/ci.yml`).
- **CD:** Vercel deploys from `main` (and Preview deploys on PRs).
- **Ship gate:** eslint → tests → Bugbot/security review → build (see `AGENTS.md`).

## Agent docs

See [`AGENTS.md`](./AGENTS.md) for engineering standards and the Go-Ai integration skills under `.cursor/skills/`.
