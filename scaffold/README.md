> KIT · [agnostic] — router-SSOT README: declares which file is the source for each topic and maps the docs/ folders. It's just the index; don't duplicate content here.

---
title: "{{PROJECT}}"
---

Strategic and technical documentation for the **{{PROJECT}}** project.

> ℹ️ **Living SSOT**: the current product/business model lives in [`docs/DIRECTION.md`](./docs/DIRECTION.md), implementation status in [`docs/implementation/STATE.md`](./docs/implementation/STATE.md). This README is **just the index** of the repo — no content lives here, only pointers.

## SSOT by topic — who's the source of truth

| Topic | Source file (SSOT) |
|------|-------------------|
| Where the product/business is heading, pivots | `docs/DIRECTION.md` |
| Implementation status (what's in flight) | `docs/implementation/STATE.md` |
| Technical decisions / stack | `docs/architecture/README.md` + `docs/architecture/decisions/*.md` |
| Code conventions | `docs/architecture/code-conventions.md` |
| Operating model (how we work) | `docs/implementation/00-quick-start.md` |
| Session diary | `docs/implementation/JOURNAL.md` |
| Identity (mission, ICP, value prop) | `docs/identity/README.md` |
| Instructions for Claude Code | `CLAUDE.md` (+ nested `CLAUDE.md` per area) |
| Command/environment cheat-sheet | `COMMON-COMMANDS.md` |

In plain language: if you don't know where something lives, start here — this table tells you which file is "the truth" for each topic.

## Folder structure

```
{{PROJECT}}/
├── README.md                 ← this file (index only)
├── CLAUDE.md                 ← instructions for Claude Code
├── COMMON-COMMANDS.md        ← operating cheat-sheet
├── docs/                     ← all the documentation
│   ├── DIRECTION.md          ← north-star + pivot log (direction SSOT)
│   ├── identity/             ← mission, vision, ICP, value prop
│   ├── architecture/         ← ADR, conventions, technical roadmap
│   └── implementation/       ← STATE, JOURNAL, quick-start, discipline
└── <apps/packages>           ← code (fill in with your apps/packages)
```

## docs/ folder map — ownership (one line each)

| Folder | What it contains | Owner doc |
|----------|---------------|-----------|
| `docs/DIRECTION.md` | North-star + PDR log | product/business direction |
| `docs/identity/` | Mission, values, ICP, value prop | identity |
| `docs/architecture/` | ADR, conventions, stack | technical decisions |
| `docs/implementation/` | STATE, JOURNAL, discipline | execution |

---

**Last updated**: <date> (<what changed>)
