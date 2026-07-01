> KIT · [agnostic] — index of the `docs/` folder: who owns what. Adapt it by deleting the lines you don't use and adding your project's folders.

# `docs/` — documentation map

All of {{PROJECT}}'s durable knowledge lives here. One line per folder/file: **what it contains** and **who owns it** (the authoritative source — the SSOT — for that thing).

> **In plain language.** This is the "reception desk" of the documentation: it tells you which room to walk into. If you don't know where a piece of information belongs, start here.

## Reading order (open in a new chat)

1. `implementation/00-quick-start.md` — the operating model (how we work: the unit is the **Intervention**).
2. `implementation/STATE.md` — the **Board**: where the work stands *right now*.
3. `DIRECTION.md` — where the product/business is heading *right now* + the history of pivots (PDR log).
4. `architecture/README.md` — the ADR log: the closed technical decisions.

## Ownership by folder

| Path | What it contains | SSOT of… |
|----------|---------------|----------|
| `README.md` | This index | navigation of `docs/` |
| `DIRECTION.md` | Living north-star + **PDR** pivot log | *where we're going* (product/business) |
| `identity/` | Mission, vision, values, ideal customer profile | *who we are / why we exist* (foundational) |
| `architecture/README.md` | **ADR** log (decision table) | *how we build* (technical index) |
| `architecture/code-conventions.md` | Code organization manual | structure/import/naming conventions |
| `architecture/decisions/` | One file per decision (ADR) | rationale for each technical choice |
| `implementation/00-quick-start.md` | Operating model (Intervention + Gate) | *how we work* |
| `implementation/STATE.md` | Board (In flight / Next / Gate / Backlog) | *current status of the work* |
| `implementation/JOURNAL.md` | Append-only session diary | history of *what was done and why* |
| `implementation/20-discipline/` | Protocols (TDD, interview, handoff, mini-ADR, "plain language") | *rules of the method* |
| `implementation/30-reference/` | Minor inline decisions (below ADR threshold) | tracked micro-decisions |

## Three levels of durability for the "why"

When you log a decision, choose the right level — don't write everything as an ADR:

- **PDR** (`DIRECTION.md`) → a pivot in *where we're going* (product/business).
- **ADR** (`architecture/decisions/`) → a decision about *how we build* (technical).
- **JOURNAL entry** or `30-reference/inline-decisions.md` → a reactive micro-decision, below threshold.

> Twin rule: PDR and ADR share the same threshold (see `DIRECTION.md §3` and `20-discipline/04-mini-adr-template.md`). Below threshold → JOURNAL/inline, not a dedicated document.
