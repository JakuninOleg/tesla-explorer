---
name: go-ai-integration
description: >-
  Integrate Tesla Explorer with the Go-Ai OpenAI-compatible gateway (chat,
  optional STT/TTS). Use when adding AI routes, itinerary generation, tool
  calling, or debugging GO_AI_* env / gateway errors. Ported from Okhana patterns.
---

# Go-Ai integration (Tesla Explorer)

Read [reference.md](reference.md) for env vars, endpoints, and copy-paste request shapes.

## Hard rules

1. **Server-only.** Call Go-Ai from Route Handlers / Server Actions / server libs under `src/features/ai/`. Never from Client Components with the shared secret.
2. **Env:** `GO_AI_BASE_URL` + `GO_AI_SHARED_SECRET`. Never `NEXT_PUBLIC_*` for the secret.
3. **Path:** Browser → Next.js API → `goAiChatCompletions` → Go-Ai `/v1/chat/completions`.
4. **Auth header:** `Authorization: Bearer <GO_AI_SHARED_SECRET>`.
5. **Errors:** Use `readGoAiSafeError` — do not leak prompts, tokens, or raw upstream bodies to the client.
6. **Models:** Prefer local alias `default` (Gemini primary, OpenRouter fallback inside Go-Ai) unless the task needs an explicit alias.
7. **Tools:** Go-Ai proxies tool-calling payloads; **tool execution stays in this app** (same as Okhana).

## Implementation map

| Piece | Location |
|-------|----------|
| Types | `src/features/ai/go-ai-types.ts` |
| Client | `src/features/ai/go-ai-client.ts` |
| Config helper | `getGoAiConfig()` |
| Chat | `goAiChatCompletions({ body })` |
| STT / TTS | only if voice is in scope — same client helpers as Okhana |

## Checklist when adding an AI feature

- [ ] New route is server-side
- [ ] Body validated with Zod before calling Go-Ai
- [ ] Structured AI output validated again before DB/UI
- [ ] Safe error mapping on non-OK responses
- [ ] No secret in client bundle / network tab from the browser to Go-Ai directly
- [ ] `.env.example` updated if new env keys appear
- [ ] Note in `.devlog/` if the pattern is new to the human
