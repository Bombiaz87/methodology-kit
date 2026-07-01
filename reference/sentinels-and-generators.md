> KIT · [Node-ref] — catalog of sentinel/guard and doc-generator patterns. Node/{{PKG_MANAGER}} examples; the method is universal.

# Sentinels and generators

Two families of automation scripts that keep the repo coherent without human intervention:
- **Sentinels (guards)**: *check* an invariant and complain if it's violated.
- **Generators**: *produce* documentation derived from the code (maps, indexes).

In plain language: sentinels are alarms that go off if you break a rule; generators are scripts that rewrite certain documents on their own starting from the code, so they don't go stale.

---

## 1. Severity: warning vs blocking

Every sentinel deliberately picks one of the two severities.

| Severity | Exit code | Effect | When |
|----------|-----------|---------|------|
| **Warning** | `exit 0` (or `\|\| true` in the hook) | prints, does NOT block | discipline reminder, "soft" drift (e.g. unfinished propagation) |
| **Blocking** | `exit 1` | blocks push/CI | structural invariant (broken reference, forbidden pattern, incoherent state) |

The same sentinel can do **both**: warning on reminders, exit 1 only on structural incoherence.

Example of dual-severity logic (generalized excerpt from a "direction layer" sentinel):
- `WARNING` → a pivot in "decided"/"propagating" state still has open touch-points (reminding you to propagate, but not blocking you);
- `ERROR` (exit 1) → a pivot marked "propagated" still has open boxes, or a banner cites a pivot that doesn't exist (structural incoherence).

In plain language: there's a difference between "I'm reminding you of something unfinished" (warning, doesn't stop anything) and "this is actually broken" (error, stops the push). Use blocking only when things are truly incoherent, not for leftover to-dos — otherwise people learn to ignore the alarm.

> ⚠️ **The risk of warning-only** is the heart of `audit-drift-template.md`: if the sentinel is warning-only and the handoff discipline is skipped, drift accumulates invisibly. Warning is the correct design choice (don't block the work), but it must be balanced by a periodic audit.

---

## 2. Pattern "guard = forbidden-pattern with exported allowlist"

A **code** guard typically looks for a forbidden pattern and makes an exception for an explicit list.

Structure:
1. Scan the sources for a forbidden pattern (e.g. a dangerous call made by hand instead of through the safe helper).
2. Keep an **exported allowlist** (a named array, exported from the module) of files/lines legitimately exempt.
3. Fail (exit 1) if it finds the pattern outside the allowlist.

Why the allowlist must be **exported** and not inline: so the guard's test can import it and verify it (see §3), and the list of exceptions becomes itself a reviewable document.

> Domain note (do NOT ship as kit code): real examples of domain guards are "direct DB access outside the security-scoped helper is forbidden" and "hand-built post-login redirects are forbidden (open-redirect risk)." These are **examples of domain guards**: the *pattern* (forbidden + allowlist + test) is portable, the *specific rule* depends on your project.

In plain language: a guard is "this isn't allowed, except in these files listed on purpose." The list of exceptions is written in plain sight and versioned, so you can immediately see who has special permission.

---

## 3. "Guards-are-tested": sentinels have their own tests

A guard is code that protects an invariant: if the guard has a bug, the invariant isn't protected and you don't notice. So **guards get tested**.

Recipe:
- Extract the guard's logic into **pure functions** (input: text/path → output: list of violations). No I/O inside the matching function.
- Test with the native runner (e.g. `node:test`) + **fixtures**: strings that MUST match and strings that must NOT (including allowlist entries).
- Verify the exported allowlist is coherent (every entry actually exists, no dead entries).

See the skeleton in `../scaffold/scripts/_guard-template.mjs` and its test `../scaffold/scripts/tests/_guard-template.test.mjs`.

In plain language: who checks the checkers? A guard that doesn't work is worse than no guard (it gives you false security). That's why guards have their own tests, with examples that must pass and examples that must fail.

---

## 4. Generators: documentation auto-produced from the code

A generator reads the code (e.g. the monorepo's `package.json` files, the ADR files) and **emits a committed `.md`** that stays in sync.

Behavior rules (generalized from a real "module map" generator):

**a) Auto-generated header at the top of the output**
```markdown
> **Auto-generated** by `scripts/<generator>.mjs` (`{{PKG_MANAGER}} <command>`). Do not edit by hand.

_Idempotent: no timestamp → clean `git status` after regeneration = in sync with the code._
```
Whoever opens the file immediately understands it's not hand-edited. (NB: no `Generated on: <timestamp>` — see rule **d**: the timestamp would break idempotency.)

**b) The produced `.md` is committed**
It's not an ephemeral artifact: it lives in the repo as first-read orientation (for a human or for the next agent landing cold). Example: a "who lives where" table per module (responsibility, entry file, weight in n. of sources, local context, governing decisions).

