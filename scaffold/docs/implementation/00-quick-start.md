---
title: "Quick start — operating model (continuous flow + gate)"
---

> KIT · [agnostic] — the operating model in 60 seconds. It's the first file read in every work chat. Adapt it: rename the Gates to your real milestones, leave the rest.

> First file read in every new work chat on {{PROJECT}}. **60 seconds.**
>
> By default work is organized as **continuous flow**, not a rigid plan with numbered stages: the unit is the **Intervention**, a single deterministic flow that documents everything and records each decision at the right durability level. The big milestones are **Gates**. *(If {{PROJECT}} already has a roadmap/milestone/issue tracker, it doesn't get thrown away: the Board is the current status, that stays the source of backlog.)*

## In every new chat

1. Read `CLAUDE.md` (root) → this file → `STATE.md`.
2. `STATE.md` is the **Board**: `In flight` (what I'm doing) · `Next` · `Gate G0–G4` · `Backlog`. The `focus` field in the frontmatter + the `In flight` column tell you where you are in 10 seconds.
3. **Check git**: `git log --oneline -5` must match `last_commit` in STATE's frontmatter. If it doesn't match → STATE is stale → run {{HANDOFF_CMD}} (or `{{PKG_MANAGER}} update-state`).
4. Proceed with an **Intervention** (below). Update the Board at every commit (the post-commit hook bumps the git fields automatically).

## The unit of work: the **Intervention**

A single flow, always the same — *this is where "deterministic" comes from*:

```
  TRIGGER          a QA pass / a pivot / a bug / an idea / a gate to unblock
     ↓
  INTERVIEW        ALWAYS (scaled to size): options, pros/cons, double layer,
     ↓             recommended. This is structured thinking — not skipped for
     ↓             non-trivial work. Procedure: 20-discipline/02-pre-task-interview.md.
     ↓             ({{OPERATOR}} can say "skip, it's plumbing" → straight to build.)
  CLASSIFY         Where does the "why" live? Pick the record level (table below).
     ↓
  BUILD            TDD balanced (20-discipline/01-tdd-discipline.md).
     ↓
  VERIFY           Walk through what was built: smoke test by observation ·
     ↓             adversarial review on sensitive areas · fix before "done".
     ↓
  COMMIT + JOURNAL + refresh BOARD     ({{HANDOFF_CMD}} at end of chat)
```

> In plain language: every time something gets touched, we always run the same loop — understand clearly what to do (interview), decide *where to write the why*, build with tests, verify it actually works (by watching it run), then commit and record it. No steps skipped.

## The key rule: record proportional to **how long the decision lasts**

Not to how big the code is. A capability with new architecture → ADR; a style tweak → JOURNAL line. **The interview happens in every case**; only where the "why" ends up changes.

| What you decided | Where the "why" lives |
|---|---|
| **Product/business pivot** (who we serve / how we acquire / monetize / how we operate) | **PDR** in `docs/DIRECTION.md` + JOURNAL entry |
| **Architectural decision** (data schema, security, cross-cutting contract, an ADR's assumption) | **ADR / mini-ADR** (`20-discipline/04-mini-adr-template.md` for the threshold) + JOURNAL entry |
| **Everything else** (UI polish, refactor, micro-fix, QA bug) | **JOURNAL entry** (with the plain-language summary folded in) + memory if non-obvious |

> Mini-ADR vs ADR criterion = twin of the PDR criterion. The "home" of an Intervention is its commit + its JOURNAL entry + its record (PDR/ADR) at the right level.

## The Gates (G0–G4) — the binary milestones

A few binary, consequential milestones, each with its own checklist (this is where *complete + safe + professional* lives). The living list with the entries is in the **Board** in `STATE.md`. Example shape (adapt your own):

- **G0** — _(first milestone, e.g. dev surfaces reachable / internal demo)_
- **G1** — _(legal/corporate prerequisite that unblocks real integrations)_
- **G2** — _(production deploy)_
- **G3** — _(legal go-live / requirements to take payments)_
- **G4** — _(first customer / soft launch)_

Each Gate declares its **Blocks / Unblocks** clause: what's needed to clear it (Blocks) and what it enables once cleared (Unblocks).

## TDD workflow (balanced)

| Code | Test |
|--------|------|
| Pure business logic | **TEST FIRST** (red→green→refactor) |
| Critical invariants (data isolation, idempotency, append-only, retry) | **TEST FIRST** |
| Validation schemas | **TEST FIRST** (parsing edge cases) |
| Server actions / handlers | test alongside (same commit) |
| Components with logic (forms, stateful hooks) | test alongside |
| Webhook handlers (beyond signature validation) | test alongside |
| Copy-paste UI components · pure layouts · page wrappers | no test required |

See `20-discipline/01-tdd-discipline.md` for the full matrix + examples.

## On-demand references

- **TDD discipline**: `20-discipline/01-tdd-discipline.md`
- **Interview**: `20-discipline/02-pre-task-interview.md` (archetypes + Business/UX/Technical blocks)
- **Mini-ADR vs ADR**: `20-discipline/04-mini-adr-template.md`
- **Handoff protocol**: `20-discipline/03-handoff-protocol.md` (git hook, slash command, recovery)
- **Non-technical summary**: `20-discipline/05-plain-language.md`
- **Direction (product/business)**: `docs/DIRECTION.md` (north-star + PDR log)
- **Architectural ADRs**: `docs/architecture/decisions/`
- **Inline decisions ledger**: `30-reference/inline-decisions.md` (Board overflow, all kept)

## To close a chat

- {{HANDOFF_CMD}} (slash command) — Board refresh (`STATE.md`) + `JOURNAL.md` entry.
- Or manual: update the Board (`focus` + columns) + add the JOURNAL entry.
