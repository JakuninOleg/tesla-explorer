<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tesla Explorer — Engineering Standards

## Project

Tesla Explorer is a pet / portfolio app: AI-planned leisure routes for newcomers
in the USA who drive a Tesla. After work or on weekends the user sets time,
mood, food preferences, and battery state; the app builds a route with optional
charging stops, cinematic map playback, and place context (reviews / video).

Not a production SaaS to sell. Optimize for craft: maps, motion, AI orchestration,
clean Next.js architecture — not feature sprawl.

## Stack
- Next.js (App Router) + React + TypeScript (strict) + Tailwind CSS v4
- Auth.js + Neon (PostgreSQL) — not Supabase for this repo
- Go-Ai gateway for LLM (`GO_AI_*`, server-only) — same pattern as Okhana
- Mapbox for map / route visualization
- Zod for request and AI structured-output validation
- Vitest for unit tests (required in CI and before every ship)

## Code Rules
- Strict TypeScript. No `any`.
- Prefer Server Components. Use `'use client'` only for hooks, events, or browser APIs.
- Tailwind utilities only. No inline `style={{}}` unless a map/WebGL library requires it.
- Use `cn()` from `src/lib/utils.ts` for conditional classes (add when first needed).
- Auth checks on each protected page / Server Action — defense in depth.
- **Never** call `setState` synchronously inside a `useEffect` body
  (`react-hooks/set-state-in-effect`). Defer via timeout/event/promise,
  use a lazy `useState` init, or sync from props during render.
- Ask before installing new dependencies.
- Write code in small chunks (prefer focused diffs).

## Markdown & agent docs workflow

Agent-facing docs live as Markdown and are part of how we work — not optional fluff.

| File / folder | Role |
|---------------|------|
| `AGENTS.md` | Read at the **start of every session**. Source of truth for stack, rules, ship gate. |
| `CLAUDE.md` | Points at `AGENTS.md` (`@AGENTS.md`). |
| `.cursor/rules/*.mdc` | Always-on or globs Cursor rules (e.g. ship checklist). |
| `.cursor/skills/*/SKILL.md` | Task skills. **Entry point only** — always open linked companion `.md` files named in the skill. |
| `.agents/skills/*` | Mirror of project skills (Codex / other agents). Keep in sync with `.cursor/skills`. |
| `.devlog/*.md` | **Private learning journal**. In `.gitignore`. Never commit, never push, never put in README. |

### How to use skill Markdown

1. When a skill matches the task, open its `SKILL.md` first.
2. Immediately read every companion file it links (`reference.md`, `brand-rules.md`, etc.).
3. Do not invent brand tokens or Go-Ai call shapes that contradict those files.
4. If you change a workflow, update the skill `.md` in the same change set.

### Private `.devlog/` entries

After a meaningful chunk of work, append or create a dated note under `.devlog/`:

- What changed and **why**
- Patterns / hooks / libraries used
- Trade-offs and open questions

Template lives in the `devlog` skill. This is for the human’s learning only.

## Environments & secrets
- Never commit secrets. Use `.env.local` (gitignored). Keep `.env.example` filled with empty keys + comments.
- `GO_AI_BASE_URL`, `GO_AI_SHARED_SECRET` — **server-only**. Never `NEXT_PUBLIC_*`.
- `NEXT_PUBLIC_MAPBOX_TOKEN` is the only map token that may be public (Mapbox publishable).
- Neon `DATABASE_URL` and Auth.js secrets stay server-side.

## Git
- Default branch: `main`.
- Feature branches: `feature/description` or `fix/description` from `main`.
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- Atomic commits: one logical change per commit.
- Never commit or push unless the human explicitly asked.
- Never commit `.devlog/`.
- CI (GitHub Actions) runs lint + typecheck + **test** + build on `main` and PRs; CD is Vercel.
- Stack includes **Vitest** — every behavior change needs tests.

## AI Assistant workflow
- Read `AGENTS.md` at the start of each session.
- Explain non-obvious architectural decisions in short comments or in `.devlog/`.
- Before declaring a task complete **or** committing/pushing:
  1. `npx eslint` on every touched `.ts`/`.tsx` — **zero new errors**
  2. **`npm run test` — always.** Add/update Vitest for changed behavior; green required. No “tests later”.
  3. **Code review — always.** Bugbot for feature/fix work; Security Review when auth/DB/user data/AI proxy are involved; fix high/medium before push; summarize for the human
  4. `npm run build` — zero TypeScript errors  
  Build alone (without eslint + tests + review) is not enough.
- Go-Ai: browser → Next.js route handler → Go-Ai. Never call Go-Ai from the client with the shared secret. See skill `go-ai-integration`.

## Security
- No secrets in code or client bundles.
- Do not forward raw upstream LLM/gateway bodies to the browser — use safe error summaries (`readGoAiSafeError`).
- User profile / location data sent to the model must be intentional and minimal for the route task.
