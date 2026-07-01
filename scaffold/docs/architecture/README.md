---
title: "{{PROJECT}} — Architecture Plan (ADR log)"
---

> KIT · [agnostic] — ADR log: decision table + evolution notes + how to pick up work in a new chat. This is the technical SSOT index. Update the table every time you close an ADR.

Starting point for {{PROJECT}}'s technical decisions. Read it **at the start of every
new chat** that touches the architecture, to recover context.

> **"Closed planning" = technical baseline, not dogma.** ADRs freeze *how we build*
> (stack, structure, integrations). *Where the product/business is heading* lives in
> [`../DIRECTION.md`](../DIRECTION.md), the living north-star. When a product pivot
> invalidates an ADR's assumption, the ADR gets **superseded** (banner `<!-- direction:stale
> PDR-NNN -->` + an entry in DIRECTION.md's pivot log), it doesn't pretend to be immutable.

> **In plain language.** This page is the list of every technical decision made, with
> its status. Each row points to a document (ADR) that explains *why* that choice was made.

## Working methodology

We decide **together**, one decision at a time. Every decision produces an **ADR**
(Architecture Decision Record) saved in `decisions/`.

For every decision:
1. {{OPERATOR}} (or Claude) presents the problem in 4-5 lines + 2-3 options with pros/cons.
2. {{OPERATOR}} decides (may ask questions / counter-propose).
3. The ADR gets written (template in `decisions/000-template.md`).
4. Move on to the next one.

**No unilateral decisions from Claude.** No doc dump without prior discussion.

## Decision status

| # | Decision | Status | ADR |
|---|-----------|-------|-----|
| 001 | _(first decision, e.g. technology stack)_ | ⚪ pending | — |
| 002 | _(second decision)_ | ⚪ pending | — |

**Legend:** ⚪ pending · 🟡 in discussion · 🟢 closed with ADR · 🔴 blocked

> The ADR column stays `—` until the decision is closed; on closing it becomes a link to the real file, e.g. `[007](./decisions/007-slug-kebab.md)`.

**Counter:** 0/0 ADRs closed. _(update on closing every ADR)_

**Evolution notes** (append-only — don't delete, append):
- _(YYYY-MM-DD)_ — _(e.g. ADR 00X opened/closed; why; ADR it supersedes)._

## Folder structure

```
architecture/
├── README.md                 ← THIS FILE — index + decision log
├── code-conventions.md       ← code organization manual
└── decisions/                ← one file per decision (ADR)
    ├── 000-template.md        ← empty skeleton to copy
    ├── 001-....md
    └── ...
```

## How to pick work back up in a new chat

1. Read this README (decision table + evolution notes).
2. Read the ADRs already written in `decisions/`.
3. Check `../DIRECTION.md` for any ADRs marked `direction:stale`.
4. Identify the **next pending decision** in the table.
5. Start there with {{OPERATOR}}.

## Kit adaptation notes

- Target stack: **{{STACK}}** (unknown a priori — the first ADR pins it down).
- Number ADRs monotonically (`001`, `002`, …); an ADR can supersede another one (see
  the `Supersedes` field in the template).
- If a generator is active (`scripts/generate-adr-map.mjs`), the table above can be
  regenerated from the ADRs' frontmatter instead of being maintained by hand.
