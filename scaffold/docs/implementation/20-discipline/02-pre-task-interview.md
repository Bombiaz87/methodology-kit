---
title: "02 — Pre-Intervention interview (archetypes + blocks)"
---

> KIT · [agnostic] — pre-Intervention interview protocol: structured thinking before writing code. Step 1 detect archetype → Step 2 one-question-per-decision (double layer) → Step 3 draft. Applies wherever the operator is a PM-director (decides; the AI writes the code).

> ✅ **The interview is the heart of every Intervention** — it's structured thinking, never skipped for non-trivial work. The answers don't end up in a "task.md", but in the **Intervention's record** (PDR / ADR / JOURNAL entry, see [`00-quick-start.md`](../00-quick-start.md)).
>
> **Automatic trigger**: as soon as the AI is about to build something non-trivial, it starts from here — no magic phrase from {{OPERATOR}} needed. {{OPERATOR}} can always say "skip, it's plumbing" and go straight to build.
>
> 🔄 **Updated.** The number of rounds/sections/questions is **no longer fixed** (it used to be "0 / 1 / 2-3" by size) — it's **always emergent** from the real gaps (Step 2). The coverage pass **always runs**, even on size S / infra archetype (the old categorical skip is gone); and one round can spawn N recursive niche rounds, with no pre-decided cap. See Step 2 for the mechanism and the explicit anti-bias guard.
>
> **Who it's for**: it keeps the AI from building things that are technically executable but blind to the "why" and to UX. It gives {{OPERATOR}} a structured decision moment before the code takes shape.

---

## Step 0 — Size (appetite) & routing

Before the archetype, the AI **proposes the size** of the Intervention in 1 line ("size M → 1 round + mini-ADR + no review, ok?"); {{OPERATOR}} corrects it. **It's not a mandatory field** — it routes *together* the interview depth, the record level (twin of the two axioms), and the review, without weighing down the "go ahead" flow.

| Size | Examples | Rounds (indicative — the actual count emerges from Step 2) | Expected record level | Adversarial review |
|--------|--------|------------------|------------------------|---------------------|
| **S** — small | localized bugfix, copy, chore, config, UI polish | Round 1 always runs; often closes with 0 questions (an outcome, not a skip) | Journal line | no |
| **M** — medium | feature in a module, new handler, contained refactor | Round 1 + any niche rounds that emerge | Journal + possible mini-ADR | only if it touches a sensitive area |
| **L** — large | new subsystem, changes a public interface / schema / isolation rule, product pivot | Round 1 + N niche rounds, N not pre-set | ADR (+ PDR if a product pivot) | yes |

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

## Step 2 — Interview: rounds, sections, questions (all emergent)

