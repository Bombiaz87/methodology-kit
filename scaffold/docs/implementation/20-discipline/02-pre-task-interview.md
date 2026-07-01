---
title: "02 — Pre-Intervention interview (archetypes + blocks)"
---

> KIT · [agnostic] — pre-Intervention interview protocol: structured thinking before writing code. Step 1 detect archetype → Step 2 one-question-per-decision (double layer) → Step 3 draft. Applies wherever the operator is a PM-director (decides; the AI writes the code).

> ✅ **The interview is the heart of every Intervention** — it's structured thinking, never skipped for non-trivial work. The answers don't end up in a "task.md", but in the **Intervention's record** (PDR / ADR / JOURNAL entry, see [`00-quick-start.md`](../00-quick-start.md)).
>
> **Automatic trigger**: as soon as the AI is about to build something non-trivial, it starts from here — no magic phrase from {{OPERATOR}} needed. {{OPERATOR}} can always say "skip, it's plumbing" and go straight to build.
>
> **Who it's for**: it keeps the AI from building things that are technically executable but blind to the "why" and to UX. It gives {{OPERATOR}} a structured decision moment before the code takes shape.

---

## Step 0 — Size (appetite) & routing

Before the archetype, the AI **proposes the size** of the Intervention in 1 line ("size M → 1 round + mini-ADR + no review, ok?"); {{OPERATOR}} corrects it. **It's not a mandatory field** — it routes *together* the interview depth, the record level (twin of the two axioms), and the review, without weighing down the "go ahead" flow.

| Size | Examples | Interview rounds | Expected record level | Adversarial review |
|--------|--------|------------------|------------------------|---------------------|
| **S** — small | localized bugfix, copy, chore, config, UI polish | 0 (straight to build) | Journal line | no |
| **M** — medium | feature in a module, new handler, contained refactor | 1 round (relevant blocks) | Journal + possible mini-ADR | only if it touches a sensitive area |
| **L** — large | new subsystem, changes a public interface / schema / isolation rule, product pivot | 2-3 rounds | ADR (+ PDR if a product pivot) | yes |

Size is **orthogonal to the archetype**: two "domain" pieces of work can weigh S vs L. Archetype = *which blocks*; size = *how heavy the whole process is*. When in doubt: the bigger size.

---

## Step 1 — Detect archetype

The AI declares the archetype to {{OPERATOR}} (1 line) and activates the corresponding blocks. {{OPERATOR}} can correct it.

| Archetype | Definition | Active blocks |
|-----------|-------------|----------------|
| **Infra/plumbing** | Setup, scaffolding, tooling, data schemas with no UI, config | Technical |
| **Domain logic** | Pure business logic with no direct UI (computation, validation, retry, idempotency, filters) | Business + Technical |
| **User-facing** | Feature the end user sees and uses (forms, pages, flows, modals, dashboards) | Business + UX + Technical |
| **External integration** | Connector to a third-party service (webhook, email provider, DNS, external APIs) | Business + Technical |
| **Reconciliation/convergence** | Aligns **existing** code with decisions: starts from the *delta* between what the code does and what the ADR/Board/conventions say, not from a new trigger | Technical (+ Business if the delta touches a rule) |

**Ambiguous cases**: data schema for a user-facing table → *Domain* if the piece only touches the schema, *User-facing* if it also includes the form. Webhook that shows a notification → *Integration* (the UI flow is elsewhere). **Default when in doubt**: the richer archetype (more active blocks). {{OPERATOR}} prefers an "N/A" block to a missed decision.

---

## Step 2 — Interview per block

Rule: **one question per decision**, **max 4 per call**, every option with pros/cons + **(Recommended)**.

**Double layer mandatory** (when the Intervention touches code): every question and every option has **two lines**.
1. **Tech** — precise sentence with dev-eng terms (API, library, file, pattern). No dumbing-down the key terms.
2. **In plain language** — the same choice rephrased in product / customer / operations terms. What changes, seen from outside, if we pick A instead of B.

Exception: internal tooling invisible to the product (e.g. linter A vs linter B) → a terse PM line like "Difference invisible to the user" is enough.

On a complex user-facing Intervention → 2-3 rounds (one per block). On plumbing → zero rounds, straight to the draft.

### Coverage pass (before choosing the questions)

