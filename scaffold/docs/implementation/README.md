---
title: "{{PROJECT}} — Implementation"
---

> KIT · [agnostic] — index and reading order of the implementation docs. Adapt it to {{PROJECT}}: keep the order, fill in the placeholders.

**Living** documentation for the implementation of {{PROJECT}}: from the current plan to day-to-day work, in a single traceable flow.

> 🔁 **Working model: continuous flow + gate.** The unit of work is the **Intervention** (a single flow: trigger → interview → classify record → build → verify → commit + JOURNAL), not "numbered phases and tasks". For the model in 60 seconds, see [Quick start](./00-quick-start.md).

## Start here in a new work chat

**Mandatory** reading order at the start of every new chat:

1. **[Quick start](./00-quick-start.md)** — the operating model (continuous flow + gate). 60 seconds.
2. **[STATE](./STATE.md)** — the **Board** (current status: In flight / Next / Gate / Backlog). Where you are, in 10 seconds.
3. **[JOURNAL](./JOURNAL.md)** — append-only history of sessions (what happened and why).

> In plain language: first read *how we work* (Quick start), then *where we are now* (Board), then *what's been done so far* (Journal). Always in this order.

## Discipline (operating workflow)

- [TDD discipline](./20-discipline/01-tdd-discipline.md) — what's test-first vs alongside, assert-by-observation.
- [Pre-task interview](./20-discipline/02-pre-task-interview.md) — interview protocol (archetypes + Business/UX/Technical blocks).
- [Handoff protocol](./20-discipline/03-handoff-protocol.md) — layered defense (hook → command → checklist), recovery.
- [Mini-ADR template](./20-discipline/04-mini-adr-template.md) — 3-question criteria + promotion path.
- [Plain language](./20-discipline/05-plain-language.md) — the non-technical summary (now folded into the Journal entry).

## Reference

- [Inline decisions](./30-reference/inline-decisions.md) — append-only overflow ledger (the Board keeps ~15, here they're all kept).

## Philosophy

> **Binding automation over voluntary discipline.** The number-one risk of a living documentation system is **sync drift** between files (the Board says one thing, `git log` another, the Journal a third). Choices always favor **binding automation** (git hooks, machine-readable frontmatter, pre-commit linters) over an individual's voluntary discipline: what a hook does on its own is never forgotten; what depends on "remembering to update" eventually slips.

In plain language: we don't trust memory (human or AI) to keep the records aligned. We let the machine do it wherever possible. See [03-handoff-protocol](./20-discipline/03-handoff-protocol.md) for the operational details.
