---
title: STATE — living Board
updated:                       # ISO timestamp, bumped by the post-commit hook
current_gate: G0               # current gate (G0..G4)
focus: ""                      # 1-3 sentences: what I'm doing NOW + next step. Read by whoever reopens.
last_commit:                   # short HEAD SHA — bumped by the post-commit hook
last_commit_message: ""        # first line of the commit — bumped by the post-commit hook
last_commit_at:                # ISO timestamp of the commit — bumped by the post-commit hook
last_commit_author: ""         # author of the last commit — bumped by the post-commit hook (attribution, matters in the team profile)
next_actions:                  # 1-3 concrete next actions (human, not auto-generated)
  - ""
pending_commands: []           # commands launched/awaiting verification (e.g. build, prod rebuild)
blockers: []                   # what prevents progress (external dependencies, open decisions)
inline_decisions:              # inline decisions + gotchas, cap ~15 (overflow → 30-reference/inline-decisions.md)
  - ""
session_started_at: null
last_session_handoff_at: null
inline_decisions_archive: 30-reference/inline-decisions.md
---

> KIT · [agnostic] — SKELETON of the living Board (the project's current state). Machine-readable frontmatter + human body. The update-state.mjs script updates the git fields via the post-commit hook. Empty the examples and populate with your project.

# STATE — living Board {{PROJECT}}

> **Single source of truth** for the current state. Machine-readable frontmatter (the AI reads it), Board + log below for the human.
> **Operating model: continuous flow + gate** (see [`00-quick-start.md`](00-quick-start.md)). The unit is the **Intervention** (trigger → interview → classify record → build → verify → commit + JOURNAL).

## Board

### 🔵 In flight
- _(what's being worked on right now — at most 1-2 items; if empty, say so explicitly)_
<!-- profile:team -->
> **`team` profile.** Each In-flight item carries the **owner** and machine-readable blockers: `- [@author] <intervention> · blockedBy:[other-slug]`. The "1-2 items" cap is **per-owner**, not global. Use **slug** keys, never numeric IDs (they collide at merge). The staleness sentinel acts as a circuit-breaker on stuck items. See `handbook/09-operating-profiles.md`.
<!-- /profile:team -->

### ⬜ Next
- _(the next 1-3 planned interventions, in order)_

### 🚩 Gate (binary milestones)

Each gate declares **Blocks** (what's needed to pass it) and **Unblocks** (what it enables once passed).

- **G0 — _(milestone name)_**. _Blocks_: _(what's missing)_. _Unblocks_: _(what becomes possible)_.
- **G1 — _(milestone name)_**. _Blocks_: _(...)_. _Unblocks_: _(...)_.
- **G2 — _(milestone name)_**. _Blocks_: _(...)_. _Unblocks_: _(...)_.
- **G3 — _(milestone name)_**. _Blocks_: _(...)_. _Unblocks_: _(...)_.
- **G4 — _(milestone name)_**. _Blocks_: _(...)_. _Unblocks_: _(...)_.

### 🗂️ Backlog / deferred
- _(ideas and deferred work, with a note on the "when" or "if needed")_

## Session log

> One narrative line per session, newest-first. The structured detail lives in `JOURNAL.md`; here the readable "title" for {{OPERATOR}} is enough.

_(example entry — replace)_
🟢 **Session YYYY-MM-DD — readable title.** 1-3 plain-language sentences on what changed and why. Commit `xxxxxxx`, state (pushed / local, CI green / red).

---

> **Detailed history**: lives in the `git log` and in `JOURNAL.md`. This Board keeps only the *current* state + a synthetic log. The inline decisions that exceed the cap (~15 in the frontmatter) are all preserved in [`30-reference/inline-decisions.md`](30-reference/inline-decisions.md).
