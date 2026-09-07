# Tesla Explorer

Pet / portfolio app: AI-planned leisure routes for newcomers in the USA who drive a Tesla — maps, cinematic playback, charging-aware itineraries via [Go-Ai](https://github.com/JakuninOleg/Go-Ai).

## Stack

- Next.js (App Router) + React + TypeScript + Tailwind CSS v4
- Auth.js + Neon (planned)
- Mapbox (planned)
- Go-Ai gateway for LLM calls (server-only)

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
| `npm run build` | Production build |

## CI / CD

- **CI:** GitHub Actions on `main` and PRs — lint, typecheck, build (`.github/workflows/ci.yml`).
- **CD:** Vercel deploys from `main` (and Preview deploys on PRs).

## Agent docs

See [`AGENTS.md`](./AGENTS.md) for engineering standards and the Go-Ai integration skills under `.cursor/skills/`.
