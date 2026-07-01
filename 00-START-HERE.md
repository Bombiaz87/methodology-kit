# 00 · START HERE — adopting the kit in a project

> **KIT · [agnostic]** — bootstrap guide + **manifest** (tag and spec of every file). Read this after `README.md`, before copying anything.

This document serves two readers: **you** (the operator) and the new project's **Claude Code agent**. The agent should read `README.md` + this file + the `handbook/` **before acting**.

---

## 0. The 3 initial decisions

Before copying, decide three things (they then become the `{{PLACEHOLDER}}`s):

1. **Stack & package manager** of the target project → determines what is drop-in and what has to be rewritten (see the `[Node-ref]` tag).
2. **Operating topology — `solo` or `team`** (see *Operating profiles* below + `handbook/09`): it's the knob that decides *together* git, enforcement and where the state lives. `solo` (default) = direct work on `main`; `team` (multiple devs on a shared origin) = branch/PR, CI as the gate, attribution on the records.
3. **Do you want the doc-site** (Starlight) from the start or later? It's not mandatory: the `docs/` are plain markdown and work even without a site.

> These three are only the tip. The full list of configuration choices — and *who* answers them — is guided by the **Adoption protocol** (below): don't fill the placeholders blindly, let the agent run recon, proposal and interview.

### Placeholder table (search-and-replace across the whole scaffold)

| Token | Meaning | Example |
|---|---|---|
| `{{PROJECT}}` | name of the project/product | `Acme` |
| `{{COMPANY}}` · `{{PRODUCT}}` | *(optional)* legal entity vs customer-facing brand, when they differ from `{{PROJECT}}` | `Acme Ltd` · `AcmeApp` |
| `{{REPO_PATH}}` | absolute path of the repo | `/var/www/acme` |
| `{{STACK}}` | tech stack in one phrase | `Next.js / Postgres` |
| `{{PKG_MANAGER}}` | package manager | `pnpm` / `uv` / `cargo` |
| `{{PROCESS_MANAGER}}` | what keeps the dev processes alive | `pm2` / `systemd` |
| `{{OPERATOR}}` | who directs the project | first name |
| `{{DOMAIN_DEV}}` | dev environment domain | `dev.acme.com` |
| `{{DOMAIN_PROD}}` | production domain | `acme.com` |
| `{{DB}}` | database | `PostgreSQL 17` |
| `{{HANDOFF_CMD}}` | name of the closing slash command | `/handoff` |

> **`DOCS_ROOT` is not a text placeholder** but a **constant at the top of every script** (`const DOCS_ROOT = 'docs'`), default `docs`. If your docs root differs (e.g. `context/`), you change that line in the scripts — one point per script — without risking breaking the script by leaving an unreplaced `{{…}}`.

> Tip: `grep -rl '{{' scaffold/` lists all the files that still contain placeholders to fill.

> **`{{author}}` is not a bootstrap placeholder**: in the `team` profile it's filled at **runtime** from the git author (Journal / Board entry), not by search-and-replace. If the grep above flags it, ignore it.

---

## Invariants vs swappable defaults (read before calling them "conflicts")

The kit mixes two different things — keep them distinct when you adopt it.

**Invariants** — they are the *why it works*. Remove them and you lose the benefits. Non-negotiable:
- **Binding automation over voluntary discipline** (hooks / sentinels / machine-readable manifest — `handbook/00-philosophy.md`).
- **Record proportional to the decision's duration**, not to the code's size (PDR / ADR / Journal).
- **The interview before the build** — the structured thinking — always, for non-trivial work.
- **Communication tuned to the audience** (double layer): the technical layer is always there; the "plain language" layer when the operator doesn't write code — optional for a PM-dev. The invariant is *matching the altitude to the audience*, not the two fixed layers.
- **Living state machine**: Board + append-only Journal + overflow ledger.
- **Selective git staging** (never `add -A`) when multiple sessions share the working tree.
- **Assert-by-observation**: observe the real output before asserting.
- **Adversarial review** on sensitive areas before the commit.
- **Secrets twin**: a scanner that BLOCKS + encryption to COMMIT safely.

