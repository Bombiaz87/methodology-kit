> KIT · [agnostic] — How to keep project state coherent without trusting the model's memory. Adapt it: replace the {{...}} tokens and pick your own file names, but keep the roles (Board / JOURNAL / LEDGER) and the layered defense.

# 04 — The living state machine

> **In plain language**: an AI assistant doesn't remember anything between one chat and the next. If the project's state lives only "in its head", the next chat starts blind. This chapter describes how to keep the state **written to files**, so that a new — cold — chat understands where the project stands by reading, not guessing.

## The problem: the model's memory is not reliable

Every chat with Claude Code starts with no memory of the previous one. Even within the same long chat, the instruction "remember to update the state file" gets lost. So **we cannot entrust the project's state to the model's memory**: it must live in versioned files, updated by mechanisms that do NOT depend on the model "remembering".

Three files do the job, with three distinct roles:

| File | Role | Shape | Growth |
|---|---|---|---|
| **Board** (`STATE.md`) | snapshot of the *present* — what's in flight, what's next, the milestones | lean, continuously pruned | never grows (size-guard) |
| **JOURNAL** (`JOURNAL.md`) | the *history* — what was done and **why** | append-only, one entry per session | grows forever |
| **LEDGER** (`inline-decisions.md`) | the *overflow* of micro-decisions | append-only, newest-first | grows forever |

---

## The Board — the snapshot of the present, pruned at every handoff

The Board (`STATE.md`) answers a single question: **"if I open a new chat right now, where do I pick up from?"**. To do this well it must stay **small**. A Board that accumulates everything becomes a 5000-line file that neither the model nor the {{OPERATOR}} actually reads.

