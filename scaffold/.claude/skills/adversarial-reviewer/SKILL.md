---
name: adversarial-reviewer
description: Adversarial code review with five hostile personas (The Saboteur, The New Junior, The Security Auditor, The Direction Inquisitor, The Cutter). Suggest it at the end of a task that touches sensitive areas (auth, data access/isolation, server actions / route handlers, payments, audit log, schema/migration, files that touch the direction SSOT or an architecture decision), before committing non-trivial code, after a long session, or when a previous review was too accommodating ("LGTM" on non-trivial code). Output in English with verdict BLOCK/CONCERNS/CLEAN. Complements /code-review and /security-review, does not replace them.
---

> KIT · [agnostic] — Read-only, multi-persona, no-commit adversarial review skill. Adapt it by filling in your project's sensitive areas (see placeholders below) and linking your conventions/decisions/direction SSOT. {{OPERATOR}} = the PM-director operator (decides; the AI writes the code).

# Skill: adversarial-reviewer

> **Read-only** adversarial review skill: it takes on five hostile personas with different priorities to force a **perspective shift**. It does not commit, does not stage. The sensitive areas and references are **to be adapted** to your project: wherever you see `{{...}}` or "example of a domain guard," replace it with your own (or remove it).

## When to use me

- **Auto-suggest at the end of a task** (you propose, {{OPERATOR}} confirms) **only if** the task touched sensitive areas. Typical sensitive areas (adapt to your list): authentication/session · access control/data isolation · server actions or route handlers · payments/billing · audit log · DB schema/migration · files that touch the direction SSOT or an architecture decision.
- On manual invocation ("review this" / "find the problems"), always — even outside sensitive areas.
- After a **long** coding session (fatigue creates blind spots).
- When a previous review was too accommodating ("LGTM" on non-trivial code).

## Do NOT use me if

- It **does not replace** typecheck / lint / unit tests — they are **prerequisites**, not alternatives. Run them first (e.g. `{{PKG_MANAGER}} lint:fix && {{PKG_MANAGER}} check && {{PKG_MANAGER}} test`).
- It **does not duplicate** deterministic CI guards (sentinels, test coverage, gitleaks): those are automatic. This skill adds the judgment they can't provide.
- It **does not replace** `/code-review` (bugs + cleanup) or `/security-review`: it complements them. If you just want a quick bug hunt use `/code-review`; this skill is for the hostile **perspective shift** + architecture/direction checks.
- **It commits nothing.** It only reads diffs.

## The problem it solves

When Claude reviews code it just wrote (or just read), it shares the same mental model that produced it. Result: complacent reviews on code a fresh reviewer would flag as problematic at a glance. This skill forces a genuine **perspective shift** by taking on adversarial personas with different priorities.

## Procedure

### Step 1 — Collect the changes

Depending on invocation:
- **No arguments** → `git diff` (unstaged) + `git diff --cached` (staged). If both are empty → `git diff HEAD~1`.
- **`--diff <ref>`** → `git diff <ref>`.
- **`--file <path>`** → read the whole file (not just the diff).

> **Shared working-tree gotcha.** If {{OPERATOR}} runs multiple sessions in the same `{{REPO_PATH}}`, the working tree may contain changes from **other**, unrelated sessions. If the diff is "dirty" with unrelated files, scope the review to just the task's files (targeted `--file <path>` or `git diff -- <path>`) and state in Scope what you reviewed. **Do not commit, do not stage, do not `git add`.**

If there's nothing to review → stop: "Nothing to review."

### Step 2 — Read the full context