**Swappable defaults** — they are *preferences with a rationale*, not laws. If your project already has a different choice that works, **keep it**: adopt the *behavior*, not the tool. These aren't "conflicts", they're options:
- **Non-gated coverage** (vs a coverage gate) — `handbook/06-engineering-practices.md` §1.3.
- **Direct work on `main`** (vs branch/PR + squash).
- **A single lint+format tool / Biome** (vs already-working ESLint+Prettier).
- **turbo / multi-package cache** — useless if you're a **single app**.
- **The exact set of Gates** — you define them on your project.
- **How you sequence the work**: continuous flow + Board is the default and stands on its own; if you already have a roadmap / milestone / issue tracker / kanban, **you don't have to throw it out** (see *Adopting in an existing project*). The kit assumes neither the presence nor the absence of a plan.

> **In plain language.** The first list is "the skeleton that holds the house up: don't remove it". The second is "the wall color: we prefer this, but if you already like your shade, keep it". When the kit seems to contradict a choice of yours, you're almost always looking at the second list.

---

## How much to adopt — fuller is better

The kit's value is **emergent**: the parts interlock (binding automation + record-by-duration + living state machine + the interview reinforce each other). **Partial adoption gives partial benefit** — a Board without the anti-drift hooks drifts, records written without the interview get written after the fact, a sentinel no one wired never fires. The more of the **invariants** you adopt, and the more coherently, the more the method actually pays off.

This does **not** contradict "don't demolish what works" — it balances it:

- **Keep your *tool*** if it already works (a swappable default: your linter, your git model, your tracker). Adopt the *behavior*, not the tool.
- **Don't keep a *gap*** in the invariants just because change is friction. "We already have something here" justifies a **Skip** only if what's there delivers the *same behavior* — not if it merely occupies the slot.

The keep / replace / graft call, area by area, is led by **your project's own agent** (the *Adoption protocol* below): it has the context of this codebase and this idea, so it weighs each area toward the **fullest coherent adoption** — not toward the lowest-friction path — and brings the *decisions* (not the givens) to the operator. Friction is a cost to weigh, never the default answer.

> **In plain language.** The kit isn't a buffet where you take a little of each — the parts are cooked to go together. Take your own version of a part if it's already good, but don't leave a hole in the meal just because setting the table is a hassle. And it's the agent that knows *your* project that decides, area by area.

---

## Operating profiles: `solo` (default) vs `team`

Almost all operational choices — how you commit, where the state lives, who decides, how enforcement runs — **change together** depending on whether the project is driven by **a single operator** or by **multiple devs on a shared origin**. That's why they aren't separate knobs, but **a single axis with two profiles**:

- **`solo`** *(default)* — one operator, one working tree: direct work on `main`, enforcement with local hooks, Board in a committed file. It's the kit as described in the rest of the documentation.
- **`team`** — multiple devs, each with their own clone; origin is the shared source-of-truth: branch + PR with a protected `main`, **CI as the shared gate**, volatile state on a tracker, **attribution** (who·where·when) on the records, explicit authority (who ratifies an ADR, who merges).

The *core of the method* (record-by-duration, living docs, interview, sentinels) is **identical** in the two profiles — only the operational shell changes. The full table, dimension by dimension, is in [`handbook/09-operating-profiles.md`](handbook/09-operating-profiles.md); the *Adoption protocol* below asks it as the **first** question. In the scaffold the diverging parts are marked `<!-- profile:solo -->` / `<!-- profile:team -->`, and the adoption agent prunes the one not chosen.

---

## Adoption protocol — for the agent adopting the kit

> If you read this as the **target project's Claude Code agent**: the kit is not "just copied". Before writing a single file, run this protocol. You already know this codebase — **use that knowledge**: *infer what is a given, ask only what is a decision.*

**1 · Recon — is there already an operating flow?**
Map what exists *before* proposing anything: charter (`CLAUDE.md`/equivalent), decision log (ADR/RFC/design-doc), tracker or board (Issues/Jira/Linear/kanban), persistent memory, git hooks, CI (which provider — or none?), review skill, secrets management. Often the project **already has half the kit under other names**.

**2 · Classify — for each area choose the adoption mode, and to what degree:**

