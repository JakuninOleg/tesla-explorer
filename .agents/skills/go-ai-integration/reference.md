# Go-Ai reference (from Okhana + Go-Ai gateway)

## Environment

```bash
GO_AI_BASE_URL=http://localhost:8080   # or deployed gateway URL; no trailing slash required
GO_AI_SHARED_SECRET=                   # Bearer token; server-only
GO_AI_MODEL=default                    # optional app-level default alias
```

Strip trailing `/` from `GO_AI_BASE_URL` in code (`getGoAiConfig`).

## Endpoints used by this app

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/v1/chat/completions` | OpenAI-compatible JSON; optional SSE stream |
| `GET` | `/v1/models` | Alias / catalog diagnostics (debug) |
| `GET` | `/v1/status` | Gateway metrics (debug) |
| `POST` | `/v1/audio/transcriptions` | STT via Groq proxy — needs real `Content-Length` |
| `POST` | `/v1/audio/speech` | TTS — binary audio, do not `response.json()` |

## Minimal chat call

```ts
import { getGoAiConfig, goAiChatCompletions, readGoAiSafeError } from '@/features/ai/go-ai-client';

const res = await goAiChatCompletions({
  body: {
    model: process.env.GO_AI_MODEL ?? 'default',
    messages: [
      { role: 'system', content: 'You plan Tesla leisure routes in the USA.' },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
  },
});

if (!res.ok) {
  const err = await readGoAiSafeError(res);
  // return err.message to client — never raw body
}
```

## Streaming

Pass `stream: true` in the body and forward the SSE/ upstream body from the Route Handler. Do not buffer the entire stream into a string on the server unless necessary.

## Tool calling

- Send OpenAI-style `tools` / `tool_choice` on the chat request.
- When the model returns `tool_calls`, execute functions **in Tesla Explorer**, then continue the conversation with `role: 'tool'` messages.
- Preserve `extra_content` on tool calls if present (Gemini OpenAI-compat round-trip).

## Okhana parity notes

This client was adapted from `okhana/src/features/ai/go-ai-client.ts` and `go-ai-types.ts`:

- Same bearer auth and URL joining
- Same safe-error policy
- STT buffering for `Content-Length` only if/when voice routes exist

Do not re-introduce Clerk- or family-quota logic from Okhana here — Tesla Explorer has its own product rules.
