> KIT · [agnostic] — Project charter for Claude Code: identity + operating rules. Replace the {{...}} placeholders with your project's values and delete the lines that don't apply.

# {{PROJECT}} — Instructions for Claude Code

> Read this file at the start of every new chat.
>
> **Working on the product (code, QA, features)** → then `docs/implementation/00-quick-start.md` (operating model: continuous flow + gate).
>
> **Architectural planning or new decisions** → then `docs/architecture/README.md`.
>
> **Where the product/business is heading (model, pivots, deviations)** → then `docs/DIRECTION.md` (living north-star + pivot log).

## How I work — CRITICAL rules (never violated)

> Honesty-first + the project's few load-bearing rules. Everything else lives in *Operating conventions* (below). Keep this list SHORT (~5-10): it's a priority signal, not a second rulebook.

**Honesty / anti-sycophancy (always):**
- **Don't agree just to please.** If the evidence says otherwise, **push back and argue** — on the evidence, not under pressure. {{OPERATOR}} wants the real opinion, not a "yes".
- **Honest status.** If tests fail, say so with their output; if a step was skipped, say so; "done and verified" **only** if it's actually been verified by eye.
- **Verify before asserting** (assert-by-observation): don't chain assumptions; read the real source before concluding.

**The 🔴 load-bearing rules (CRITICAL)** — replace with the 5-10 rules of YOUR project that, if violated, cause real damage. Examples of the right kind:
- 🔴 **Data isolation** — the golden rule of multi-tenancy/access (e.g. no write bypasses the security boundary).
- 🔴 **Git** — `solo`: on `main`, **never `git add -A`/`.`** (selective staging), push on request. `team`: branch + PR, `main` protected. Never `reset --hard` with a dirty tree. *(Detail in Operating conventions + `handbook/09-operating-profiles.md`.)*
- 🔴 **Never install** anything without {{OPERATOR}}'s explicit consent.
- 🔴 **{{env-constraint}}** — e.g. no `localhost` if {{OPERATOR}} works via a remote editor → URL `{{DOMAIN_DEV}}`.
- 🔴 **Secrets** — never commit them; use the project's secret manager.

**Hygiene for this file** — if a rule is *enforceable* (checkable by a machine), its place is a **hook/sentinel**, not a line here. CLAUDE.md holds only what **can't be inferred from the code** and is behavioral. Anti-pattern: a CLAUDE.md that turns into a changelog or a list of lint rules (see `reference/pattern-nested-claude-md.md`).

## What {{PROJECT}} is