Typical Board content:
- Current **Focus** (what's "in flight" right now).
- Work columns: *In flight* / *Next* / *Gate or milestones* / *Backlog*.
- A **machine-readable** frontmatter (fields that a git hook updates on its own: last commit, its message, timestamp, **and the author** — the basis of attribution in team profile).
- The last ~15 micro-decisions (older ones overflow into the LEDGER).

<!-- profile:team -->
> **`team` profile.** With multiple devs on a shared origin the Board changes: every *In flight* entry carries an **owner** and machine-readable blockers (`blockedBy:[slug]`, slug keys never numeric), and volatile state can live on a **tracker** instead of the single file (a merge-conflict magnet). Every record carries **attribution** (who·where·when; the frontmatter's author field is stamped by the post-commit hook), and the **staleness-guard** below acts as a **circuit-breaker** on stalled entries. Detail in `09-operating-profiles.md`.
<!-- /profile:team -->

**Prune rule**: at every handoff the Board gets **pruned**. Entries that leave aren't thrown away — they go into the LEDGER (see below). This is the key point: *the prune always has somewhere to go*, so pruning the Board doesn't lose information, it just moves it where it weighs less.

### Size-guard

A sentinel (`check-state-size.mjs`, see [sentinels-and-generators](../reference/sentinels-and-generators.md)) checks that the Board doesn't exceed a size threshold. If it does, that's the signal that pruning is overdue: entries need to move to the LEDGER. The sentinel **warns** (ideally in pre-push, non-blocking) — it doesn't prune on its own, it reminds you to.

> **In plain language**: the Board is like the kitchen whiteboard in a restaurant — only what's needed *right now* goes on it. When it fills up, old notes get archived in a notebook, not deleted.

### Staleness-guard

The coherence sentinel (`check-coherence.mjs`, see [sentinels-and-generators](../reference/sentinels-and-generators.md) and `08-quality-automation.md`) includes a **Board hygiene** check: if there are "In flight" entries but the last handoff is beyond a day threshold, it **warns** that the Board might be stale (work stalled too long, or a skipped handoff). And if the frontmatter declares `blockers`, it resurfaces them so they don't slip into oblivion. This too is warning-only: it reminds, it doesn't block.

> **In plain language**: a sticky note that tells you "this thing has been on the whiteboard for three weeks and hasn't moved — is it really still in flight, or did you just park it?". The typical case is work blocked waiting on someone else that nobody remembers anymore.

---

## The JOURNAL — the backbone of "what and why"

The JOURNAL is **append-only**: one entry per work session, ordered newest-first. A past entry is never rewritten. It's the project's narrative backbone: six months from now, "why did we do it this way?" gets answered by reading the JOURNAL, not by interrogating the code.

Typical structure of an entry (faithful lift from the real method):

```markdown
## YYYY-MM-DD — Session: <short title> [tag]

**{{OPERATOR}} goal**: what the operator asked at the start of the chat (verbatim).

**Outcome**: what was actually done. Honest: including false alarms,
wrong hypotheses corrected mid-flight, bugs caught by manual QA.

**Decisions made**:
- <decision> → record: <where the "why" lives: ADR / mini-ADR / JOURNAL-only>

**Records created/updated**: ADRs/decisions touched.
**Commits**: <sha> (<description>) — pushed / local.

**In plain language**: 2-4 sentences readable by a non-technical person. What changes,
seen from outside. (See [05-communication](05-communication.md).)
```

Two details that make the difference:
1. **Every decision declares where its "why" lives**. Not everything deserves an architecture document: a micro UX choice can be "JOURNAL-only"; a constraint that outlives phases deserves an ADR. The JOURNAL notes *at what durability level* the rationale was recorded (see [02-decision-discipline](02-decision-discipline.md)).
2. **The "In plain language" line** matters when the {{OPERATOR}} is a PM-director who doesn't write code — the JOURNAL entry is also their way of staying aligned. For a PM-dev it's optional (see `09-operating-profiles.md`).

> **In plain language**: the JOURNAL is the ship's logbook. You write at the bottom, you don't correct the past. It's there so you don't have the same discussion twice, and to explain to whoever arrives later *why* things are the way they are.

---

## The LEDGER — the overflow that keeps everything

The Board keeps the ~15 most recent micro-decisions; the **LEDGER** (`30-reference/inline-decisions.md`) keeps **all** of them, newest-first, append-only. It's the archive where the Board's prune gets deposited.

Why two places? Because they have different users:
- The **Board** is read by a cold chat to get oriented *right now* → it must stay light.
- The **LEDGER** gets consulted when archaeology is needed ("wait, where did we note that timestamp gotcha?") → it can be huge, since nobody ever reads it end to end.

A LEDGER entry is a dense line: date, session, decision, technical gotcha, reference to the ADR/mini-ADR if formalized elsewhere. *Formalized* decisions point back to their ADR; the others are operational notes that don't live anywhere else.

> **In plain language**: the LEDGER is the restaurant's archive notebook. Every note from the whiteboard ends up there when it's erased. Nobody reads it every day, but when you need to find a detail, it's there.

---

## The layered defense

This is the heart of the method: **not a single mechanism, but three, from most binding to least**. If one fails (or the model "forgets"), the next one holds.

### Layer 1 — Git hook (binding, machine-readable fields)

A `post-commit` hook runs a script (e.g. `update-state.mjs`) that modifies the Board's machine-readable frontmatter **in-place**: last commit, its message, commit timestamp, update timestamp. It runs **after every commit**, automatically, whether the model remembers to or not. An optional `pre-push` hook can block the push if an invariant is violated.

This is the **strong** layer because it doesn't depend on anyone's willpower: git runs it. Swap in the equivalent for your {{STACK}} ({{PKG_MANAGER}} + a lightweight hook manager); see [03-handoff-protocol](../scaffold/docs/implementation/20-discipline/03-handoff-protocol.md) in the scaffold for the recipe.

> **In plain language**: every time work gets "saved" (commit), a little robot updates the whiteboard's technical fields on its own. Nobody has to remember to do it.

<!-- profile:team -->
> **`team` profile — don't auto-stamp a shared Board.** This Layer-1 hook rewrites the committed `STATE.md` frontmatter on *every* commit — fine for one operator, a **merge-conflict magnet** when N devs commit on N branches. In team, either **don't wire the post-commit hook** (git already carries the commit's author/message/timestamp — the stamped fields are redundant, and volatile state lives on the tracker), or keep the Board **per-owner / gitignored** so no shared file is auto-written. The script honors `STATE_AUTOSTAMP=off` as a one-line opt-out. See `09-operating-profiles.md`.
<!-- /profile:team -->


### Layer 2 — Handoff slash command (human fields)

The {{HANDOFF_CMD}} slash command (e.g. `/handoff`) is launched by the {{OPERATOR}} before closing the chat. Claude runs it: re-reads `git log`, updates the Board's **human** fields (what's left to do, next steps, blockers) and **appends the JOURNAL entry** (goal, outcome, decisions, "in plain language"). See [03-handoff-protocol](../scaffold/docs/implementation/20-discipline/03-handoff-protocol.md).

The hook (Layer 1) has already taken care of the machine-readable part; the slash command adds the **human judgment** that a hook cannot infer.

### Layer 3 — In-context checklist (backstop)

A checklist at the tail of the working document ("Claude must confirm before closing"): state updated? log matches? decisions recorded? tests green? It's the last backstop, and it works **better than an instruction in CLAUDE.md** because it's *in-context* while the model writes its last message.

> **Make it mechanical (advisory hook).** Layer 3 is the weakest link *by design* — it fires only if the model reads the checklist. A native `Stop` hook (`07-claude-harness.md` §9) turns the hope into a mechanism: it reminds you to run {{HANDOFF_CMD}} when work moved but wasn't saved. A `SessionStart` hook injects the Board so the *cold* chat starts oriented (the "read the Board first" recovery, below, made automatic). Both stay **advisory** — they nudge, they don't block (warning-vs-blocking).

> **In plain language**: three overlapping safety nets. The first is automatic (git does it). The second is a command the operator launches. The third is a checklist the model has right in front of it. If the third one is skipped, the second has already done the bulk of the work; if the second is skipped too, the first has saved the bare minimum.

---

## The generators — maps for the cold agent

Beyond state, it helps to have **static maps** that a new agent reads to get oriented without manually exploring the whole repo:

- **Decisions → code map** (`generate-adr-map.mjs`): from every ADR to the files that implement it.
- **Module / geography map** (`generate-module-map.mjs`): what lives where, which module does what.

Generator rules (see [sentinels-and-generators](../reference/sentinels-and-generators.md)):
- They emit **committed `.md` files** (not an ephemeral report) — so the agent reads them as part of the repo.
- Header at the top: **"Auto-generated, do not edit by hand"** — the source of truth is the code/the ADRs, not the `.md`.
- **Manual run, not in a hook**: they run on-demand (when the structure changes), not on every commit, so as not to weigh down the flow.
- **PURE and DETERMINISTIC function of the source** — this is where the diagnostic value lies: an artifact that's generated *and committed* must depend ONLY on its source, never on the moment in time or filesystem ordering. In practice:
  - **no non-deterministic timestamp** in the output (no `Date.now()` / `new Date()`): the "when" is already in the file's git log. It's the same discipline the kit forbids in workflows (see `07-claude-harness.md`), extended to generators.
  - **sort the entries** with a stable tiebreak (e.g. by name), so the output doesn't depend on `readdir` order.
  - **exclude generated files from the formatter/linter** (Biome's `files.includes`, `.prettierignore`, etc.): an artifact must not pass through **two** producers — the generator *and* the formatter — or they'll diverge on the first re-run.

> **Why this is load-bearing.** If the generator is pure and deterministic, `git status` becomes a **free drift detector**: clean right after regeneration = "the maps are aligned with the code". With a timestamp (or the formatter's reformatting) the file *always* shows as modified → you can no longer tell real drift from noise, and you lose exactly the signal you needed.

> **In plain language**: two "maps" of the project, regenerated when needed, that the assistant reads to understand where everything is without having to rummage around. They're produced by a script, so they don't get edited by hand: they get regenerated. And they're built so that, if you regenerate them and nothing changes, it means they're still aligned with the code — a free check.

---

## The periodic anti-drift audit

This whole machine can **still** drift: the Board lies, the JOURNAL skips a session, the records don't match the code. That's why a **periodic audit** is needed to verify *whether the machine has worked*.

How to do it (see [audit-drift-template](../reference/audit-drift-template.md)):
- Create a **throwaway folder** (e.g. `_audit-YYYY-MM-DD/`) for the audit reports.
- Compare the declared state against reality: does the state match the `git log`? Do the documents cite decisions that were never propagated? Are there "ghost" records?
- Look for the **few root causes** (usually 2-3 unpropagated decisions, not a hundred independent bugs).
- Fix them **in batch** and note the outcome in the JOURNAL.
- The audit folder gets thrown away (or archived): it's a temporary artifact, not a permanent part of the repo.

Signals that it's time for an audit: too many "non-task" sessions in a row, the Board doesn't match the `git log`, the {{OPERATOR}} says "I can't make sense of anything in here anymore".

> **In plain language**: every so often you do an inventory check — verifying that the whiteboard, the logbook and the archive tell the truth about what's really in the code. You find the few real causes of the mess, fix them in one go, and throw away the audit's working papers.

---

## Recovery procedures (cold chat)

| Symptom | What to do |
|---|---|
| New chat, coherent system | Read CLAUDE.md → quick-start → **Board** → check `git log` → tell the {{OPERATOR}} where you are and what you propose |
| Stale Board (≠ `git log`) | Run the `update-state` script (simulates the hook), then rebuild the human fields from the JOURNAL + `git log` |
| Board cites a record that doesn't exist | Check the `git log` to see if it was renamed/removed, realign the Board |
| Broken git hooks | Reinstall the hooks ({{PKG_MANAGER}} install / re-trigger setup) — **never** disable them with `--no-verify`, they must be fixed |

---

## Anti-pattern

| Anti-pattern | Why it's bad |
|---|---|
| Editing the Board by hand without committing | Guaranteed drift between the working copy and everything else |
| Multiple "state files" in different places | One single source. There's ONE Board, ONE JOURNAL, ONE LEDGER |
| Editing an auto-generated `.md` file by hand | It'll get overwritten — edit the source (code/ADR) and regenerate |
| Marking something "done" without proof (green tests) | The records lie, bugs hide |
| Leaving the Board bloated "I'll clean it up later" | A cold chat won't read it → blind reset |

---

## For the {{OPERATOR}}: golden rules

1. **Always close the chat with {{HANDOFF_CMD}}** if you changed something. It costs 30 seconds, saves hours of "wait, where was I?".
2. **Don't push manually** if the chat closed badly — open a new chat and let it check the state first.
3. **If the hooks break, fix them**, don't disable them.
4. **When "nothing makes sense anymore", ask for an audit** (see above): it's the signal, not a failure.
