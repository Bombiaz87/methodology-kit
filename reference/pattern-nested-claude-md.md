> KIT · [agnostic] — Catalog of nested `CLAUDE.md` shapes (one per area/app/package). Adapt it: pick the right shape per area, fill in the {{...}} placeholders, tie every gotcha to the bug/audit that produced it.

# Pattern: nested `CLAUDE.md` files (local scope)

The root `CLAUDE.md` is the entry point and the global constraints. When an area of the repo has **rules or traps of its own**, you add a *nested* `CLAUDE.md` in its folder. The agent reads it when working there.

**In plain language:** instead of one giant file nobody can keep in their head, every zone of the project has its own instruction sheet next to the code — so the agent sees the right rules without having to remember everything.

The root file lists the nested files with one line each (navigable index):

```markdown
## Nested CLAUDE.md (local scope)
When working on a specific area, also read:
- apps/<app>/CLAUDE.md — <one line>
- packages/<pkg>/CLAUDE.md — <one line>
```

There are **4 recurring shapes**. Pick based on *what* the area is.

---

## Shape 1 — Sensitive area (minimal, high density)

For zones where a mistake is costly (auth, security, data, money). Structure: **header with one-line purpose + dependencies → targeted commands → list of gotcha-invariants, each tied to the originating bug/audit → pointer to the review skill**.

The golden rule: **every gotcha cites its source** (audit, session, mini-decision). A trap with no provenance gets deleted soon by whoever "cleans up."

```markdown
# `packages/<auth>/` — authentication + permissions + rate-limit

Self-hosted auth setup for {{PROJECT}}. Decision 005. Depends on `<db>` (schema) + `<notifications>` (password-reset email via job).

## Targeted commands
\`\`\`bash
{{PKG_MANAGER}} --filter <auth> test
{{PKG_MANAGER}} --filter <auth> check
\`\`\`

## ⚠️ Gotchas (sensitive area — read before touching)
- **Auth tables exempt from the domain guard** (decision 005): login must run BEFORE the context is set → security enforced at the application level (token signing + hashing, password min 12). Don't add the guard to these tables.
- **Generated schema, not hand-written**: produced by the provider's CLI and committed verbatim. To change it, regenerate — don't hand-edit.
- **Sanitize redirects**: `next.startsWith('/')` alone is NOT enough (`//evil.com`, `/\evil.com` are cross-origin). [Example domain guard: a `safeNextPath()` helper.] This was the open-redirect hole closed by the YYYY-MM-DD audit.
- **Rate-limit covers the right path**: the native limiter only acts on the HTTP handler, not on direct server-action calls (the real login path). It's in-memory per-process (resets on restart); multi-replica would need a shared store. Adversarial audit YYYY-MM-DD.

> This area is in scope for the adversarial review skill — propose it at the end of a non-trivial task, before the commit.
```

Note: the domain guards here (data-filter exemptions, redirect sanitization) are **examples**, not code to copy blindly; they illustrate *what* to document, not *how* to implement it in your stack.

---

## Shape 2 — App (header+banner, stack, route map, rules, env, gotchas, relations+decision IDs)

For an end-to-end application. Broader than Shape 1. Structure: **header with warning banner → Stack → ASCII route map → rules/multi-scope → Env glossary → gotchas → relations with decision IDs**.

```markdown
# `apps/<portal>/` — <short description>

> Served on {{DOMAIN_PROD}} (dev: {{DOMAIN_DEV}}). ⚠️ Don't confuse it with `<other-app>`: distinct dev subdomains (see the memory on the URL distinction).

<Framework> N. What the app does in one sentence. Decision 008 (feature A), 009 (feature B).

## Stack
- **<Framework>** + i18n (default IT, EN scaffold intentionally empty — see decision 016).
- **Auth**: via `<auth>` (session cookie).
- **DB**: via `<db>`. Every read/write goes through the project's **scope helper** (the DB guard is a backstop).
- **UI**: `<ui>` design system.

