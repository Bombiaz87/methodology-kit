> KIT · [agnostic] — guide to using Claude Code assets (CLAUDE.md, memory, skills, commands, settings, workflows, worktrees, scheduling) as part of the method. Adapt it by replacing the `{{...}}` placeholders with your project's values.

# 07 · The Claude Code harness

> **In plain language.** Claude Code isn't just "a chat that writes code": it's a set of files and mechanisms that decide *what Claude knows by default*, *what it can and can't do*, and *what rituals it runs*. This chapter explains how to bend each of these pieces to serve the method. Think of Claude as a new collaborator: the harness is its contract, its onboarding manual, and its access keys.

The harness has nine components. For each: **what it is**, **when to use it**, **the gotchas**.

---

## 1. `CLAUDE.md` — the charter (root) + local scope (nested)

`CLAUDE.md` is the file Claude reads automatically. It's the most important piece of the harness: it's the only context that enters **every** chat without anyone asking for it.

### 1a. Root = charter + INDEX of the nested files

The `CLAUDE.md` at the root of `{{REPO_PATH}}` does two things, and only two:

1. **Charter**: what the project is in 3-5 lines, the current status, and **pointers** to the documents to read before acting (in priority order). It indicates which document answers which question ("where the product is going" → DIRECTION; "technical decisions" → architecture; "current status" → the living state machine).
2. **Index of the nested files**: one line per subfolder `CLAUDE.md`, saying *what that local scope is for*.

The root also contains the **cross-cutting operating conventions** (git rules, decision methodology, security constraints like "never install without consent"). These are **stable** rules, not a chronicle.

> **Example (nested index line).** `- {{REPO_PATH}}/app-x/CLAUDE.md — operator console (local scope)`. One line is enough to let Claude know that folder has its own rules.

### 1b. Nested = per-area local scope

When you work on a specific area, Claude **also** reads that folder's `CLAUDE.md`. The nested file doesn't repeat the charter: it adds what applies **only there**:

- the area's **local stack** (framework, runtime, specific library);
- the **targeted commands** (build/test/run for *that* module);
- the **gotchas** (known traps in that area);
- the **relationships** with other modules (what it imports, what it exposes);
- the **decision IDs** governing that area (links to the relevant ADRs / mini-ADRs).

### 1c. The four forms of nested files

Tailored to the area they describe:

| Form | When | Distinctive trait |
|---|---|---|
| **Minimal high-density** | **sensitive** area (security, data, critical boundaries) | few lines, every line is a non-negotiable constraint; zero prose |
| **App** | an app/executable | run/build commands, dev ports/hosts, user-facing flows |
| **Package/library** | a shared package | public API, what's copy-literal vs rewritable, import boundaries |
| **Different-runtime** | area on a runtime ≠ the repo's default | **opens with "NOT \<default framework\>"** to break the automatic assumption |

> **In plain language.** The "different-runtime" form exists because Claude, by inertia, assumes the repo's dominant framework. If a folder runs on a different runtime, the first line of its nested file must *explicitly deny the assumption* ("NOT the dominant {{STACK}} — here it's …"), otherwise Claude will write code in the wrong framework.

### 1d. Golden rule: STABLE orientation, not a changelog

`CLAUDE.md` (root or nested) contains **rules and orientation that change rarely**. It is NOT a logbook.

- **Anti-pattern**: build logs, session chronicles, "in this session I did X". It bloats the file, makes it noisy, and Claude wastes context reading history instead of rules. → all of this belongs in the **journal** (see `04-living-state-machine.md`).
- **Sanity check at handoff**: ask yourself whether something *non-trivial and stable* emerged during the work (a new command, a quirk, a convention). Only then update the affected nested file. No mechanical updates.
- **Enforcement → hook, not instruction.** If a rule is *verifiable by a machine* (lint, format, secrets, naming, structure), its place is a **hook/sentinel/CI** — a git-hook at commit/push time, or a **native session hook** (§9) for enforcement *inside* the chat — not a line in the charter: binding automation beats voluntary discipline (Axiom 1). What stays in `CLAUDE.md` is only what is **behavioral and not-inferable from the code**. It's the twin anti-pattern of the changelog: the *CLAUDE.md-as-lint-rule-list* (see `reference/pattern-nested-claude-md.md`).
- **CRITICAL block up top.** The few load-bearing rules (~5-10) + the *honesty/anti-sycophancy* directives (see `06-engineering-practices.md` §2b) live in a short, marked block at the top of the root: it's the priority signal the agent reads first. Marking everything = marking nothing — keep the list short.