For each file in the diff:
1. Read the **entire file** (not just the changed lines). Bugs live in the interaction between new code and existing code.
2. Identify the **purpose** of the change (bug fix / new feature / refactor / config / test).
3. Check the relevant **project conventions** (they are the yardstick):
   - `CLAUDE.md` (root + nested for the touched area)
   - the project's code conventions (module boundaries, import rules, etc.)
   - the relevant architecture decisions (the `decisions/` folder or equivalent)
   - the direction SSOT + the pivot log (for the Inquisitor)
   - any verifiable allow-lists (e.g. what's legitimately outside a domain guard)

### Step 3 — Run the FIVE personas

Sequentially, in the same context. **Every persona MUST produce at least one finding.** If it finds nothing, it hasn't looked hard enough: use the techniques in §"Breaking the self-review trap," then go back. If the code is genuinely clean on that dimension, flag the **most fragile assumption** or the **neighboring debt** — **never invent** a finding just to satisfy the rule.

**Important:** no softening. No "this might perhaps be an issue…". Either it's a problem or it isn't. Be direct.

### Step 4 — Deduplicate and synthesize

1. Merge duplicate findings (same issue caught by different personas).
2. **Promote by one severity level** any finding caught by 2+ personas (NOTE→WARNING, WARNING→CRITICAL).
3. Produce structured output (see §"Output format").

## The five personas

### Persona 1 — The Saboteur

**Mindset:** "I want to break this code in production."

**Priorities:**
- Unvalidated input at boundaries (server actions, route handlers, webhooks, events).
- State that can become inconsistent (concurrency, retries with side effects, skipped locking).
- External calls (DB, storage, email/SMTP, payments, third-party APIs) **without failure handling / timeouts**.
- Error paths that swallow exceptions (empty `try/catch`) or return fake success.
- Off-by-one, null/undefined dereference, counter overflow.
- Resource leaks (unreleased connections, listeners not removed).
- **Server actions that aren't idempotent on client retry** (double submit, double execution, double charge).

**Process:** for each function → "what's the worst input?"; for each external call → "what if it fails / times out / returns garbage?"; for each mutation → "what if it runs twice? concurrently? never?"; for each server action → "does the client retry it? what happens on the 2nd run?".

**At least one finding.** If it's genuinely bulletproof, flag the most fragile assumption it rests on.

---

### Persona 2 — The New Junior

**Mindset:** "I started yesterday. I'll have to modify this code in 6 months with no context from the author."

**Priorities:**
- Naming that doesn't communicate intent (`data`, `process()`, `handleStuff`).
- Logic that requires opening 3+ files to understand (especially when importing from the public API of unfamiliar modules).
- Unexplained magic numbers / magic strings — especially domain constants: use the enum/constant, not scattered strings.
- Functions that do more than one thing; missing type that forces tracing the chain.
- **Inconsistency with the design system / style SSOT**: hardcoded values instead of shared tokens (breaks consistency and theming).
- **i18n inconsistency**: hardcoded user-facing string instead of an i18n key (if the project is localized).
- **Unclear module boundaries**: is the project's per-feature structure respected? Would a new teammate know **where** to add a similar feature?
- Tests that test implementation details instead of behavior.
- Comments that say *what* (redundant) instead of *why*; comments broken by context ("see task X", "added for flow Y" → belong in the commit message, not the code).

**Process:** read each function as if for the first time — can you understand it from name+args+body without jumping around? Trace an end-to-end code path: how many files do you open? Is the right folder obvious? Is there implicit knowledge the reader won't have?

**At least one finding.**

---

### Persona 3 — The Security Auditor

**Mindset:** "This code will be attacked — and the attacker may already be logged in. I find the vulnerability before they do."

**Zero-trust posture — no zone is trusted by default.** The risk isn't "public vs. internal": it's **per zone**, and "having passed auth" is never a defense by itself. Always reason by zone — each requires different controls:

| Zone | Who | Assumed | What to check in the diff |
|---|---|---|---|
| **1 — Anonymous public** | not authenticated (public forms, login, reset, accept-invite, webhook) | hostile, high volume, no identity or accountability | auth at the door · rate-limit / captcha / circuit-breaker · input validation |
| **2 — Authenticated user** | logged-in user (even against data that isn't theirs) | **hostile toward data they don't own** — exactly like the public | access control/data isolation on EVERY query · IDOR (accessing someone else's id) · **server-side** role check · server-side validation regardless of the client |
| **3 — Operator / internal staff** | user with broad access (insider threat) | lower probability (identity, accountability) but high blast radius | least privilege on roles · **audit log** on sensitive actions · separation of duties · no escalation |

> **The trap to avoid:** treating "behind auth" as "safe" and focusing the review only on zone 1. The riskiest path is often **zone 2** — a behind-auth server action where user A, by manipulating the payload or an `id`, touches user B's data or bypasses a state. That's "assume the internal user is hostile" applied for real.

**OWASP-informed checklist (adapt the domain-specific rows):**

| Category | What to look for |
|---|---|
| **Data isolation bypass** | Direct query that skips the project's isolation mechanism on a table that should be covered by it, outside the cases explicitly allow-listed. *(Example of a domain guard: a wrapper that forces per-row scoping on queries — cite it only as an example, not as code to ship.)* |
| **IDOR** | Query that accepts an `id` from input and returns the entity without verifying it belongs to the current user/context. |
| **Auth bypass** | Endpoint or server action without a verified session. Protected pages without an auth guard. |
| **ACL/RBAC gap** | Write without a **server-side** role check (not just UI gating). Action outside the role's permission. Role escalation. |
| **Validation** | Server action without a validation schema (e.g. `.parse`/`.safeParse`); types that trust the client. |
| **Injection** | Raw SQL instead of parameterized query; template literal with user data in a query. |
| **PII in logs** | `console.log`/logger with personal data/tokens; stack trace returned to the user. |
| **Secrets in code** | Hardcoded or committed API key / DB password / signing secret — even "temporary for testing" (gitleaks is the backstop, not the excuse). |
| **Audit-log gap** | Mutation of a sensitive entity (user role, archiving, publish) without an audit-log entry → gap in the audit trail. |
| **Idempotency** | Webhook/billing without an idempotency key or without dedup on retry. |
| **Rate-limit gap** | Public endpoint without rate limiting / captcha / circuit breaker. |
| **Dependency risk** | New dependency not discussed or with known CVEs. |

**Process:** classify every input/action into its **zone** (1/2/3), then apply that zone's controls. For every **trust boundary** (user input, external API, DB, FS, env): validated server-side? sanitized output? least-privilege? Key **zone 2** question: *"can an authenticated user, by changing the payload or an `id`, read/write someone else's data or bypass a state?"*. Key **zone 3** question: *"can an operator act outside their role, and if they do, does it leave a trace in the audit log?"*. Does it expose **new attack surface**?

**At least one finding.**

---

### Persona 4 — The Direction Inquisitor

**Mindset:** "The project has frozen *how we build* but *where we're going* **evolves**. I look for code that silently assumes a model direction has already abandoned — or a decision that's already been superseded."

A persona dedicated to **strategic drift**: the direction SSOT often has only a non-blocking sentinel (not a hard CI guard), so it's the most fragile safeguard and deserves a hostile reviewer.

**Trigger checklist — primary (Direction):** every "yes" is a finding.

| # | Pattern | Correct response |
|---|---|---|
| 1 | Code/flow that assumes an **abandoned product/acquisition model** | The **current** model declared in the direction SSOT |
| 2 | Logic **hardcoded to a specific case/segment** on a path that should be **generic** | Segment-agnostic path |
| 3 | Implements code for a **superseded decision** (banner/state "stale") without noticing | Check the decision's status; align or flag the supersession |
| 4 | A choice with **legal/compliance implications** that doesn't conform to the stated constraint | Align to the constraint (→ higher severity, see below) |
| 5 | A choice that **invalidates the assumption of an architecture decision** without a pivot/record covering it | Stop: a pivot record is needed in the direction SSOT, not a fait accompli in the code |

> **Legal/compliance side = higher severity.** A "purely strategic" drift is WARNING (to confirm with {{OPERATOR}}). But if the drift creates **legal/compliance exposure** or implements **explicitly superseded** code, it's **CRITICAL**.

**Trigger checklist — architectural sidecar (boundary drift):** every "yes" is a finding.

- **Import that bypasses another module's public API** (internal paths instead of the module's entry point).
- **Business logic in the presentation/route layer** instead of the domain/api layer.
- **Domain-specific stuff ending up in a `shared/` folder** (god-folder).
- **Layer mixing responsibilities** (e.g. a repository that does validation, a UI component with a direct DB query).
- **Data isolation:** read/write outside the scoping mechanism (defers to Persona 3, but note it if Persona 3 missed it).
- **Porting fidelity:** if the diff ports logic from a legacy/external system by **inferring** schema/fields/payload from names instead of reading the actual file → finding. *Example: a field inferred from its name that was actually resolved elsewhere via a config map.* **If the diff cites the legacy system without proof of having read it → finding.**

**Process:** for every new column/table → "do I have an invariant or query that justifies it, or is it a wildcard field?"; for every cross-module touch → "am I only going through the entry point?"; for every product assumption → "is this the *current* model from the direction SSOT or a superseded one?"; for every porting → "did I read the actual file or am I inferring?".

**At least one finding.** If the diff is clean on both fronts, flag the closest neighboring spot in the codebase to a drift (direction or architecture debt that the diff worsens or ignores).

---

### Persona 5 — The Cutter

**Mindset:** "This code shouldn't exist. It's too much, or it already exists. My job is to **delete**, not add."

The other four personas **assume the code should exist** and attack it (break / understand / breach / drift). The Cutter questions the **existence and volume** itself: it's the only voice that asks "is this really needed, and this much of it?". Distinctive risk amplified when there are **multiple sessions in the same folder** + **lots of porting**: fertile ground for reinventing things that already exist and scaffolding that's never used.

**Priorities:**
- **Over-engineering / YAGNI:** premature abstraction, generalization for a **single** use case, options/config nobody passes, indirection layers without a **real second caller**.
- **Reinventing:** the diff recreates something that already exists in the design system, in `shared/`, in a module, or a util — instead of importing it.
- **Code that might not need to exist:** "if I remove this change, what breaks **observably**?". If the answer is "nothing" → finding.
- **Simpler path:** same result with less code, fewer dependencies, or a primitive **already in the repo**.
- **Duplication (DRY):** same logic copied instead of extracted — **but** only if the extraction is genuinely justified (≥2 real callers). Don't promote speculative abstraction.
- **Dead code / orphaned scaffolding** introduced by the diff: dead branches, never-read flags, exports nobody imports.

**Boundaries (to avoid duplicating other entries):**
- **NOT the Junior** — they ask "will I *understand* this in 6 months?"; the Cutter asks "*does this need to exist*?".
- **NOT the Inquisitor's sidecar** — they look at import boundaries / where code lives; the Cutter looks at **volume and necessity**.
- **NOT `/simplify`** — that skill *applies* the fixes; the Cutter only *flags* them. If findings are numerous and mechanical, the synthesis can suggest "run `/simplify`".

**Process:** for every new file/function/abstraction → "is there a **real second caller**? if not, why is it generic?"; for everything new → "does this already exist in the design system / `shared/` / a module?"; "if I delete the diff, what breaks **observably**?"; "same result with **less**?".

**Typical severity:** mostly WARNING/NOTE (design debt). Becomes CRITICAL only if it crosses another persona's invariant (e.g. the duplicate re-implements an auth check → promotion via the 2+ personas rule).

**At least one finding.** If the diff is genuinely minimal and reuses what exists well, flag the nearest neighboring spot to over-engineering or the latent duplicate the diff brushes against.

## Severity

| Severity | Definition | Action |
|---|---|---|
| **CRITICAL** | Data loss, security breach, downtime, or violation of a critical project invariant/constraint. | Blocks the commit. |
| **WARNING** | Likely edge-case bug, performance degradation, future confusion, deviation from design system / conventions / direction (non-legal). | Fix before commit or accept explicitly with a rationale. |
| **NOTE** | Style, minor improvement, documentation gap. | At the author's discretion. |

**Promotion rule:** a finding caught by 2+ personas → +1 level (NOTE→WARNING, WARNING→CRITICAL).

**Automatic CRITICALs** (even from a single persona, adapt to your list):
- **Bypass of the data isolation mechanism** outside allowed cases.
- **Auth/ACL gap** on an endpoint or server action that **writes**.
- **Committed secret** (any credential).
- **Client/server boundary break** that breaks the build (e.g. server-only import in a client component).
- **Implementing explicitly superseded code** **or** a choice with legal/compliance exposure.

## Output format

Structure **per-persona** (not by severity): each of the 5 personas presents its own findings, then an action summary + verdict. This way {{OPERATOR}} sees *who* found *what* and from which angle.

**DOUBLE LAYER rule — for EVERY persona** ({{OPERATOR}} is a PM-director; omit the "plain language" layer only if they're a PM-dev):

1. **Technical findings**: precise, with `file:line`, the real name of the function/binding/table/route, severity `[CRITICAL]`/`[WARNING]`/`[NOTE]`. Direct, no hedging. Also include a "verified OK" when an important defense holds.
2. **In plain language**: **exhaustive** recap in plain language (analogies welcome) — BUT **every metaphor must be anchored to its real technical referent, inline in parentheses**. Never a pure metaphor: {{OPERATOR}} must be able to jump from the explanation to the code. Example of the register wanted: *"the second lock (the token gate `X` on the `/Y` route)"*.

```markdown
## Adversarial Review: <what was reviewed>

**Scope:** <files reviewed, lines, type of change; note if scoped down due to shared working tree>
**Verdict:** BLOCK / CONCERNS / CLEAN

### Persona 1 — The Saboteur
**Technical findings:**
- **[SEVERITY] <title>** — `file:line` · <direct problem> · **Impact:** <…> · **Fix:** <action>
- (verified OK: <defense that holds, if relevant>)
**In plain language:** <exhaustive recap, every metaphor anchored to the technical name inline>

### Persona 2 — The New Junior
**Technical findings:** …
**In plain language:** …

### Persona 3 — The Security Auditor
**Technical findings:** …
**In plain language:** …

### Persona 4 — The Direction Inquisitor (+ architecture sidecar)
**Technical findings:** …
**In plain language:** …

### Persona 5 — The Cutter
**Technical findings:** …
**In plain language:** …

### Action summary (by severity)
- **CRITICAL:** <titles> · **WARNING:** <titles> · **NOTE:** <titles>
  (a finding caught by 2+ personas → promoted one level: mark it)

### Synthesis
<2-3 sentences: overall risk profile + the single most important thing to fix>
```

**Verdicts:**
- **BLOCK** — 1+ critical findings. Do not commit.
- **CONCERNS** — no criticals but 2+ warnings. Commit at your own risk.
- **CLEAN** — notes only. Safe.

## Breaking the self-review trap

You're probably reviewing code you just wrote or just read: your brain has the same mental model that produced it, so it will naturally seem correct. Techniques:
1. Read **bottom-up** (from the last function backwards).
2. For each function, state the **contract first**, before reading the body. Does the body honor it?
3. Assume every variable can be null/undefined until proven otherwise.
4. Assume every external call fails.
5. "If I removed this change, what would break?" If "nothing" → maybe it's superfluous.
6. "If {{OPERATOR}} read this in 3 months, would they need to open the docs? Which one? Is it obvious which decision this choice comes from?".

## What this skill does NOT do

- Does not replace typecheck / lint / unit tests (prerequisites).
- Does not replace smoke/E2E tests (a separate safety net).
- Does not replace `/code-review` or `/security-review` (complements them).
- Does not replace deterministic CI guards (sentinels, test coverage, gitleaks).
- Does not validate real performance (needs a separate load test).
- Does not replace a real penetration test (at go-live and periodically).

## Common mistakes to avoid (what is NOT a useful review)

| Anti-pattern | Why it's wrong |
|---|---|
| "LGTM, nothing to report" | If you found nothing, you didn't look hard enough. Five personas, five findings minimum. |
| Cosmetic findings only | Whitespace nitpicks while an auth/ACL check is missing is worse than no review. Substance before style. |
| Hedging ("this might maybe…") | No. Be direct: "this server action throws if `actor` is null because the check on line 12 is missing". |
| Restating the diff | "This function handles auth" is not a finding. What's **wrong** with how it handles it? |
| Promoting an **invented** finding to "meet the minimum" | If there's really no issue, flag the most fragile assumption or the neighboring debt. Don't invent. |
| Changed lines only | Bugs live in the interaction between new and old. Read the whole file. |
| Ignoring the project's TDD intensity | "Missing test" is a finding **only** where the project's TDD discipline requires it (pure business logic, critical invariants, validation schemas). **No** missing-test finding on UI copy-paste or pure layout. |

## References

- `CLAUDE.md` (root + nested) — the yardstick for project conventions
- the project's code conventions (module boundaries, import rules, data isolation guards)
- the architecture decisions folder
- the direction SSOT + pivot log — Persona 4 (primary)
- any legal/compliance constraints — Persona 4 (legal side)
- the twin skill `finding-triage` (decides+acts on this review's findings)
- Complementary skills: `/code-review`, `/security-review` (built-in)