## Route structure
\`\`\`
src/app/
├── (app)/            authenticated area
│   ├── page.tsx      dashboard
│   └── <feature>/    editor
├── (auth)/           login · reset (PUBLIC)
└── api/
    ├── auth/         auth handler
    └── webhooks/     POST (signature verified BEFORE parsing)
\`\`\`
**Middleware**: auth/public routes bypass the session; `/api/*` full bypass; everything else requires a session → redirect `/login?next=…`.

## Multi-scope / authorization
- A `requireSession()` helper is the authority: reads the session → scope identity. **Server actions never take a scope id as input** — the session decides.

## Env
- `<VAR>` — what it's for (default …; points to … in dev).

## Gotchas / conventions
- **Lazy-seed**: the row doesn't exist on first access → it's created on-demand from the last valid state. No state → empty state.
- **"Modified" state is COMPUTED**: not a monotonic flag — it's the draft-vs-published diff (pure SSOT, reused in several places). Best-effort try/catch: an unparsable input doesn't take down the save.
- **Serial tests**: DB-integration tests TRUNCATE each other (see the memory on serial tests).

## Relations
Depends on `<auth>`, `<db>`, `<i18n>`, `<ui>`; enqueues to `<worker>`. Decisions: 005, 008, 009, 012, 016.
```

---

## Shape 3 — Package (targeted commands, write-locked dirs + safe-change procedure, invariant, layout, seed)

For an internal library reused by multiple apps. Structure: **targeted commands → any write-locked dirs with the safe-change procedure → critical invariant → schema/layout → seed**.

```markdown
# `packages/<db>/` — ORM + multi-scope guard

Canonical DB schema for {{PROJECT}}. Decision 003 (multi-scope model day 1).

## Targeted commands
\`\`\`bash
{{PKG_MANAGER}} --filter <db> test
{{PKG_MANAGER}} --filter <db> db:generate   # generate migration from schema diff
{{PKG_MANAGER}} --filter <db> db:migrate    # apply migrations (forward-only)
\`\`\`

## ⚠️ Write-locked migrations
The migration folder is locked in `.claude/settings.local.json` (`permissions.deny`). For schema changes:
1. Edit `src/schema/*`
2. `db:generate` (generates the file)
3. Review the generated SQL
4. `db:migrate`
Never hand-edit the auto-generated files. Forward-only: for breaking changes → expand-contract.

> ⚠️ Real path vs path in the deny list: verify the blocked path actually exists (a deny on a non-existent path protects nothing). Custom GRANTs are written by hand (established pattern); it's the auto-generated diff that's off-limits.

### ⚠️ Gotcha: DB commands don't auto-load the env
The DB variable needs to be in the environment. Correct command:
\`\`\`bash
NODE_OPTIONS="--import {{REPO_PATH}}/scripts/load-env.mjs" {{PKG_MANAGER}} --filter <db> db:migrate
\`\`\`

## Critical invariant — multi-scope guard
- Every scoped table has the scope column + guard policy
- Read path: ALWAYS via the project's **scope helper** — NO direct queries on the raw connection
- ⚠️ Default connection = full privileges (bypasses the guard!) — it's opt-in enforcement, the DB guard is a backstop, not the only defense

## Schema layout (`src/schema/`)
- Key tables + which decision they belong to

## Seed scripts
- `seed-<x>.ts` — initial bootstrap. Run: `{{PKG_MANAGER}} --filter <db> seed:<x>`
```

---

## Shape 4 — Runtime different from its siblings ("NOT the default framework")

When an area runs on a runtime different from the rest of the repo. **Opens by stating what it's NOT**, then lists what's ABSENT compared to its siblings. Keeps the agent from applying the majority runtime's tools out of habit.

```markdown
# `apps/<edge-worker>/` — <edge runtime> (NOT <default framework>)

What it does in one sentence. Decision 010.

## Runtime: <edge runtime>, not <default runtime>
Unlike its siblings `<worker-a>`/`<worker-b>`, here:
- No {{PROCESS_MANAGER}}, no long-running server — deploy via `<edge CLI>`
- No DB client (only KV/blob + fetch)
- Tests run inside the edge runtime's local emulator

## Targeted commands
\`\`\`bash
{{PKG_MANAGER}} --filter <edge-worker> test
{{PKG_MANAGER}} --filter <edge-worker> dev      # local emulator / cloud bindings
{{PKG_MANAGER}} --filter <edge-worker> deploy
\`\`\`

## ⚠️ Known bug: the emulator breaks on <operation>
The emulator's test pool breaks on <op> (known upstream issue). Workaround: mock the logic, emulator only for the request flow. Update once upstream ships the fix.
```

---

## Anti-pattern: the `CLAUDE.md` that turns into a changelog

A nested `CLAUDE.md` documents **current state and rules**, not history. Signs of decay:

- entries like "on 03/12 we changed X, then on 03/14 …" → history lives in the git log and the JOURNAL, not here
- accumulation of gotchas that are **already resolved** and nobody removes → the agent reads traps that no longer exist
- rules with no source → indistinguishable from folklore, get ignored or deleted at random

**Discipline:** once a gotcha is no longer true, **delete it** (don't strike it through). Keep only *live* invariants and traps, each with its source (audit/session/mini-decision). A date reference exists to prove *why* the rule exists, not to narrate the file's evolution.

**In plain language:** these files should say "how things stand now and where the mines are." They're not a diary. If a mine has been defused, take down the flag.

---

## Anti-pattern: the `CLAUDE.md` lint-rule list (enforcement that should be a hook)

Mirror image of the changelog: a `CLAUDE.md` that accumulates rules **a machine could verify** ("run the formatter before committing," "no unused imports," "files must have header X"). Signs:

- format/naming/structure rules a linter could enforce on its own
- "remember to run Y before Z" → that's a pre-commit/pre-push hook, not a reminder
- the list grows with every incident, and nobody re-reads it

**Discipline (Axiom 1 — automation > voluntary discipline):** if a rule is enforcement, **move it to a hook/sentinel/CI** and take it out of the charter. What stays in `CLAUDE.md` is only what's **behavioral and non-inferable from the code** (e.g. "don't be a yes-man," "no `localhost` for the operator," "selective staging"). Operational distinction: *can a machine verify it?* → hook. *Does it require judgment or knowledge of a constraint external to the code?* → charter.

**In plain language:** don't write a rule in the manual that an automatic check can enforce on its own — the manual forgets, the hook doesn't. The charter is for things only a human (or the agent) can remember to do.

---

## Cross-link

- The gotchas here often point to memory entries → see [memory-protocol.md](./memory-protocol.md).
- The adversarial review skill mentioned in Shape 1 → see `../handbook/07-claude-harness.md`.
- The numbered decisions (003/005/008…) are ADRs → see `../scaffold/docs/architecture/decisions/000-template.md`.
