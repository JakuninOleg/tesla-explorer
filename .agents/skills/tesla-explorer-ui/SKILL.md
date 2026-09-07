---
name: tesla-explorer-ui
description: >-
  Tesla-inspired UI direction for Tesla Explorer — dark automotive shell, map-first
  layouts, motion for route playback. Use when designing screens, tokens, landing,
  or cinematic map UI. Not Okhana brand.
---

# Tesla Explorer UI

Read [brand-rules.md](brand-rules.md) before changing colors, type, or chrome.

## Product feel

- **In-car calm:** dark UI, high contrast type, minimal chrome — closer to a vehicle display than a SaaS dashboard.
- **Map is the stage:** first viewport for trip flow is the map / route cinema, not a card grid.
- **One job per screen:** plan → preview route → play → rate.

## Borrow / avoid

| Borrow | Avoid |
|--------|--------|
| Tesla UI density, dark panels, simple CTAs | Purple AI gradients, generic Inter landing |
| Cinematic camera on the route | Dashboard stat strips in the hero |
| Clear battery / time constraints in UI | Fake “book charger” flows in v1 |

## Motion

- Route playback and charge stop are the hero motions (2–3 intentional animations).
- Prefer transform/opacity; keep UI chrome transitions ≤ 300ms.
- No confetti, no bounce spam.

### 7. PWA
- Manifest via `src/app/manifest.ts` / `getWebManifest()`
- Shell SW `public/sw.js` (prod register only)
- Install CTA: `PwaInstallButton` (Chromium prompt + iOS Share hint)
- Safe areas: `env(safe-area-inset-*)` on shell pages
