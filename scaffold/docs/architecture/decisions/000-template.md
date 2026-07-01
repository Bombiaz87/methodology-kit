---
title: "ADR NNN — Decision title"
status: proposed
date: YYYY-MM-DD
---

> KIT · [agnostic] — empty skeleton of an ADR. Copy it to `00N-title.md`, fill the fields, update the table in `../README.md`. The Deciders field records both the human and the AI model + version.

**Status:** ⚪ Proposed _(⚪ Proposed · 🟡 Discussion · 🟢 Accepted · 🔴 Rejected · ⚫ Superseded)_
**Date:** YYYY-MM-DD
<!-- profile:solo -->
**Deciders:** {{OPERATOR}}, Claude (model + version, e.g. Opus 4.x)
<!-- /profile:solo -->
<!-- profile:team -->
**Deciders (decision-makers):** {{OPERATOR}}, Claude (model + version)
**Consulted / Informed:** _(lightweight RACI — who was consulted / who should be kept in the loop; omit if empty)_
<!-- /profile:team -->
**Supersedes:** _(optional — ADR NNN, in whole or in part; remove the line if not applicable)_

---

## Context

_(The problem to decide, in 4-6 lines. Which constraints do we inherit from previous ADRs or from
`../../DIRECTION.md`? What makes this decision necessary now?)_

## Decision

_(What we decided, cleanly. One clear sentence + the operational points. If the decision is
split into sub-decisions, list them.)_

## Out of scope (no-gos)

_(What this decision explicitly does **NOT** cover — the boundary that cuts scope-creep.
Different from "deferred" questions: here are the things deliberately left out. Omit if
obvious.)_

## Selection criteria

_(The grid you evaluated the options on — the dimensions, not the conclusion: e.g. cost,
lock-in, DX, security, time-to-ship. Makes explicit *how* you weighed. Omit if the Rationale already
says it all.)_

## Rationale

_(Why this and not another. The underlying reasons, not a repetition of the decision.)_

## Consequences

### Positive
- _(what we improve / unblock)_

### Negative
- _(cost, debt, constraints we knowingly accept)_

## Confirmation (how it's verified)

_(How do we know this decision is **really implemented and respected**? Point to the verification
mechanism, ideally automatic: a named test, a sentinel/linter, an eyeball smoke. If there isn't
a check yet, say so: "manual verification — guardrail to build". It's the field that
makes the record self-verifiable.)_

## Alternatives considered

- **_(Alternative A)_** — rejected because _(reason)_.
- **_(Alternative B)_** — rejected because _(reason)_.

## References

- Conversation: _(date)_
- Related docs: _(other ADRs, `../code-conventions.md`, the `[PDR-NNN]` entry in `../../DIRECTION.md` if the decision stems from a product pivot)_
