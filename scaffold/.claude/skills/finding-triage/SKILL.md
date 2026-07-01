---
name: finding-triage
description: Disciplined triage + remediation of a list of findings (from adversarial-reviewer, /code-review, /security-review, or manual). It's the reviewer's "defensive" counterpart (which is read-only and just-finds): here every finding gets JUDGED (3 gates — is it valid? does the fix introduce new bugs? is it only fixable later?) and ACTED ON (fix-now / fix-now-with-activation-dependency / todo-later / accept-with-rationale), one source at a time, with operator checkpoints and re-verification after each fix. Does not commit. Output in English: a remediation ledger. Suggest it after an adversarial-reviewer run with many findings, or on request ("triage these", "let's tackle them one at a time").
---

> KIT · [agnostic] — Defensive skill: judges and resolves the reviewer's findings with discipline (3 gates + 4 actions), one source at a time, no-commit. Adapt it by linking your project's "home for deferrals" (your state machine/Board) and your verification commands.

# Skill: finding-triage

> This is the missing piece between **finding** problems and **solving** them: `adversarial-reviewer` plays prosecutor (finds, read-only); `/code-review --fix` and `/simplify` *apply* fixes mechanically (with no judgment filter); in between you need disciplined **defense+judge+execution**. This skill is that. Output in English, double layer ({{OPERATOR}} is a PM-director; "plain language" optional if they're a PM-dev).

## When to use me

- **Auto-suggest** right after an `adversarial-reviewer` (or `/code-review`/`/security-review`) run that produced **more than 1-2 findings**: "want me to triage them one at a time?".
- On manual invocation: "triage these findings", "let's tackle them one by one", "let's assess before fixing".
- When there's a risk of **reflexively fixing everything** (the `--fix` trap) or, the opposite, **accepting everything out of laziness** (an accommodating review).

## Do NOT use me if

- There's **a single trivial finding** → just fix it, no ceremony needed.
- You don't have the findings yet → run the reviewer first (`adversarial-reviewer`) or `/code-review`.
- **It does not replace** the reviewer (finding) or `/code-review`/`/security-review`. It **completes** them: they find, I decide+act.
- **It does not commit, does not stage, does not `git add`** ({{OPERATOR}} does selective staging, possible multi-session work). I leave the tree ready, they commit when they ask.

## The problem it solves

Faced with 10+ findings, two opposite failure modes: (a) **fixing everything** — even where the remedy introduces more risk than the problem, or where it's over-engineering; (b) **accepting everything** with a "we'll see later" that never comes back. This skill forces, for **every** finding, a **motivated** and **tracked** decision, and keeps {{OPERATOR}} in the loop on the choices that are theirs.

## Procedure

### Step 1 — Collect and group the findings

Take the list (from the reviewer's output, from `/code-review`, or dictated by {{OPERATOR}}). **Group by source** (e.g. by reviewer persona): work **one group at a time**.

> **Cross-source dedup ONCE.** If the same finding appears under 2+ personas/sources, handle it **only once** (in the first group it appears in) and mark it **resolved for the others too** — don't re-litigate it. Note "also closes finding X from Persona Y".

### Step 2 — For each finding, the 3 gates

Apply in order, and **verify against the real code** before deciding (don't trust the finding's framing — it often needs narrowing or refuting by reading the source):

1. **Is it valid?** Is it a real problem or a false positive / already mitigated elsewhere? *Example: an "orphaned state on failure" finding narrowed down after reading the code — the flagged branch was in fact unreachable due to a pre-check; only a transient error remained.*
2. **Does the fix introduce new bugs / regressions?** Weigh the **remedy's risk** against the problem. If the remedy is more dangerous than the defect, **don't fix it** (defer/accept). *Example: an "atomic" refactor touching an already-tested path to fix a benign defect → defer.*
3. **Only fixable later?** Depends on infra/other work not ready yet → **todo-later**.

### Step 3 — Choose the action (4-way taxonomy)

- **fix-now** → apply + **re-verify immediately** (lint/check + targeted tests) BEFORE moving to the next finding/group. Verification is part of the fix, not an optional final step.
- **fix-now-with-activation-dependency** → the code is fixed but only becomes **effective** with an ops step (env / seed / key). Fix it **and log the dependency** in the ledger + in the project's home for deferrals. *Example: a bot-gate active only with env keys in prod.*
- **todo-later** → route to the **project's home for deferrals** (your state machine/Board or a tracked task) **with a reference to the origin** (e.g. "Persona 1, finding 1.1"). NEVER a bare `// TODO` in the code.
- **accept** → **explain** why the remedy isn't worth it (risk/value, over-engineering, churn on a tested path). Accepting ≠ ignoring: the rationale goes in the ledger (and, if useful, a one-line comment in the code).

### Step 4 — Methodology gate

Some findings do NOT get "fixed" inline:

- **Product/strategy decisions or choices with real trade-offs** → **interview** {{OPERATOR}} with `AskUserQuestion`: first a **recap of the PROBLEM in plain language** (no options in the dark), THEN the options with **pros/cons** and double layer, **recommended listed first**. Verify a vendor's features for the plan actually active before proposing them.
- **Docs / decision record / pivot** (e.g. a shift that lives only in the code) → **do NOT write unilaterally**. Preliminary discussion → {{OPERATOR}}'s confirmation → THEN write. Track it as a **closing doc-step**.

### Step 5 — Checkpoint with the operator at the end of each group

Present the group's outcome (what was fixed/deferred/accepted + verification) and **confirm before moving on** to the next group. For trivial items (accepted NOTEs), just state it; for non-trivial fixes, show green verification.

### Step 6 — Final ledger + verdict

At the end of the round, consolidate (see Output format) and state whether the remediation shifted the reviewer's verdict (e.g. **CONCERNS → CLEAN**, net of docs/todos).

## Prerequisites

The project's verification commands (e.g. `{{PKG_MANAGER}} lint:fix && {{PKG_MANAGER}} check && {{PKG_MANAGER}} test`) are the **yardstick**, not a substitute for judgment — but here they apply **after every fix** (targeted: the touched package/file), not just at the end. If parallel tests give false reds (e.g. DB integration tests stepping on each other), use serial execution for the regression. Lint only the **touched files**, never the whole repo (possible multi-session work). Smoke/E2E on the project's dev domains ({{DOMAIN_DEV}}), never localhost if {{OPERATOR}} can't reach it from the browser.

## Output format

For **each group** (as you work it) + a **final ledger**. Double layer mandatory: technical (`file:line`, real names) + **In plain language** (metaphors anchored to the technical referent inline, like the reviewer).

```markdown
## Triage — Persona/Source N: <name>
- **<finding>** [SEVERITY] → **Valid?** yes/no(why) · **Fix→bug?** <remedy risk> · **When?** now/later
  → **ACTION:** fix-now | fix+dependency | todo-later(#ref) | accept(rationale)
  → (verification: <command> green) | (also closes <finding from another persona>)

### Final ledger
- ✅ Fixed (verified): <…>
- 🕓 Todo-later (tracked): <#ref — origin>
- 👍 Accepted (rationale): <…>
- 🔑 Activation dependencies: <env/seed/ops to do before go-live>
- Post-remediation verdict: BLOCK→? / CONCERNS→CLEAN / …
```

## Anti-patterns (what is NOT useful triage)

| Anti-pattern | Why it's wrong |
|---|---|
| Fixing every finding in a row | That's `--fix`, not triage. The value here is **deciding** what NOT to fix. |
| Accepting everything ("we'll see later") | An accommodating review. Every accept needs a **rationale**; every deferral needs **tracking**. |
| Remedy riskier than the problem | A fix that touches a tested path for a benign defect → defer, don't fix. |
| Bare `// TODO` in the code | The deferral belongs in the project's home for deferrals, with its origin. |
| Options without a problem recap | {{OPERATOR}} wants to understand the problem clearly first, THEN choose. |
| Writing decision/pivot records unilaterally | Discuss → confirm → then write. |
| Skipping re-verification after a fix | The fix isn't "done" until targeted lint/check/tests are green. |
| Trusting the finding's framing | Verify in the code: the severity often needs narrowing (or refuting). |

## References

- Twin skill (finds): `adversarial-reviewer` (read-only, 5 personas, BLOCK/CONCERNS/CLEAN verdict).
- Built-ins that *apply* (don't judge): `/code-review --fix`, `/simplify`.
- `CLAUDE.md` (root) — no-unilateral-commit, selective staging, double layer, gate for decision records.
- The project's home for deferrals: the living state machine (Board/STATE) + any deferred-inbox.
