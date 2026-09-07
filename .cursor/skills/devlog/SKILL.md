---
name: devlog
description: >-
  Private learning journal under .devlog/ for Tesla Explorer. Use after meaningful
  implementation chunks to record what was built, why, patterns, hooks, and trade-offs.
  Never commit these files.
---

# Devlog (private)

Read [template.md](template.md) when creating an entry.

## Rules

1. Path: `.devlog/NNN-short-slug.md` (zero-padded sequence) or dated `YYYY-MM-DD-topic.md`.
2. Folder is in `.gitignore` — **never** `git add` it, never push, never link from README.
3. Write for the human’s learning: code decisions, React/Next patterns, Go-Ai, Mapbox, Auth.js, Neon.
4. After a non-trivial task (new feature, integration, non-obvious bugfix), add or append an entry before saying “done”.
5. Keep entries concrete: file paths, hook names, pattern names — not vague summaries.

## When to write

- New integration (Go-Ai, Mapbox, Auth.js, Neon)
- Non-obvious architectural choice
- Bug that taught something
- First use of a React/Next API in this repo

## When to skip

- Pure typo / rename with no learning value
- Dependency bump with no behavior change
