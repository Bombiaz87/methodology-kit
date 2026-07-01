---
name: TODO-skill-name-process
description: TODO one-shot description — what this PROCESS skill does and WHEN it should be suggested/invoked. Include the triggers ("when the user asks for X", "at the end of a task that touches Y") so auto-suggest picks it up. Specify whether it's read-only and whether it does NOT commit. Output in English.
---

> KIT · [agnostic] — Skeleton for a PROCESS skill (review/triage/audit/handoff: reasons, decides, reports — doesn't generate files). Copy the folder, rename it, fill in the TODOs. A process skill does NOT produce code: it produces a judgment/ledger/report.

# Skill: TODO-skill-name-process

> TODO one line: what it does, why it exists, what its counterpart/twin is if applicable. Output in English, double layer ({{OPERATOR}} is a PM-director; "plain language" optional if they're a PM-dev).

## When to use me

- TODO **auto-suggest**: at what point in the flow do you propose it (and {{OPERATOR}} confirms)? Tie the trigger to a concrete event (end of task on a sensitive area, post-review with N findings, session close).
- TODO **manual invocation**: which phrases trigger it? ("review…", "triage…", "audit…").

## Do NOT use me if

- TODO the boundaries: what does a **different** skill do (don't duplicate a built-in: `/code-review`, `/security-review`, `/simplify`).
- TODO whether it's **read-only** or **does NOT commit** — state it explicitly here.
- TODO prerequisites that shouldn't be skipped (lint/check/tests green before starting).

## The problem it solves

TODO 2-3 sentences: what methodological gap does this skill fill that neither deterministic tools nor built-ins cover.

## Procedure

> Typical shape of a process skill: **collect input → a judgment loop per item → operator checkpoint → consolidate a report/ledger**. No code generation.

### Step 1 — Collect / frame the input
TODO: where does the material come from (diff, findings list, area to audit). How do you group it to work it "one source at a time".

### Step 2 — Judgment loop (one per item)
TODO: the criteria/gates you apply to each item. **Verify against the real code**, don't trust the framing.

### Step 3 — Action / outcome per item
TODO: the taxonomy of possible outcomes (e.g. fix/defer/accept, or finding/clean). Re-verify immediately if the action touches code.

### Step 4 — Methodology gate (if applicable)
TODO: what does NOT get resolved inline but requires an interview with {{OPERATOR}} (`AskUserQuestion`, problem recap → pros/cons options → recommended) or a decision record (never unilateral).

### Step 5 — Checkpoint with the operator
TODO: when you stop to confirm before continuing.

### Step 6 — Final report / ledger + verdict
TODO: the consolidated format.

## Output format

> Double layer mandatory: **technical** line (`file:line`, real names) + **In plain language** line (metaphor ALWAYS anchored to the technical referent inline, in parentheses).

```markdown
TODO: markdown block for the final report/ledger, with fields and verdict
```

## Anti-patterns (what's not useful)

| Anti-pattern | Why it's wrong |
|---|---|
| TODO | TODO |

## References

- TODO: twin/complementary skills, built-ins, the project's conventions/decisions/direction SSOT.