> **Gotcha.** The root is ALWAYS read: every extra line is a cost on every chat. Keep the charter lean and delegate details to the pointed-to documents and the nested files.

---

## 2. Memory — persistent facts, outside the repo

Memory is how Claude remembers things **across different chats** without them being in the code.

### 2a. Structure: one-fact-per-file + index

- Each fact lives in **a dedicated file** (e.g. `fact-name.md`).
- An **index** (`MEMORY.md`) lists **one line per fact**, with a link to the file.
- The files live **OUTSIDE the repo** (e.g. in Claude's projects folder, not in `{{REPO_PATH}}`): they're the notes of whoever is working, not versioned project artifacts.

### 2b. The four types of memory

| Type | Captures | Example content |
|---|---|---|
| **user** | {{OPERATOR}}'s profile and preferences | "{{OPERATOR}} is a PM-director (decides; the AI writes the code); wants double layer tech+product" |
| **feedback** | a lesson learned, often from a mistake | "run the linter before committing: CI treats format diff as an error" |
| **project** | a project state/decision not obvious from the code | "subsystem Y is blocked waiting on external input from {{OPERATOR}}" |
| **reference** | an environment setup/config/quirk | "how to rebuild the app in prod; which environment variable is needed where" |

### 2c. File body: Why + How-to-apply + wiki-link

Every memory file isn't a loose note: it has a structure.

- **Why**: why this thing is true / why it was learned (often the concrete case that generated it).
- **How-to-apply**: what to concretely do next time.
- **Wiki-link** to other related memories (`[[other-fact]]`), so the index stays a navigable network.

### 2d. When to save (and when NOT to)

Save to memory **only things not obvious from the codebase**. If a fresh agent can discover it by reading the code in 30 seconds, it doesn't belong in memory. What belongs in memory: human preferences, lessons from mistakes, external blockers, environment quirks, decisions the code doesn't explain.

> **Gotcha — index size limit.** The `MEMORY.md` index gets loaded into context: if it grows too much, it gets **truncated** and Claude loses pieces of the index. Keep every index line **under ~200 characters** (one line, one fact, one link); the details live in the linked files, **not** in the index. If the index exceeds the limit, shorten the lines — don't add prose.

---

## 3. Skills — invocable reusable capabilities

A skill is a packaged procedure that Claude can invoke by name. Two families recur in the method.

### 3a. Process skills: the find-vs-judge PAIR

The most powerful pattern is a **pair** of complementary skills:

- **Adversarial reviewer** (the *finder*): takes on multiple hostile personas with different priorities (e.g. someone who wants to break the code, someone who has to understand it in 6 months with no context, a security auditor, a guardian of direction, a "cutter" who asks whether the code should even exist). Each persona MUST produce at least one finding; severity has levels (e.g. CRITICAL/WARNING/NOTE); a finding gets promoted one level if 2+ personas catch the same problem. **It's read-only: it just finds, it does NOT commit.**
- **Finding-triage** (the *judge + actor*): takes the finding list and, **one at a time**, applies judgment gates (is it valid? does the fix introduce new bugs? can it only be solved later?) and picks an action (fix-now / fix-with-dependency / todo-later / accept-with-rationale), re-verifying after each fix. **This one also does NOT commit.**

> **In plain language.** The reviewer is the prosecutor (accuses, doesn't convict). The triage is the judge + the executor (decides what truly deserves a fix and applies it). Keeping them separate avoids two opposite traps: the complacent "LGTM" (a review that finds nothing) and the reflexive "fix everything in a row" (where the remedy is sometimes riskier than the defect). Neither one commits: the commit stays an explicit decision by {{OPERATOR}}.

**Why read-only is an invariant.** When working across multiple sessions in the same folder, the working tree can contain changes from other tasks. A skill that commits or runs `git add` risks pulling in someone else's work. Rule: process skills **read diffs, act at most on files in the working tree, but don't stage and don't commit**.

### 3b. Codegen skills: dedup-check → generate → report

To generate new repetitive code (a component, a template module), the skill follows three steps:

1. **dedup-check**: does something equivalent already exist? (avoids reinventing).
2. **generate**: create the artifact with canonical imports, tokens/conventions from the SSOT, and update the registration points (barrel export, index).
3. **report**: state what it created and where, so the operator can verify.

### 3c. `SKILL.md` format

A skill is a folder with a `SKILL.md` file. The frontmatter is what matters most:

```markdown
---
name: <skill-name>
description: <TRIGGER-RICH description — when to use it, on what, what it's NOT>
---

# Skill: <skill-name>

## When to use me
## Do NOT use me if
## The problem it solves
## Procedure (numbered steps)
## Output format
## Anti-patterns
## References
```

> **Gotcha — the `description` is the trigger.** Claude decides *whether* to invoke a skill by reading its `description`. A vague description ("reviews the code") never fires at the right moment. A trigger-rich description ("propose at the end of a task touching sensitive areas \<list\>, before committing non-trivial code, after a long session…") makes the auto-suggest fire when needed. Invest in the `description`, not just the body.

> **Gotcha — auto-suggest ≠ auto-execution.** Sensitive skills are **proposed**, not launched on their own. {{OPERATOR}} confirms. On trivial tasks, don't propose them at all (useless ceremony).

---

## 4. Slash commands — the rituals

A slash command (`/name`) is a fixed procedure the operator invokes on demand. The difference from a skill: the command is an **explicit ritual**, typically closing or opening, not a capability Claude proposes on its own.

The key ritual is the **handoff** (`{{HANDOFF_CMD}}`): to run before closing a work chat. It updates the **living state machine** (focus, next actions, blockers, decisions made) and adds an entry to the **journal** ("what happened and why"). See `04-living-state-machine.md` for the content, and `scaffold/.claude/commands/handoff.md` for the template.

> **In plain language.** The handoff is the "save the game" at the end of the session: the next chat (or the next agent) picks up knowing where things were left off, without having to reconstruct context by hand. It's a ritual because it must be run *every time* work has moved forward, not whenever it happens to.

> **Gotcha.** The command is an *instruction file*, not magic: it tells Claude what to do step-by-step. Keep it deterministic (numbered sequence, what NOT to do at the bottom) so the outcome is the same every time.

---

## 5. `settings.json` (deny-only) vs `settings.local.json` (allow-list) vs `.mcp.json`

Three files govern permissions and integrations.

### 5a. `settings.json` — the security floor (deny-only, versioned)

It's the file **shared and versioned**. It mainly contains **denies**: what NO ONE should ever be able to do in this repo. It's a *security floor*, not a convenience list.

> **Example (recurring denies).** Forbid installing packages without consent (`Bash(npm install *)`, `Bash(npx *)`, `apt`/`pip` install); forbid editing sensitive artifacts (migrations folder, generated/IP files not to be refactored); forbid reading noise folders (`**/dist/**`, `**/.cache/**`) to avoid wasting context.

### 5b. `settings.local.json` — personal allow-list (NOT versioned)

It's the **personal** file, in `.gitignore`. Here everyone puts their own **allows** to reduce permission prompts on commands they use often (read-only, trusted tools). It doesn't touch the shared floor.

> **In plain language.** `settings.json` says *"this is forbidden to anyone working here"* (and gets committed). `settings.local.json` says *"I trust these commands, don't ask me every time"* (and stays on my machine). Kept separate on purpose: security is collective, convenience is personal.

### 5c. `.mcp.json` — MCP servers (external integrations)

Declares the available MCP (Model Context Protocol) servers: integrations that give Claude additional tools (access to a registry, a service, external data). In `settings.json` you explicitly enable which `.mcp.json` servers are active (`enabledMcpjsonServers`). Keep a versioned `.mcp.json.example` as a template; the real one can contain secrets and goes in `.gitignore`.

> **Gotcha — JSON has no comments.** Settings files are strict JSON: you CANNOT put the kit banner inside. The scaffold manifest documents the tag, not the file.

---

## 6. Multi-agent workflows — OPT-IN, costly, output must be persisted

A workflow (a script that orchestrates many Claude agents in parallel) is a powerful but **expensive** tool. Rules of use:

1. **OPT-IN with explicit consent.** Never launch a massive fan-out of agents on your own initiative: it costs a lot (dozens/hundreds of agents). For narrow research or audits, inline work is enough (a few searches + synthesis), not a workflow.
2. **Run ONE skill per-module.** The healthy pattern: partition the work into deterministic units (e.g. per module/file) and run the **same process skill** on each in parallel, then an adversarial verification phase (a skeptic who tries to disprove each finding) and a synthesis phase.
3. **Ephemeral output must be PERSISTED.** The agents in a workflow produce volatile output: if it's worth keeping, save it in `docs/` (a report, a journal entry). Otherwise the cost is burned.
4. **Single-writer on shared state.** The orchestrator owns the shared SSOT (`STATE.md` / `JOURNAL.md` / `DIRECTION.md`); subagents **return results** or write their **own scoped file** — never the shared one (concurrent writers corrupt it, last-writer-wins). Detail in [`reference/context-engineering.md`](../reference/context-engineering.md) (Parallel waves).

> **In plain language (typical structure).** Phase 1 *Review*: N agents apply the skill to their assigned files. Phase 2 *Verify*: a skeptic for each serious finding tries to prove it's a false positive (default = "refuted" if no concrete evidence is found) — cuts the noise. Phase 3 *Synthesis*: dedup + severity promotion for findings caught from 2+ angles + final report in the skill's format. The value isn't "lots of agents": it's the *adversarial verification* that throws out false positives before bothering {{OPERATOR}}.

> **Gotcha.** A workflow doesn't replace judgment: it produces a list to **triage** (see the find-vs-judge pair §3a). The report is input for the triage, not a truth to apply.

> **Why fan out at all** — the deeper *why* (context rot) and the division of labor (what runs in a subagent vs the lean main session, and how STATE/JOURNAL carry memory across contexts) are in [`reference/context-engineering.md`](../reference/context-engineering.md).

---

## 7. Worktree — isolated parallel work

A git worktree is a second working tree on the same repo, on a different branch, in a separate folder. It's useful when you want an agent to work on something **without contaminating** the main working tree (where there might be work in progress from another session).

- **When to use it**: a long, isolated task you want to keep separate; multiple agents working in parallel on independent portions without stepping on each other's files.
- **Gotcha**: every worktree is a real folder on disk with its own state; remember to remove it when you're done. And watch out: builds/dependencies may need to be redone in the new tree (it doesn't share the build folder with the main one).

> **In plain language.** If the main folder is the desk you're already working on, a worktree is a second desk for a parallel task: same archive (repo), different sheets (branch), no risk of mixing up the papers.

---

## 8. Scheduling — recurring agents (cron / loop)

Claude Code can run **recurring** agents:

- **Loop**: repeat a prompt/command at intervals (e.g. every N minutes) or let the model self-pace. Useful for polling a state ("check the build every 5 minutes") until a condition is met.
- **Cron / scheduled routines**: agents that start on a schedule (e.g. a nightly check, a periodic report). Also scheduled one-shots ("run this once at 3pm").

- **When to use it**: monitoring/polling, periodic maintenance, recurring operational reminders.
- **Gotcha**: scheduling is for *genuinely recurring* tasks, not for one-offs. And like workflows, it can consume resources while you're not watching: define a clear **stop condition** (the until-loop that exits when the condition is true), otherwise it spins idle.

> **In plain language.** It's the harness's alarm clock/timer: "redo this thing every so often" or "do this for me at such-and-such time." Not to be confused with the workflow (§6), which is "do this thing once, but with lots of agents together."

---

## 9. Native session hooks — enforcement that runs *inside* the chat

The git hooks of `08-quality-automation.md` fire at commit / push / CI — **outside** the session, on the filesystem, stack-agnostic. **Native session hooks are a different thing**, and the most granular enforcement mechanism the method has: scripts Claude Code runs at lifecycle events **during** the conversation (`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `PreCompact`), declared in `.claude/settings.json` under a `hooks` key. They can **inject context**, **react to a tool call**, or **remind before the turn ends** — things a git hook can't do, because it isn't in the room.

This closes a real gap. Two pillars of the method were, until now, *hoped-for* rather than *mechanical*:

- the **cold-start ritual** ("a fresh chat reads the Board first", `04-living-state-machine.md` · Recovery) depended on the agent choosing to read it;
- **Layer 3** (the in-context checklist, `04`) is by the book the **weakest** defense, because it fires only if the model reads it before its last message.

A `SessionStart` hook that prints the Board makes the first mechanical; a `Stop` hook that reminds to run {{HANDOFF_CMD}} makes the second mechanical. It's the same principle as §1d ("enforcement → hook, not instruction") — native hooks are just the version of it that acts **in-session**.

### The events that matter for the method

| Event | Advisory use in the method | Ships in the scaffold |
|---|---|---|
| `SessionStart` | inject a compact Board brief → the cold chat starts oriented | `scripts/hook-session-brief.mjs` |
| `Stop` | if work moved but wasn't saved, remind to run {{HANDOFF_CMD}} | `scripts/hook-handoff-reminder.mjs` |
| `PreCompact` | remind to flush in-context progress before the window is compacted | documented, not shipped |
| `PreToolUse` | on a write to a **sensitive path**, nudge the review/copy gate skill — turns a documented convention into a checked one | documented, not shipped |

### Gotchas (the non-negotiables)

- **Advisory-only, never blocking.** A hook *can* trap the turn (block a tool call, refuse `Stop`) — the kit deliberately does **not**. That machinery is for **unattended, autonomous** agents; the method is interview-first and human-gated (`01-operating-model.md`), so a hook here **reminds and injects, it never bars the way** (warning-vs-blocking, `reference/sentinels-and-generators.md` §1). A blocking `Stop`-gate variant exists for autonomous runs — we don't ship it as a default on purpose.
- **Fail-open.** A hook runs automatically on every event: if its script errors, it must `exit 0`, never break the session. The two shipped hooks wrap everything and exit 0 on any failure.
- **Cheap and quiet.** A `PreToolUse` fires on *every* tool call: it must be fast and say nothing 99% of the time. A `SessionStart` brief lands in **every** fresh context — keep it tiny (it's a cost, like the root `CLAUDE.md`, §1d).
- **The referenced scripts are a drift surface.** A hook that points at a renamed script fails **silently** (it just does nothing). That's exactly what `check-harness-refs.mjs` guards (`reference/sentinels-and-generators.md`).
- **JSON has no comments.** Like `settings.json` (§5c), the `hooks` block can't carry the kit banner — the scaffold manifest documents it.
- **The event schema moves.** Claude Code's hook events/format evolve: this section fixes the *principle* + a minimal example, not the full event catalog. For exact event names and I/O, read the official docs — don't mirror them here (the doc-as-changelog anti-pattern, §1d).

> **In plain language.** Git hooks are the guard at the door: they check you on the way out (commit / push). Session hooks are a colleague *in the room*: at the start they hand you the whiteboard so you know where things stand; at the end they tap you on the shoulder — "did you save?". They remind, they don't lock you in.

---

## How it holds together

| Component | Question it answers | Lives |
|---|---|---|
| `CLAUDE.md` root | "what is the project, what do I read first" | versioned, root |
| `CLAUDE.md` nested | "what applies only in this area" | versioned, per folder |
| Memory | "what I remember across chats (not obvious from the code)" | outside the repo |
| Skill | "which reusable capability I invoke" | `.claude/skills/` |
| Slash command | "which ritual I run" | `.claude/commands/` |
| `settings.json` | "what's forbidden to everyone" | versioned |
| `settings.local.json` | "what I trust doing without a prompt" | not versioned |
| `.mcp.json` | "which external integrations I have" | versioned example |
| Workflow | "costly fan-out, on consent" | `.claude/workflows/` |
| Worktree | "isolated parallel work" | separate folder |
| Scheduling | "recurrence over time" | cron/loop |
| Session hook | "run a script at a lifecycle event, *in-session*" | `.claude/settings.json` (`hooks`) |

> **Guiding principle.** The harness exists to make sure a *fresh* agent, on a *new* chat, is immediately aligned with the method: it knows what to read (CLAUDE.md + memory), what not to do (settings deny), which rituals to run (handoff), and which hostile capabilities it can call before committing (the reviewer/triage pair). If a new agent misbehaves, the cause is almost always a missing or imprecise piece of harness — not the agent.

Cross-link: `01-operating-model.md` · `02-decision-discipline.md` · `04-living-state-machine.md` · `05-communication.md` · `reference/context-engineering.md` · `reference/pattern-nested-claude-md.md` · `reference/memory-protocol.md`