**c) MANUAL run, NOT in a hook**
Generators are run by hand (`{{PKG_MANAGER}} gen-...`) when the structure changes (rare: a package gets added/removed, an ADR closes), not on every commit. Putting them in a post-commit hook would slow down every commit for data that rarely changes.

> Trade-off: manual run = less noise, but it **can be skipped** if discipline slips. It's exactly one of the drifts the periodic audit recaptures (e.g. "the map says 7 apps but there are 10"). See `audit-drift-template.md`.

**d) A PURE, DETERMINISTIC function of the source** (this is what makes `git status` a free drift detector)
A generated *and committed* artifact must depend ONLY on the source, never on the moment or filesystem order:
- **no non-deterministic timestamp** in the output (no `Date.now()` / `new Date()`): the "when" lives in the git log. Same discipline the kit bans in workflows, extended to generators.
- **sort the entries** with a stable name-based tiebreak → output independent of `readdir` order.
- **exclude generated files from the formatter/linter** (Biome's `files.includes`, `.prettierignore`): if a file goes through both the generator and the formatter, the two rewrite it differently and it diverges on the next re-run.

Result: regenerate → if `git status` is clean, the maps are in sync with the code. It's the most useful diagnostic invariant, and you lose it the moment you introduce a timestamp or let the formatter rewrite the file.

In plain language: instead of hand-maintaining a "what lives where" index (which goes stale immediately), a script rewrites it from the code. You run it when you change the structure. The risk is forgetting to — which is why the periodic audit regenerates it.

---

## 5. Golden rule: same script, single source of truth for the rule, in both hook AND CI

A rule (guard) must have **one single implementation**, called from **both** enforcement points:
- **pre-commit / pre-push hook** (local): immediate feedback to {{OPERATOR}}/Claude before the push.
- **CI** (remote): the safety net nobody can bypass with `--no-verify`.

The same `scripts/<guard>.mjs` is the **single source of truth for the rule**: the hook calls it, CI calls it. Never duplicate the logic (a grep in the hook + a different check in CI → they diverge and lie).

In plain language: the rule is written once. You check it both on your machine before pushing (to catch it right away) and on the server (because someone can skip the local check). Two copies of the same rule end up not saying the same thing — keep one source.

---

## Quick map of the example scripts in the scaffold

| Script | Type | Severity | Run |
|--------|------|----------|-----|
| `check-coherence.mjs` | sentinel (direction superset: +broken links, dangling ADR/PDR refs, `[TO-CLARIFY]` markers, Board staleness) | warning + blocking | hook (warning) + manual |
| `check-state-size.mjs` | sentinel | blocking | hook |
| `check-harness-refs.mjs` | sentinel (dead path refs in `.claude` control files: settings hooks + commands + skills) | warning | hook (warning) + manual |
| `validate-docs.mjs` | sentinel | blocking | hook + CI |
| `_guard-template.mjs` | guard (template) | blocking | hook + CI |
| `generate-adr-map.mjs` | generator | — | manual |
| `generate-module-map.mjs` | generator | — | manual |

See also: `pattern-ci.md` (where the guards run in CI) and `../scaffold/.claude/commands/handoff.md` (the ritual that regenerates the maps).
