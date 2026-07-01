> KIT · [agnostic] — the "continuous flow + gate" operating model: the unit of work (Intervention) and the milestones (Gate). Adapt it: you define the Gates for your project; the Intervention cycle stays identical everywhere.

# 01 · Operating model — continuous flow + gate

> First file the agent reads in every new working chat, after `CLAUDE.md` and the Board. **60 seconds.**

The kit's default: work happens in **continuous flow**, not with a rigid plan of predefined stages. There's a single repeated unit of work — the **Intervention** — plus a few **Gates** (binary milestones) for the big milestones. *(This doesn't force you to throw away any planning system you already have: see "Coexists with a plan you already have" below.)*

**In plain language.** Instead of a rigid plan with stages ("phase 1, phase 2…"), everything that gets done — a bug, an idea, a polish, a pivot — goes through **the exact same flow**. It's predictable: anyone (operator or agent) always knows what comes next. The "Gates" are the few important milestones (e.g. "ready to go to production") that act as traffic lights.

---

## At the start of every new chat

1. Read `CLAUDE.md` (root) → this file → `docs/implementation/STATE.md` (the **Board**).
2. The Board tells you where you are in 10 seconds: the `focus` field in the frontmatter + the **In flight** column.
3. **Check git sync**: `git log --oneline -5` must match the Board's `last_commit` field. If it doesn't match → the Board is stale → run `{{HANDOFF_CMD}}` (or the state updater) before proceeding.
4. Proceed with an **Intervention** (below). The Board updates with every commit (the post-commit hook re-bumps the git fields automatically — see `04-living-state-machine.md`).

---

## The unit of work: the **Intervention**

A **single, deterministic, always-the-same** flow. This is where the value is: the depth scales with the work, but the steps are never skipped.

```
  ┌─ TRIGGER ── a QA pass · a pivot · a bug · an idea · a Gate to unblock
  │
  ▼
  INTERVIEW ── ALWAYS (the depth scales with the work)
  │    options · pros/cons · double layer · recommended.
  │    Structured thinking: not skipped for non-trivial work.
  │    (the operator can say "skip, it's plumbing" → straight to build)
  ▼
  CLASSIFY ── where does the "why" live? pick the record level:
  │    PDR / ADR / Journal   (routing table → 00-philosophy.md)
  ▼
  BUILD ── balanced TDD (→ 06-engineering-practices.md)
  │    HALT-and-ask if an unagreed blocker emerges
  ▼
  VERIFY ── walk through what was built; observe real behavior
  │    "eyes-on" smoke · adversarial review on sensitive areas
  │    fix (or a fix-plan) BEFORE "done"
  ▼
  COMMIT + JOURNAL + refresh BOARD   (end of chat: {{HANDOFF_CMD}})
  │
  └──────────────────────────────────────────────► next TRIGGER (loop)
```

### The six steps

1. **TRIGGER** — anything that opens work: an operator QA pass, a pivot, a bug, an idea, a Gate to unblock, a **reconciliation** (aligning existing code with decisions: you start from the *delta* between what the code does and what ADR/Board/conventions say, not from a new trigger). *No "task.md" needed: the Intervention's home is its commit + its Journal entry + its record at the right level.*

2. **INTERVIEW — always.** This is the moment of **structured thinking**: options are presented with pros/cons and a *recommended*, in **double layer** (precise technical + "in plain language" for the PM — see `05-communication.md`). The depth scales: for a tweak it's one question, for a capability it's a full round (archetypes + Business/UX/Technical blocks — see `docs/implementation/20-discipline/02-pre-task-interview.md`). **Not skipped for non-trivial work**; the operator can explicitly say "skip, it's plumbing" and it goes straight to build.

3. **CLASSIFY** — *where does the "why" live?* The record level is chosen per the routing table (`00-philosophy.md`, Axiom 2): product pivot → **PDR**; architectural decision → **ADR/mini-ADR**; everything else → **Journal entry** (+ memory if not obvious). The interview happens **in every case**; only where the "why" ends up changes.

4. **BUILD** — built with **TDD balanced** (test-first for pure business logic, critical invariants, and validation schemas; "alongside" tests for glue/UI/handlers; no tests for pure layout or copy-pasted components — detail in `06-engineering-practices.md`). If an unagreed blocker emerges during the build — an out-of-scope dependency, an unverifiable assumption, N consecutive failures, a red gate, an irreversible action — the **HALT-and-ask** rule applies: stop and ask, *without* marking the Intervention as done (blocking ambiguities are seeded as a grep-able marker `[TO-CLARIFY: …]`, caught by a pre-push sentinel).

5. **VERIFY — a step, not an afterthought.** Before the work can be called done, you **walk through what was actually built** and confirm it behaves as intended — you don't take "it should work" on faith. Two moves: an **"eyes-on" smoke test** where behavior is checked by *actually observing the real output* (assert-by-observation — see `06-engineering-practices.md`), and, on **sensitive areas**, a proposed **adversarial review**. Whatever Verify surfaces becomes a **fix — or, if it's larger, a written fix-plan — applied *before* the commit**. "Done" means *verified done*, not *written*: this is the guard against the most common AI-coding failure, code declared complete that nobody watched run.

6. **COMMIT + JOURNAL + refresh BOARD** — targeted commit (selective staging of only the Intervention's files, never `add -A`), entry in `JOURNAL.md`, Board refresh. End of chat: `{{HANDOFF_CMD}}`. *(This is the `solo` profile — default. In the `team` profile the Intervention lives on a branch and closes via PR, selective staging isn't needed: see `09-operating-profiles.md`.)*

> **The key rule (repeated because it's the heart of the method):** the record is proportional to **how long the decision lasts**, not how big the code is. A capability with architecture → ADR; a cosmetic tweak → Journal line. The interview happens regardless.

### Size (appetite): routing the depth

Before the archetype, the AI **proposes the size** of the Intervention (S/M/L) in one line and the operator corrects it. Size is a *proposed guide*, not a mandatory field: it routes **together** three things that would otherwise be decided by gut feel — how many interview rounds, which record level (the twin of Axiom 2), and whether an adversarial review is needed. It's **orthogonal to the archetype**: the archetype says *which blocks* to activate, the size says *how much the whole process weighs*. So a bugfix and a new subsystem, both "domain", don't get the same weight. (Table in `docs/implementation/20-discipline/02-pre-task-interview.md`, Step 0.)

---

## Gates — the milestones that replace phase exit-criteria

**Gates** are **a few binary, consequential milestones** (reached / not reached), each with its own checklist. They're the kit's way of marking important milestones: instead of "have we finished block X?", ask "is the Gate unblocked?".

Every Gate has a **Blocks / Unblocks** clause:

- **Blocks**: what must be true *before* it can be declared reached (its pre-condition checklist).
- **Unblocks**: what becomes possible *once* it's reached (the capabilities/activities that depended on it).

The living list of Gates, with their Blocks/Unblocks entries, lives in the **Board** (`STATE.md`, *Gate* section). Gates are **specific to your project** — you define them. Keep them **few** (a handful, order of magnitude) and **chained** (G2 can depend on G1).

> **In plain language.** A Gate is an important traffic light: "we can't take our first euro until the legal pages are ready", "we can't go to production until the environment is configured". There are few of them, they're clear-cut (either you're there or you're not), and each one opens the door to the next.
>
> *Example Gate chain (purely illustrative, rewrite it for your project): G0 public test surfaces → G1 legal entity established → G2 production deploy → G3 legal compliance to go live → G4 first customer.*

---

## Coexists with a plan you already have (doesn't necessarily replace it)

The model — continuous flow + Board (with a **Backlog** column) — **stands on its own**: if your project has no planning system at all, the Board is enough.

But if you already have one — a roadmap, milestones, an issue tracker, a kanban board — **the kit doesn't force you to throw it away**:

- The **Board** (`STATE.md`) becomes the **current state/focus**: where you are *right now*, in 10 seconds.
- What you already use to decide *what comes next* stays your **backlog source**: you pull the next Intervention from there.

In other words, the kit adds the *how* you work (the Intervention) and the *snapshot of the present* (the Board); it doesn't claim to replace *how you decide priorities*, if you already have one that works. **Neither the presence nor the absence of a plan is assumed.**

That said, coexistence isn't an excuse for a half-install. The method's value is **emergent** — the interlocking parts (anti-drift automation, record-by-duration, living state, the interview) reinforce each other, so the fuller and more coherent the adoption, the more it actually pays off; a fragment gives a fragment of the benefit. Keep the *tools* that already work, but don't leave *gaps* in the invariants just because change is friction. Which to keep, replace, or graft is your project's agent's call — it has the context of this codebase (see `../00-START-HERE.md`, *Adoption protocol* and *How much to adopt*).

> **In plain language.** If you don't have a plan, the kit's board is enough. If you already have one (in any form), you don't erase it: the board says "where I am now", your plan stays "what I do next".

---

## What stays identical (the mechanisms that already work)

Regardless of the trigger, these always stay: **interview** · **ADR/mini-ADR/PDR** at the right level · **append-only Journal** (the backbone of "what happened and why") · **memory** for non-obvious things · **verify before done** (assert-by-observation) · **adversarial review** on sensitive areas · **TDD balanced** · **plain-language summaries** for the operator (folded into the Journal).

---

## From here

- **How to make and record a decision (interview, ADR/PDR threshold, golden rule)** → `02-decision-discipline.md`
- **The two SSOT layers: technical (ADR) vs direction (PDR)** → `03-ssot-architecture.md`
- **The living Board: fields, automatic sync, sentinels** → `04-living-state-machine.md`
- **Communicating with the PM: the double layer** → `05-communication.md`