Rule: **one question per decision**, **max 4 per call** (a tool constraint — if a section has more than 4 real questions, split across consecutive calls, **don't** cut questions to stay under 4), every option with pros/cons + **(Recommended)**.

**Double layer mandatory** (when the Intervention touches code): every question and every option has **two lines**.
1. **Tech** — precise sentence with dev-eng terms (API, library, file, pattern). No dumbing-down the key terms.
2. **In plain language** — the same choice rephrased in product / customer / operations terms. What changes, seen from outside, if we pick A instead of B.

Exception: internal tooling invisible to the product (e.g. linter A vs linter B) → a terse PM line like "Difference invisible to the user" is enough.

### Anti-bias guard (load-bearing)

**The number of rounds, of sections per round, and of questions per section is never decided upfront.** It emerges round after round from the real `Partial`/`Missing` cells (coverage pass, below). An LLM tends to converge on "clean" numbers out of stylistic habit (3 questions, "2-3 rounds") even when they don't reflect the real gaps — this is a bias to actively counter, not a harmless default.

**Before launching any round or section, the AI states in 1 line the count AND the list of gaps that generated it.** Example: *"Section 'Stripe idempotency': 3 questions (cells: failure-mode-retry, audit-log-category, edge-double-webhook)"*. If the count happens to be 3 or 5, fine — but it must **never** be picked because "it feels like the right number": it's always the exact count of open gaps, whether that's 1 or 9.

### Round 1 — broad coverage pass (always, even size S / infra archetype)

The coverage pass (table below) **always runs**, with no exception for size or archetype. Size and archetype only route *which categories* are in scope (the active blocks) — not *whether* the check happens. The old rule "never interview on pure plumbing" is gone: the archetype no longer decides to skip the check, the check's **outcome** is what can be minimal (even zero questions, on a genuine one-liner) — but that outcome is always verified, never assumed by category.

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

Repertoire of 4 candidate questions — not a fixed-pick menu. Ask **all** the ones whose cell the coverage pass marks Partial/Missing (not a conventional "2-4" subset); if a real gap isn't covered by any candidate below, write an ad-hoc one.

1. **Guaranteed business rule**: which invariant / legal requirement / commercial constraint must it respect? What's the authoritative source (ADR, legal doc)?
2. **Failure mode**: what happens if the operation fails? (silent retry with backoff and how many times / user-friendly visible error / alert + dead-letter / hard fail / soft fail with graceful degradation).
3. **Capability / plan**: which plan/flag enables this feature? Behavior for those without it?
4. **Audit log**: should it write to the audit log? Which fields, which category?

### UX block (User-facing only)

Repertoire of 6 candidate questions. Same principle as Business: all the relevant Partial/Missing cells, not a conventional "3-5" range.

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

### Round 2…N — recursive niches

From the answers of a just-closed round, the AI does two things:

1. **Updates the coverage pass** for the scope just closed (global at Round 1, local to a niche in later rounds).
2. **Detects niches** — sub-topics the answer opened up, carrying their own Partial/Missing cells not anticipated in the starting grid. Example: the answer "local-storage draft + sync on recovery" to a form's failure-mode question opens up a topic, unseen in Round 1, about what happens with **two browser tabs** holding conflicting local drafts. Each niche found gets declared to {{OPERATOR}} in 1 line, with the cell that generated it.

For each niche that emerges, the AI opens a **dedicated round**: section = the niche's name, coverage pass local to that niche only, questions = the Partial/Missing cells of that local coverage pass (same anti-bias guard as above: count + declared gaps, never a convenient number). A niche can itself spawn a deeper niche — it's recursion, with no fixed depth cap.

**Stop**: when, across all open rounds at any depth, no new Partial/Missing cell emerges, or {{OPERATOR}} says "enough, proceed." Not a pre-set round count — see Step 0, "Rounds (indicative)" column.

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

## Example: interview dialogue for an infra Intervention (minimal coverage pass, not a skip)

**{{OPERATOR}}**: "ok, linter setup in the monorepo".
**AI**: "Infra/plumbing Intervention → Technical block only. Running the coverage pass anyway (it always runs, even here)."

**Coverage pass**: every cell Clear except `Definition-of-done` (Missing) → 1 question, not zero out of habit: "How do we verify the linter config is right: just a green `lint` run, or also a test that the pre-commit hook blocks a deliberately dirty file?" (Recommended: green run only). {{OPERATOR}} answers → AI proceeds to draft.

**If the coverage pass had come back all Clear** (a genuine one-liner, e.g. a typo fix), zero questions is the legitimate outcome — but a verified one, not a rule that skips the check upfront.

---

## Example: a niche emerging from an answer (recursive round)

Round 1 Business, the failure-mode question → {{OPERATOR}} picks "local-storage draft + sync on recovery". The answer opens a niche not anticipated in Round 1: what happens if **two tabs** of the same browser hold conflicting local drafts?

**AI declares the niche**: "Niche 'multi-tab conflict' emerges (cell: edge/failure-mode, not covered by Round 1) → opening a dedicated round, 2 questions (cells: merge-strategy, user-notification) — not 3 out of habit, these are the 2 real cells this niche opened."

**Round 2 — niche "multi-tab conflict"**: (1) auto-merge by latest timestamp vs. a banner "you have another draft open, pick which to keep"; (2) how to surface it — silent vs. persistent banner.

If the answers don't open further niches, the interview stops here: **2 rounds total**, not a "3" picked to look thorough.

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
- ❌ Skip the coverage pass upfront by size/archetype — it always runs; it can close with zero questions (an outcome), but it's never skipped by category (a rule).
- ❌ Pick the number of rounds/sections/questions by stylistic convention (3, 5...) — the count follows the real Partial/Missing cells, declared one by one.
- ❌ Truncate a real niche just to stay within a range that "feels reasonable" — if a niche genuinely needs 7 questions, it's 7.
- ❌ More than 4 questions per single call (tool constraint, not a cap on the total question count — split across calls instead).
- ❌ "Do you want X or Y?" without pros/cons + recommended.
- ❌ Merging 2 decisions into 1 question — one-decision-per-question.