| Mode | When |
|---|---|
| **Replace** | the area is empty, or what's there is worse → bring the whole kit |
| **Adapt / graft** | there's already something that works → adopt the kit's *behavior*, not the tool; graft only on the gaps |
| **Skip** | the area already delivers the same behavior → leave it (*don't demolish what works* — but "something's here" isn't enough; it must be genuinely equivalent, not just occupying the slot) |

Produce an **explicit map** area→mode and show it to the operator *before* acting. Exception: **secrets-security** always do it — it's additive, zero risk (Phase 0).

**3 · Infer the placeholders — don't ask for them.**
`{{PROJECT}}`, `{{STACK}}`, `{{PKG_MANAGER}}`, `{{DB}}`, `{{PROCESS_MANAGER}}`, `{{DOMAIN_*}}`, `{{REPO_PATH}}` are almost all **deducible from the codebase** (package manifests, config, CI, README). Fill them in yourself; bring the operator only the ambiguous ones, **already with your proposal**.

**4 · Ask the operator ONLY for the decisions — one at a time** (*interview* style, see `handbook/01-operating-model.md`). They are what's not inferable because it's *preference* or *direction* — the right-hand side of *Invariants vs swappable defaults* above. **The first question fixes the others:**
- **Operating topology — `solo` or `team`?** It's the axis that packages git, enforcement and living state into a coherent bundle (see `handbook/09-operating-profiles.md`). `solo` (default) = one operator, direct work, local enforcement; `team` = multiple devs on a shared origin → branch/PR, CI as a *required check*, volatile state on a tracker, attribution on the records. *Choose this first; the three items below follow from it — touch them only to override.*
  - *(derived)* **Git model** — `solo`: direct on `main`. `team`: branch + PR, protected `main`.
  - *(derived)* **Enforcement** — the principle "a machine verifies it" is invariant; the *where*: `solo` local hooks, `team` CI *required check*. On which provider — or none?
  - *(derived)* **Living state** — `solo`: Board in a committed `STATE.md`; `team`: volatile on a tracker (or namespaced per owner), prose-SSOT in the repo.
- **Audience** — the operator is always a **PM-director** (directs and decides; the AI writes the code). If they are also a **PM-dev**, the "plain language" layer becomes optional: ask whether to keep it or omit it.
- **Kit language**, **coverage-gate** yes/no, **set of Gates**, **doc-site** yes/no.
- **Product direction** — the first entry of `DIRECTION.md`. This **only** the operator knows.

**5 · Confirm, then write.** Recap in one shot: adoption map + chosen knobs + inferred placeholders. On approval, run the *Step-by-step bootstrap* below.

**6 · Completeness check — nothing silently dropped.** The kit is broad; the failure mode is adopting the easy 60% and quietly skipping the rest. Before declaring adoption done, walk the **MANIFEST** (§3) and the placeholder table and confirm **every** entry got an *explicit* decision — Replace / Adapt / Skip — each with a one-line reason (a Skip needs the "genuinely-equivalent-behavior" justification from *How much to adopt*, not silence). Report a coverage map (area → decision → reason) to the operator, and make sure `grep -rl '{{' .` comes back empty (no unfilled placeholder). An area you never decided on isn't *skipped* — it's *missed*.

> **In plain language.** The agent does the heavy lifting itself — reads the codebase, fills the technical gaps, proposes what to replace and what to graft — and bothers the operator **only** for the choices that need a human: *how you work as a team, what you want to enforce, and where the product is going.*

---

## 1. "Before acting" reading order (for the agent)

This is the order the new project must declare in its `CLAUDE.md`:

1. `CLAUDE.md` (root) — the charter.
2. `docs/implementation/00-quick-start.md` — the operating model in 60 seconds.
3. `docs/implementation/STATE.md` — the **Board**: current state.
4. `docs/DIRECTION.md` — where the product is going (north-star + pivots).
5. `docs/architecture/README.md` — the technical decisions log (ADR).
6. The nested `CLAUDE.md` of the area you're about to work on.

---

## 2. Step-by-step bootstrap

**Step 1 — Doc-layer `[agnostic]` (applies everywhere).** Copy into the target repo:
`scaffold/CLAUDE.md`, `README.md`, `ONBOARDING.md`, `COMMON-COMMANDS.md` and the whole `scaffold/docs/`.
Then `grep -rl '{{' .` and replace the placeholders. This alone already gives you the record system (ADR/PDR/Board/Journal) working by hand.

**Step 2 — Claude Code harness `[agnostic]`.** Copy `scaffold/.claude/` (settings, skills, `handoff` command, example workflow) and `scaffold/.gitignore` (rules that enforce the settings-split). Rename `settings.local.json.example` → `settings.local.json` (stays gitignored). The memory is **not copied**: it lives outside the repo (see `reference/memory-protocol.md`) and populates itself.

**Step 3 — Automation `[Node-ref]`.** If the project is **Node/pnpm**: copy `scaffold/scripts/`, `biome.json`, `turbo.json`, `.gitleaks.toml`, `.sops.yaml.example`, and merge `package.json.snippet` into your `package.json`. If it's **not** Node: **don't** copy the code — read the behavior spec in the manifest below and re-implement it (e.g. hooks in Python via `pre-commit`, in Go, etc.). What matters is the *behavior* (what it blocks, when), not the language.

**Step 4 — Starlight doc-site `[Node-ref]` (optional).** Copy `scaffold/docs-site/`. It needs a Node toolchain even if the main project isn't Node (it's a standalone app that renders your `docs/`).