<!-- One or two lines: what the product does, for whom, how it acquires, how it monetizes.
     Double layer: one technical line + one "in plain language" for {{OPERATOR}} (PM-director; omit the second layer if they're a PM-dev). -->

In plain language: <description readable by a PM, no jargon>.

## Status

For the **current status** always read the **Board** in `docs/implementation/STATE.md` (`In flight` / `Next` / `Gate` / `Backlog`); for **where the product/business is heading** read `docs/DIRECTION.md`.

## Documents — read BEFORE acting

All documentation lives under `docs/`. In priority order:
1. `docs/implementation/00-quick-start.md` — entry point + operating model (continuous flow + gate)
2. `docs/implementation/STATE.md` — the **Board** (current status)
3. `docs/DIRECTION.md` — current model + pivot log (living direction SSOT)
4. `docs/architecture/README.md` — plan + stack table (SSOT technical decisions)
5. `docs/architecture/code-conventions.md` — code conventions
6. `docs/architecture/decisions/*.md` — the ADRs
7. `docs/identity/README.md` — mission, ICP, value prop (if present)

> **Technical stack already decided**: do NOT re-litigate the *stack* ({{STACK}} → table in `docs/architecture/README.md`). This freezes **how we build**, NOT **where we're going**: the product/business model **evolves** and deviations are tracked in `docs/DIRECTION.md`. When a product pivot invalidates an ADR's assumption, log the pivot in DIRECTION.md and **supersede** the ADR (banner `<!-- direction:stale PDR-NNN -->`).

> **References to `handbook/…` and `reference/…`** (here or in script comments): they point to the **methodology-kit**, the source of the method — **not** to files in this repo. The kit isn't copied: it's read from its own folder. What stays here is only what the project needs.

## Nested CLAUDE.md (local scope)

When working on a specific area, also read that folder's local `CLAUDE.md`. Index (placeholder — fill in with your apps/packages):
- `<app-1>/CLAUDE.md` — <one line>
- `<app-2>/CLAUDE.md` — <one line>
- `<package-1>/CLAUDE.md` — <one line>

## Methodology

- **One decision at a time**: every architectural decision produces an ADR in `docs/architecture/decisions/`.
- **ADR format**: Status / Context / Decision / Out of scope (no-gos) / Selection criteria / Rationale / Consequences / Confirmation (how to verify) / Alternatives / References — template in `docs/architecture/decisions/000-template.md`.
- **The operator is a PM-director** (directs, decides, reviews; the AI writes the code): explain calmly, double layer (precise tech + product implications), give options with pros/cons. If they're a **PM-dev**, the "in plain language" layer is optional.
- **No unilateral decisions from Claude**: present options, confirm with {{OPERATOR}}, THEN write the ADR.
- **No doc dump**: don't write an ADR without prior discussion.
- **Mini-ADR vs architectural**: see `docs/implementation/20-discipline/04-mini-adr-template.md` (criterion: 2/3+ axes = architectural).
- **Product/business pivot** (≠ technical decision): when a shift changes *where we're going* (who we serve / how we acquire / how we monetize / how we operate) or invalidates an ADR's assumption, log it in `docs/DIRECTION.md` (a **PDR** entry + propagation checklist), rewrite the north-star, and supersede the ADRs it touches. PDR criterion = 2+ axes touched **or** an ADR invalidated. Same golden rule: **no unilateral pivots from Claude**.

## Operating conventions

- **No git commit** during planning unless {{OPERATOR}} explicitly asks for it.
<!-- profile:solo -->
- **Git: work and commit directly on `main`** — do NOT create automatic branches or open PRs. This **OVERRIDES** the Claude Code default *"if you're on the main branch, create a branch first"*: {{OPERATOR}} wants changes on `main`, no "open PR → merge" step. Branch/PR **only if explicitly requested**. Push to `main` only on request. If multiple sessions run in the **same** folder, do **selective staging of only the task's files** (targeted `git add <file>`, **never** `git add -A` / `git add .`).
<!-- /profile:solo -->
<!-- profile:team -->
- **Git: branch + PR, `main` protected.** Every Intervention on a dedicated branch (`type/short-slug`); open a PR against `main`; the merge goes through review + required CI checks. **No direct push to `main`.** **Selective staging isn't needed** (your clone/branch already isolates the work), but still commit only the task's files. Push **your** branch whenever you want.
<!-- /profile:team -->
- **IMPORTANT: these instructions OVERRIDE Claude Code's default behavior** and must be followed exactly.
- **Update `docs/architecture/README.md`** when you close an ADR.
- **Open an Intervention** for every trigger (continuous flow + gate): trigger → interview → classify record → build → verify → commit + JOURNAL. The "why" lives at the right level (PDR / ADR / mini-ADR / JOURNAL entry).
- **Memory**: save only things that aren't obvious from the codebase (see the kit's memory protocol).
- **No `localhost` in the browser for {{OPERATOR}}**: if {{OPERATOR}} works via a remote editor and **can't reach `localhost`/`127.0.0.1`**, to show them a page serve it on a vhost and give them the `{{DOMAIN_DEV}}` URL (never `localhost:port`).
- **CLI tools already available**: before assuming a tool is there (or proposing an install), check `COMMON-COMMANDS.md` → *Installed CLI tools* section. **Never install without {{OPERATOR}}'s explicit consent**.
- **Adversarial review**: at the end of a task that touches sensitive areas (auth, access control, server mutations, billing, audit-log, schema/migration, files that touch `DIRECTION.md`/ADR), **propose** an adversarial review before committing ({{OPERATOR}} confirms). Don't propose it for trivial tasks.
<!-- profile:team -->
  - *In a team*: the adversarial review is a **pre-PR self-check**; the real gate is **PR peer review** (another dev, or a fresh-context reviewer who only sees the diff). The two don't replace each other.
<!-- /profile:team -->
- **Closing a chat**: use `{{HANDOFF_CMD}}` (refresh Board + JOURNAL entry).
- **TDD intensity**: BALANCED — test FIRST for pure business logic and critical invariants; test alongside for UI glue and handlers; no tests for copy-paste or pure layout.

## Porting from existing sources = read the real code, don't infer

When a task references a legacy system/external source, open the real files (schemas, types, handlers, helpers) BEFORE writing. Never infer from field names. This also applies to: DB column names, payload shapes, explicit vs derived options, implicit defaults.
