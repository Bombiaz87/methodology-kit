> KIT · [agnostic] — the context-engineering pattern: why heavy work runs in fresh-context subagents, what stays in the lean main session, and how the living state machine carries memory ACROSS contexts. Adapt it: the division of labor is the invariant; the exact tool (subagents, workflows, worktrees) is your stack's business.

# Context engineering — fresh-context subagents

## The problem: context rot

An agent's output quality **degrades as its context window fills up**. A long session accumulates: dumped file contents, tool output, dead ends, half-abandoned plans. Past a point the model is reasoning over a haystack of its own making — it loses the thread, re-reads what it already knows, contradicts an earlier decision, misses an instruction buried 100k tokens up. This is **context rot**, and it's the silent failure mode of "just keep chatting with the agent until it's done".

**In plain language.** A fresh mind solves a problem cleanly; the same mind after eight hours of noise, less so. An AI has no "fresh morning" — every file it reads and every command it runs stays in the window until the window is full. Quality doesn't fall off a cliff, it *erodes* — so you don't notice until the output is quietly worse.

## The pattern: heavy work in fresh contexts, a lean main session

The fix is **not** a bigger window (a bigger haystack is still a haystack). It's a division of labor:

- **The main session stays lean.** It orchestrates: it holds the plan, the decisions, and the thread — not the raw material. It reads *conclusions*, not file dumps.
- **Heavy work runs in fresh-context subagents.** A wide read, a self-contained build step, an audit of one module — each runs in its **own clean context**, does one job, and returns *only the result*. The subagent's noise (the 40 files it read to answer) dies with it; the main session keeps the one-paragraph answer.

**In plain language.** Don't do the messy work in the room where you keep the plan. Send someone into a separate room to dig through the files, and have them come back with the answer — not with the pile of files. The plan-room stays clear.

### What runs where

| Runs in a **subagent** (fresh context) | Stays in the **main session** (lean) |
|---|---|
| Wide/repetitive reads ("where is X used?", sweep many files) | The plan, the decisions, the thread |
| Self-contained transforms (translate/lift/migrate a batch) | Choosing what to fan out, and stitching results together |
| A per-module audit / review | Judgment calls, trade-offs, the interview with the operator |
| Anything whose *inputs* are large but whose *output* is a summary | Anything that needs the whole conversation's memory |

Rule of thumb: **fan out the work whose inputs are big and whose output is small.** A search reads thousands of lines and returns a list — perfect for a subagent. A design decision needs the whole context and returns a paragraph — keep it in the main session.

## Memory across contexts = the living state machine

A subagent's context vanishes when it finishes; the *next* session starts blank. So what carries knowledge across the boundary can't be the context window — it has to be **durable artifacts on disk**. This is exactly what the [living state machine](../handbook/04-living-state-machine.md) is for:

- **STATE.md (the Board)** — where things are *right now*: the cross-session handoff.
- **JOURNAL.md** — what happened and *why*: the narrative a fresh agent reads to catch up.
- **ADR / PDR + memory** — the durable *why* behind decisions.

**In plain language.** The subagents are disposable; the *documents* are the memory. That's why the kit invests so hard in keeping STATE/JOURNAL honest: they're the only thing that survives when a context window is thrown away. A fresh agent doesn't inherit the previous agent's memory — it inherits its *documents*.

> This is the tie-in with Axiom 1 (`../handbook/00-philosophy.md`): if the durable artifacts drift from reality, every fresh context starts from a lie. Context engineering only pays off when the handoff artifacts are trustworthy — which is what the anti-drift automation guarantees.

## Parallel waves (fan-out)

When the work partitions into independent units (per file, per module, per dimension), run the subagents in **parallel waves** instead of one long serial session. The mechanism (and its cost caveats) is the multi-agent workflow in [`../handbook/07-claude-harness.md`](../handbook/07-claude-harness.md) §6; a runnable example is `scaffold/.claude/workflows/example-audit.js`.

- **Partition deterministically** (per module/file), one job per subagent.
- **Verify adversarially** before trusting results — a skeptic per finding, default "refuted" without concrete evidence (the find-vs-judge pair, `../handbook/07-claude-harness.md` §3a).
- **Persist the output**: a wave's results are volatile. If they're worth keeping they go into `docs/` (a report, a Journal entry), otherwise the cost is burned.
- **Single-writer on shared state.** Only the **orchestrator** (the main session) writes the shared SSOT — `STATE.md`, `JOURNAL.md`, `DIRECTION.md`. Subagents **return results**; they don't write those files. Concurrent writers to the same markdown = last-writer-wins corruption. If a subagent must persist, it writes to its **own scoped file** (a per-agent report) and the orchestrator merges — never the shared one. (Same hazard as sharing a working tree across sessions — `../handbook/07-claude-harness.md` §3a, "read-only" — here at fan-out scale.)

## Mixed models — match the tier to the job

Fanning out doesn't mean "everything on the biggest model". Effort ≠ tier. Put the **cheaper, faster model on the mechanical stages** (lifts, inventories, file sweeps, batch transforms) and reserve the **top model for judgment** (synthesis, trade-offs, adversarial review). A hundred cheap sweepers plus one sharp synthesizer beats a hundred expensive sweepers.

## Anti-patterns

- **The bloated main session.** Reading dozens of files *into the orchestrating context* instead of sending a subagent. The plan-room fills with raw material and rots.
- **Fan-out for its own sake.** A workflow is expensive; for a narrow question a couple of inline searches beat spawning agents (see `../handbook/07-claude-harness.md` §6 — OPT-IN, on consent).
- **Trusting volatile output.** A subagent's result is a *claim*: verify it (assert-by-observation, `../handbook/06-engineering-practices.md`) before it becomes a decision.
- **Relying on the window as memory.** If it isn't written to a durable artifact, the next context won't have it. Write it down.

## See also

- `../handbook/07-claude-harness.md` §6 — multi-agent workflows (the mechanism)
- `../handbook/04-living-state-machine.md` — the durable memory across contexts
- `../handbook/06-engineering-practices.md` — assert-by-observation (how to verify volatile output)
- `pattern-ci.md` · `sentinels-and-generators.md`