The AI runs a pass over these categories and marks them **Clear / Partial / Missing** *before* deciding which questions to ask — so it doesn't leave a blind spot to the moment's intuition (it's from an unseen `Missing` that bugs born from an unverified schema assumption come). Only the `Partial`/`Missing` ones **surface as questions**.

| Category | Status |
|---|---|
| Functional scope (what it does, boundaries) | Clear / Partial / Missing |
| Data model / schema (payload shape between stages) | … |
| UX / states (empty/loading/error/success) — if user-facing | … |
| Non-functional (performance, security, multi-tenant isolation) | … |
| External integrations (provider, webhook, third-party API) | … |
| Edge / failure mode | … |
| Constraints (legal, commercial, plan-related) | … |
| Terminology (codebase alias → glossary) | … |
| Definition-of-done (how it's verified — twin of the Confirmation in ADRs) | … |

> The grid runs internally in the AI; only the gaps reach {{OPERATOR}} as questions. It's **not** a form to fill in by hand.

### BUSINESS block (Domain / User-facing / Integration)

Pick the 2-4 most relevant questions:

1. **Guaranteed business rule**: which invariant / legal requirement / commercial constraint must it respect? What's the authoritative source (ADR, legal doc)?
2. **Failure mode**: what happens if the operation fails? (silent retry with backoff and how many times / user-friendly visible error / alert + dead-letter / hard fail / soft fail with graceful degradation).
3. **Capability / plan**: which plan/flag enables this feature? Behavior for those without it?
4. **Audit log**: should it write to the audit log? Which fields, which category?

### UX block (User-facing only)

Pick the 3-5 most relevant:

1. **Target user**: who interacts with it? (internal user / partner / end customer).
2. **Device + layout**: desktop-first or mobile-first? Exceptions?
3. **Visual states**: empty / loading / error / success — which are needed and how are they presented? (empty with CTA? loading spinner/skeleton/optimistic? error toast/inline/banner? success redirect/toast/transition?)
4. **Network failure**: what happens if the call fails due to network issues? (automatic retry with feedback / local draft + sync / message + manual retry).
5. **Accessibility**: WCAG baseline. Additional constraints (keyboard on modal/dropdown, screen-reader announce on async, extra contrast)?
6. **Mockup**: does it already exist or do we sketch it now (in words or a link)?

### TECHNICAL block (always active)

- ADRs covered / architectural decisions touched.
- Dependencies on other Interventions.
- **Verify real sources** (mandatory when porting from existing code: read the real schemas/handlers/types, NEVER infer from names).
- Required tests (TDD red phase).
- Files created/modified.

---

## Step 3 — Drafting

Only **AFTER** the answers from the active blocks, the AI builds — annotating in the record (commit + JOURNAL entry + possible ADR/PDR):
- Declared archetype.
- **Business decisions** (if Business is active) — summary of answers.
- **UX decisions** (if UX is active) — summary of answers.
- The rest (goal, context, tests, files, acceptance criteria).

> The "Business decisions" + "UX decisions" sections are also the primary source for the **non-technical summary** (see `05-plain-language.md`): a well-done interview = a summary that's almost self-writing.

---

## Example: interview dialogue for a user-facing Intervention

**{{OPERATOR}}**: "ok, next up is the customer contact-edit form".

**AI (auto-detect + declares)**: "User-facing Intervention → activating all 3 blocks (Business + UX + Technical). Tell me 'skip' if I've overrated it. Starting with Business."

**Round 1 — Business** (example of one question, double layer):

> **Question (tech)**: "`email` validation for the contact field — strategy?"
> **In plain language**: "How sure do we want to be that the email the customer types is actually valid?"
> - Option A *(Recommended)* — "Regex format only". *Tech*: synchronous regex validation, zero external calls. *In plain language*: we only check the shape (the `@`, the domain), not that the mailbox exists. (+) zero latency and cost (−) a typo can slip through.
> - Option B — "Regex + DNS MX lookup". *Tech*: regex + verification of the domain's MX record. *In plain language*: we also check that the domain exists as a real email server. (+) blocks fake domains (−) +200-500ms, DNS dependency.
> - Option C — "Regex + verification via a paid provider". *In plain language*: maximum accuracy but costs per lookup. (+) accuracy (−) cost + rate limit.

(Then a question on the save's **failure mode**, one on **audit log**. Round 2 UX: device, empty state, save mode. Round 3 Technical: straight to draft.)

## Example: interview dialogue for an infra Intervention (total skip)

**{{OPERATOR}}**: "ok, linter setup in the monorepo".
**AI**: "Infra/plumbing Intervention → Technical block only. Proceeding to draft." (No questions.)

---

## HALT conditions (during BUILD+VERIFY)

The interview closes the gaps *before* the build. But if a blocker emerges during the build, **stop and ask** — do NOT mark the Intervention as finished while it remains open. Canonical conditions:

- **Out-of-scope dependency**: a decision/feature not agreed in the interview is needed → don't improvise, ask.
- **Unverifiable assumption** about the real code → mark `[TO-CLARIFY: …]` and stop (see below).
- **N consecutive failures** (default 3) on the same point → stop, report the state as-is, ask.
- **Red gate**: a critical guardrail/sentinel/test fails and the fix isn't obvious → don't work around it, ask.
- **Unauthorized irreversible or outward-facing action** (deleting data, push, sending email, editing a direction/ADR record) → confirm first.

Rule: with an open HALT condition, **DO NOT mark complete**. Better an Intervention "paused with a question" than one "finished" on an assumption.

### Machine-readable ambiguity markers

When a **blocking** ambiguity remains, seed a grep-able marker in the record, distinct from `TBD` ("deliberately deferred, that's fine"):

- `[TO-CLARIFY: …]` — a gap that **blocks completion** until resolved.
- `<!-- ASSUMED: … -->` — an assumption made to proceed, to be confirmed.

A pre-push sentinel (see `reference/sentinels-and-generators.md`) finds them and keeps them from silently disappearing. `TBD`/`TODO` remain for deliberate deferrals and **don't** block.

---

## What NOT to do

- ❌ Build user-facing without the UX block (even minimal).
- ❌ Build domain/integration without having clarified the failure mode.
- ❌ Run an interview for pure plumbing (it would be noise).
- ❌ More than 4 questions per call.
- ❌ "Do you want X or Y?" without pros/cons + recommended.
- ❌ Merging 2 decisions into 1 question — one-decision-per-question.