**Step 5 — First lap.** Have the agent read the `handbook/`, fill the first entry of `STATE.md`/`DIRECTION.md`, and open the first **Intervention** (see `handbook/01-operating-model.md`).

---

## Adopting in an EXISTING project (not from scratch)

The bootstrap above assumes a near-empty repo. More often you graft it onto a project **that already exists and already works**. In that case you don't "apply the kit from scratch": you do a **gap-analysis** and graft it onto the real gaps.

1. **Map what you already have.** Charter (`CLAUDE.md`)? A decision log? Persistent memory? Git hooks? CI? A review skill? Often you'll find you already have half the kit, under different names.
2. **Almost all of the kit is ADDITIVE.** You graft it where you have a gap; you don't rewrite what works — but "it works" must mean *delivers the invariant's behavior*, not merely *exists*. Lean toward the fullest coherent adoption: partial adoption gives partial benefit (see *How much to adopt — fuller is better*).
3. **Secrets-security first (Phase 0).** Scanner + encryption are pure addition, **zero conflicts, maximum value** — do them regardless of the rest. Run the scanner **once over the whole git history** to check that no secret is *already* committed (that's almost irreversible to remediate).
4. **The operating model grafts by TRANSITION, not demolition.** The Board becomes the living state/focus. If you already have a system that says "what comes next" (roadmap, milestone, issue tracker, kanban), **it stays your backlog source** — you don't delete it. If you have no system, the Board+Backlog is enough on its own. Governance is touchy: it deserves a dedicated session.
5. **The "conflicts" are not "just apply".** coverage / git-model / linter / tooling are the *swappable defaults* (see above): keep yours where it already works, adopt the **behavior** not the tool.

> **In plain language.** On a live project the kit is not "installed": it's **grafted**. First the anti-secrets net (free and risk-free), then the living state machine, and only after — calmly — the operating model, without demolishing what already works for you.

---

## 3. MANIFEST — every file, tag and spec

> `[A]` = `[agnostic]` (copy, replace placeholders) · `[N]` = `[Node-ref]` (drop-in if Node, otherwise port the behavior).

### handbook/ — the method (all `[A]`)
| File | What it contains |
|---|---|
| `00-philosophy.md` | The two axioms; why the direction layer is separate from the technical |
| `01-operating-model.md` | The Intervention (deterministic cycle) + the binary Gates |
| `02-decision-discipline.md` | ADR/mini-ADR/PDR, two logs, section supersede, rejection record, ported-IP |
| `03-ssot-architecture.md` | The "who is SSOT of what" map + reading order + doc hierarchy |
| `04-living-state-machine.md` | Board+Journal+ledger, layered defense, generators, anti-drift audit |
| `05-communication.md` | Double layer tech+"plain language", interview style |
| `06-engineering-practices.md` | Balanced TDD, recon, validate-the-source, selective git, assert-by-observation |
| `07-claude-harness.md` | CLAUDE.md root+nested, memory, skills, commands, settings, workflow, worktree, scheduling, native session hooks |
| `08-quality-automation.md` | 3-level hook timing, cost-increasing CI, gitleaks+sops, guards-are-tested |
| `09-operating-profiles.md` | The two `solo`/`team` profiles: how the topology modulates git, enforcement, state, memory, authority, attribution |

### scaffold/ top-level
| File | Tag | Spec |
|---|---|---|
| `CLAUDE.md` | `[A]` | Charter: identity, reading order, methodology, conventions, index of the nested CLAUDE.md. Declares that it OVERRIDES the harness default |
| `README.md` | `[A]` | Router-SSOT: declares which file is SSOT for each theme + folder map |
| `ONBOARDING.md` | `[A]` | New-member guide + `<!-- INSTRUCTION FOR CLAUDE -->` block for conversational onboarding |
| `COMMON-COMMANDS.md` | `[A]` | Ops handbook: ports/hosts, installed CLIs vs "NOT installed: ask first", quality routine |

### scaffold/.claude/
| File | Tag | Spec |
|---|---|---|
| `settings.json` | `[A]` | Shared **deny-only** security-floor (blocks installs, edits to generated dirs, reads of build artifacts) + **advisory session hooks** (`SessionStart` brief, `Stop` handoff-reminder — handbook/07 §9) |
| `settings.local.json.example` | `[A]` | Personal allow-list (gitignored). Rename without `.example` |
| `.mcp.json.example` | `[A]` | MCP server registration from a local bin |
| `skills/adversarial-reviewer/SKILL.md` | `[A]` | Read-only 5-persona adversarial review; BLOCK/CONCERNS/CLEAN verdict; never commits |
| `skills/finding-triage/SKILL.md` | `[A]` | Counterpart: disciplined finding triage (3 gates + 4 actions); never commits |
| `skills/_TEMPLATE-process/SKILL.md` | `[A]` | Skeleton of a **process** skill |
| `skills/_TEMPLATE-codegen/SKILL.md` | `[A]` | Skeleton of a **codegen** skill |
| `commands/handoff.md` | `[A]` | Session-closing ritual (refresh Board + Journal entry) |
| `workflows/example-audit.js` | `[A]` | Example multi-agent workflow (OPT-IN, expensive). ⚠️ must be EXCLUDED from the linter (top-level `return`) |

### scaffold/ — config & automation
| File | Tag | Behavior spec |
|---|---|---|
| `.gitignore` | `[A]` | Ignores settings.local + .bak + scheduled_tasks.lock + worktrees/ + decrypted secrets; keeps the age test fixture |
| `.gitleaks.toml` | `[A]` | Secret-scan config (tool, language-agnostic): extend-default + commented allowlist |
| `.sops.yaml.example` | `[A]` | Secret encryption rules (sops/age, tool-based): public key committed, private elsewhere |
| `biome.json` | `[N]` | One-tool lint+format; excludes `.claude`. *Behavior*: a single tool for lint+format, format-drift = error in CI |
| `turbo.json` | `[N]` · monorepo-only | **Skip if you're single-app.** Task graph + env-aware cache (multi-package orchestrator); the data-layer files bust the cache; cache only successful tasks |
| `package.json.snippet` | `[N]` | The canonical `scripts` + the `simple-git-hooks` block (pre-commit/post-commit/pre-push) + `prepare`. *Behavior*: each guard is a script invocable identically by hand/hook/CI |
| `.github/workflows/ci.yml` | `[N]` · profile:team | The same sentinels as a **required check** on origin (the shared chokepoint of the `team` profile). Rewrite the steps if you're not Node; the point is "the guards run in CI" |
| `scripts/update-state.mjs` | `[N]` | post-commit: updates in-place the Board's frontmatter (commit/SHA/timestamp) |
| `scripts/check-state-size.mjs` | `[N]` | pre-push: blocks if the Board exceeds the size thresholds (prune, don't accumulate) |
| `scripts/check-coherence.mjs` | `[N]` | cross-doc coherence sentinel: stale-banner, open PDR touch-points, Board staleness, internal `.md` links. warning(0)/error(1) |
| `scripts/hook-session-brief.mjs` | `[N]` | advisory `SessionStart` hook: injects a compact Board brief so a cold chat starts oriented. Fail-open, exits 0 |
| `scripts/hook-handoff-reminder.mjs` | `[N]` | advisory `Stop` hook: reminds to run the handoff when work moved but wasn't saved (Layer 3 made mechanical). Never blocks |
| `scripts/check-harness-refs.mjs` | `[N]` | sentinel: flags dead path references in the `.claude` control files (hooks/commands/skills). warning(0) |
| `scripts/validate-docs.mjs` | `[N]` | "docs-as-data" linter: integrity of the frontmatter graph (refs, dup-id, cycles, enum) |
| `scripts/generate-adr-map.mjs` | `[N]` | generates a committed `.md`: ADR→status matrix. Manual run, not in a hook |
| `scripts/generate-module-map.mjs` | `[N]` | generates a committed `.md`: code geography for a cold agent |
| `scripts/run-gitleaks-precommit.sh` | `[A]` | pre-commit hook (bash): redacted staged scan, actionable message + escape hatch |
| `scripts/load-secrets-sops.mjs` | `[N]` | decrypts the secrets for CI (heredoc); skips `_`-prefixed keys and the envelope |
| `scripts/_guard-template.mjs` | `[N]` | forbidden-pattern guard skeleton (exported pure functions + allowlist) |
| `scripts/tests/_guard-template.test.mjs` | `[N]` | its unit-test (demonstrates "guards-are-tested"). **Green: 10/10** |

### scaffold/docs/ — the living-doc templates (all `[A]`)
| File | Spec |
|---|---|
| `docs/README.md` | docs/ index with per-folder ownership |
| `docs/DIRECTION.md` | Direction layer: north-star + PDR log (parsable header contract) |
| `docs/identity/README.md` | Foundational SSOT (mission/ICP) with re-read cadence + stale-banner |
| `docs/architecture/README.md` | ADR log (status table + evolution notes + in-doc methodology) |
| `docs/architecture/code-conventions.md` | By-feature conventions manual (generic) |
| `docs/architecture/decisions/000-template.md` | Empty ADR skeleton |
| `docs/implementation/README.md` | Reading order + "## Philosophy" block |
| `docs/implementation/00-quick-start.md` | The operating model in 60s |
| `docs/implementation/STATE.md` | Board skeleton (frontmatter + In flight/Next/Gate/Backlog) |
| `docs/implementation/JOURNAL.md` | Append-only Journal skeleton + 1 example entry |
| `docs/implementation/20-discipline/01-tdd-discipline.md` | TDD matrix + assert-by-observation |
| `docs/implementation/20-discipline/02-pre-task-interview.md` | Interview protocol (archetypes + blocks) |
| `docs/implementation/20-discipline/03-handoff-protocol.md` | Layered defense + recovery |
| `docs/implementation/20-discipline/04-mini-adr-template.md` | 3 binary questions + mini-ADR template + promotion |
| `docs/implementation/20-discipline/05-plain-language.md` | Template of the non-technical summary |
| `docs/implementation/30-reference/inline-decisions.md` | Board overflow ledger skeleton |

### scaffold/docs-site/ — Starlight (all `[N]`, optional)
| File | Spec |
|---|---|
| `astro.config.mjs` | Config: sidebar generated by walking `docs/` at build-time (pure renderer, no copy) |
| `src/content.config.ts` | Glob loader over `../../docs/` + collapse `{folder}/README.md` → `/{folder}/` |
| `src/pages/index.astro` | Build-time dashboard that scrapes the state from the markdown corpus |
| `scripts/watch-and-serve.mjs` | Atomic rebuild daemon (chokidar + swap dist) — the "living" part |
| `package.json` | Astro/Starlight/chokidar deps (+ explicit `@astrojs/check` or CI blocks) |
| `CLAUDE.md` | Scope-guide: "it's just a renderer" + the 3 things to touch for a new folder |
| `src/styles/custom.css`, `src/assets/logo-*.svg`, `public/favicon.svg` | Placeholder assets (so `astro build` runs out-of-the-box; replace them) |

### reference/ — pattern catalogs (all `[A]`, to consult)
| File | Spec |
|---|---|
| `pattern-nested-claude-md.md` | The 4 local-scope CLAUDE.md forms + the "changelog" anti-pattern |
| `memory-protocol.md` | Full spec of the memory system (one-fact-per-file + index) |
| `context-engineering.md` | Context rot → fresh-context subagents: division of labor + memory across contexts |
| `pattern-ci.md` | The 3 CI archetypes (full cost-increasing / dispatch cost-gated / deploy path-filtered) |
| `sentinels-and-generators.md` | Guard/generator catalog + warn-vs-block severity + guards-are-tested |
| `audit-drift-template.md` | The periodic anti-drift audit ritual (throwaway folder) |

---

## 4. Quick check (after copying, if Node)

```bash
# valid JSON
for f in .claude/settings.json biome.json turbo.json; do python3 -c "import json;json.load(open('$f'))" && echo "OK $f"; done
# syntactically valid scripts
for f in scripts/*.mjs; do node --check "$f" && echo "OK $f"; done
# the guard exemplar is green
node --test scripts/tests/_guard-template.test.mjs
# (optional) the doc-site builds
cd docs-site && {{PKG_MANAGER}} install && {{PKG_MANAGER}} run build
```

> Note: `node --check scaffold/.claude/workflows/example-audit.js` **fails on purpose** (workflows use top-level `return`): that's the reason `.claude` is excluded from the linter. It's not a bug.

---

## 5. What is NOT in the kit (and why)

- **The memory**: it lives outside the repo, is per-machine and populates itself — see `reference/memory-protocol.md`.
- **Domain content**: everything has been cleaned; the examples are labeled "Example". The method is the product, not the data.
- **Working domain guards** (e.g. specific security checks): there's only the **skeleton** (`_guard-template.mjs`); the real guards you write yourself, on your domain, in the same testable schema.
