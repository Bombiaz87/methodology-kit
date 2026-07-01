---
description: "Refresh the living state machine (Board/STATE) + JOURNAL entry before closing a work chat"
---

> KIT · [agnostic] — Session-close command: updates the Board (STATE) and prepends a JOURNAL entry, so the next session (or another agent) picks up without rebuilding context. Adapt the file names to your state machine. Command registered as `{{HANDOFF_CMD}}`.

# {{HANDOFF_CMD}}

Run this procedure BEFORE closing the chat if you've changed code or advanced work.

> **Model: continuous flow + gate.** The unit of work is the **Intervention** (not rigid phases/tasks).
> The handoff updates the **Board** in `STATE.md` (`focus` + columns) + adds an entry to
> `JOURNAL.md`. It doesn't touch frozen archives. See `docs/implementation/00-quick-start.md`.

## Step 0 — Did a Gate close? (rare)

Check whether this session **completed a Gate's checklist** (the gates on the Board). If so:
confirm on sight with {{OPERATOR}} that all the gate's items are satisfied, then mark the gate as
closed on the Board and include it in the final output ("✅ Gate {Gx} closed"). Otherwise skip.

## Sequence

1. **Check git status** — uncommitted files:
   ```bash
   git status --short && git diff --stat
   ```
   If there are uncommitted changes, ask {{OPERATOR}} whether to commit them first (preferable to commit before the handoff). Remember: **selective staging** of only the task's files (never `git add -A`), because the working tree may contain work from other sessions.
   <!-- profile:team -->
   > **`team` profile.** You work on **your own branch** (the clone already isolates the task): commit on the branch and the handoff closes **toward the PR**, not toward `main`.
   <!-- /profile:team -->

2. **Recent git log**:
   ```bash
   git log --oneline -10
   ```

3. **Update the Board in `STATE.md`**:
   - **frontmatter**:
     - `focus` → 1-2 lines: what's in flight / where things stopped (ONLY the current session, no archives)
     - `current_gate` → the gate we're working toward (changes rarely)
     - `next_actions` → ONLY 1-3 concrete, specific actions for the next session. Already-executed items get **REMOVED** (they're in the JOURNAL).
     - `pending_commands` → commands to re-run on return (e.g. the test that was red)
     - `blockers` → real blockers (empty if none)
     - `inline_decisions` → prepend the decisions made today (link to the record: mini-ADR/pivot/ADR). **Cap ~25**: the oldest slide into the `30-reference/inline-decisions.md` ledger.
     - `session_started_at` → reset
   - **body, `## Board` section**: update the `🔵 In flight` / `⬜ Next` / `🗂️ Backlog` columns (move what's done, add what's emerged). Touch the `🚩 Gate` only if a gate item has changed.

   > **Pruning, not accumulation**: the Board is the SSOT read at every session, it must stay lean (size guard pre-push). History slides into `JOURNAL.md` (sessions) and into the `inline-decisions.md` ledger. Do NOT concatenate archives into `focus`/`next_actions`/`inline_decisions`.

4. **Add an entry to `JOURNAL.md`** at the top (below "Session journal"). The JOURNAL is the **backbone** of "what happened and why". Use this template **verbatim**:
   ```markdown
   ## YYYY-MM-DD — Session: {title} [{type: feature/fix/docs/decision/...}]

   **{{OPERATOR}} objective**: [stated at the start of the chat, paraphrased]

   **Outcome**: [3-6 lines: what was achieved, where it stopped]

   **Decisions made**: [bullet — for each, the record level: pivot / ADR / mini-ADR / JOURNAL-only]
   **Records created/updated**: [with link]
   **Commits**: [short SHA]

   **In plain language**: [1-2 PM-readable sentences — the plain-language summary folded in here,
   non-tech audience. Omit if the session was pure planning/conversation.]
   ```
   <!-- profile:team -->
   > **`team` profile.** The header carries the attribution `· {{author}} · [area: <module>]` and **{{OPERATOR}} objective** → **Objective (requester)** (same schema as `JOURNAL.md`). Fill in `{{author}}` from the git author; the post-commit hook also stamps it into `STATE.last_commit_author`.
   <!-- /profile:team -->
   > The plain-language summary isn't a separate file: it lives in this "In plain language" block.

5. **Nested CLAUDE.md — light sanity check**: for every subfolder with a `CLAUDE.md` you touched, ask yourself whether something non-trivial emerged (command, quirk, convention). If so → propose an inline update to {{OPERATOR}}; if not → skip. No mechanical updates.

6. **If you made a product/business pivot** (axis who-we-serve / how-we-acquire / how-we-monetize / how-we-operate, or you invalidated an architectural decision): open/update a **pivot record** in `docs/DIRECTION.md` (see the instructions there) and run the direction sentinel (`{{PKG_MANAGER}} direction:check`).

7. **Final output to {{OPERATOR}}**:
   ```
   ## {{HANDOFF_CMD}} completed

   ✅ Board updated: focus + columns + next_actions
   ✅ JOURNAL.md entry added: {date} — {title}
   ✅ Records: {pivot/ADR/mini-ADR created or "JOURNAL only"}
   ✅ Gate: {Gx closed, if applicable}

   🧭 In plain language: [1-2 product/customer/cost sentences — don't repeat SHA/paths]

   Ready to close. To resume: new chat with "continue {{PROJECT}}".
   ```

## Exceptions

- Pure conversation/planning chat (zero files): update only `inline_decisions` (+ pivot record if there was one). No full JOURNAL entry (a single line is enough if useful).
- {{OPERATOR}} has already pushed and asks for handoff afterward: run 4-7 (1-3 already covered).
- Real blockers (red tests, broken build): update `blockers` with the details and a link to the output.

## What NOT to do

- Don't write generic `next_actions` like "continue the work" — 1-3 concrete actions.
- Don't **accumulate** archives in `focus`/`next_actions`/`inline_decisions` — history goes into JOURNAL + ledger (the Board stays lean, size guard).
- Don't skip the JOURNAL entry if real commits were made.
- Don't touch the project's frozen archives.
- Don't run `git add -A` / `git add .` — only selective staging of the task's files.
