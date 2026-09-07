# Brand rules (Tesla-inspired, not trademark copy)

## Intent

Visual language **inspired by** Tesla vehicle UI: dark surfaces, restrained accent,
legible UI type. Do **not** ship official Tesla logos, wordmarks, or proprietary
font files in a public repo. Prefer open fonts with a similar character
(e.g. a clean geometric grotesk) defined once in CSS variables.

## Tokens (initial — refine in `globals.css`)

| Token | Role | Starting direction |
|-------|------|--------------------|
| `--background` | App canvas | Light `#f4f4f4` / dark `#050505` (cookie theme, default dark) |
| `--foreground` | Primary text | Near-black / off-white |
| `--muted` | Secondary panels | Elevated gray |
| `--accent` | Primary CTA | `#E31937` in both themes |

Expose as Tailwind theme colors once `globals.css` is set.

## Anti-patterns

- Okhana cream / teal / peach
- Purple-on-white “AI startup” look
- Dense admin dashboards on the trip hero
- Emoji-as-UI decoration
- Card grids competing with the map

## Assets

| Asset | Path | Use |
|-------|------|-----|
| Mark (canonical) | `/brand/mark.png` | Favicon, header, hero |
| Wordmark PNG | `/brand/wordmark.png` | Optional marketing; UI prefers mark + CSS type |
| Constants | `src/lib/brand.ts` | Name, tagline, paths |

Mark concept: geometric **E** as a route path + red destination pin. Original artwork — not the Tesla T.

