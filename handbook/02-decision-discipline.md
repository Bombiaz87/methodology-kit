> KIT · [agnostic] — The decision discipline: two twins (ADR/PDR) + two registries + rejection records. Adapt it while keeping the TWO thresholds and the rule "one decision at a time, the operator decides, THEN write".

# Decision discipline

> **In plain language.** Every choice worth remembering becomes a written *record*. There are two kinds of choice — "how we build it" (technical) and "where we're going" (product/business) — and each has its place. The golden rule: the agent does NOT decide on its own, it proposes options, {{OPERATOR}} chooses, THEN the record is written.

---

## 1. Two twins: ADR vs PDR

The system has **two families of records**, symmetric but on different axes.

| | **ADR** — Architecture Decision Record | **PDR** — Product Direction Record |
|---|---|---|
| Answers | *How* we build it | *Where* we're going and *why* |
| Axis | Technical (stack, structure, contracts, schemas) | Product / business (who we serve, how we acquire, how we monetize, how we operate) |
| Where it lives | `architecture/decisions/NNN-slug.md` | pivot log in `DIRECTION.md` |
| Freezes? | Yes, until superseded | No — it's alive by design |
| Numbering | `001`, `002`, … (central) | `PDR-001`, `PDR-002`, … (append-only) |

> **In plain language.** The ADR says "we chose this library / this code pattern". The PDR says "we changed our mind about who our customer is / how we reach them". A PDR often *generates* one or more ADRs: the PDR lists them as touch-points, the ADR is born with a back-reference `[PDR-NNN]`.

**PDR → ADR relationship.** A product pivot changes *where we're going*; realizing it requires technical decisions. The PDR remains the source of the "why", the ADR captures the "how". Don't duplicate the product rationale inside the ADR: link it.

---

## 2. The two twin thresholds

Not everything deserves a formal record. Two twin criteria decide *when* to write and at *what level*.

### 2a. ADR threshold — the 3 binary questions (mini-ADR vs central ADR)

When a technical decision emerges during work, answer three yes/no questions:

1. **Does it touch more than one module / package / app?** → yes = architectural
2. **Does it change a public interface** (a package export, an exposed data schema, a route/URL)? → yes = architectural
3. **Does it survive the current work as a constraint** (does it still hold after the work is closed)? → yes = architectural

| Yes answers | Where it goes |
|---|---|
| 0/3 | **local mini-ADR**, colocated with the work (e.g. `<track>/local-adrs/NNNN-slug.md`) |
| 1/3 | local mini-ADR **with flag `propagation_risk: review`** in frontmatter |
| 2/3+ | **central ADR** in `architecture/decisions/NNN-slug.md` |

> **In plain language.** If the choice stays confined to a corner and no other piece of code has to adapt, it's a local note (mini-ADR). If instead it "obligates" the rest of the system or survives over time, it's a first-class decision (central ADR).

### 2b. PDR threshold — 2+ axes or an invalidated ADR assumption

Write a **PDR** when the pivot:

- touches **2 or more** of {*who we serve*, *how we acquire*, *how we monetize*, *how we operate/headcount*}, **or**
- **invalidates the assumption of an existing ADR**.

Below this threshold it's a product detail: it lives in its thinking-doc or among STATE's inline decisions, not in the pivot log.

> **The two thresholds are twins on purpose.** "2/3 questions" for the technical side, "2+ axes or an invalidated ADR" for the product side: same spirit (don't inflate records, but don't lose the decisions that bind).

---

## 3. Dual ADR registry

ADRs live on **two levels**, not just one:

- **Central registry** — `architecture/decisions/NNN-slug.md`. Global progressive numbering. These are the constraints that cut across the project and outlive it. Indexed in the status table of `architecture/README.md`.
- **Colocated mini-ADRs** — live next to the work that generated them (`<track>/local-adrs/NNNN-slug.md`, internal 4-digit numbering). These are emergent implementation decisions, local and non-binding for the rest.

**Promotion path (mini-ADR → central ADR).** If a mini-ADR turns out to be binding for other areas:

1. Take the next central ADR number.
2. Move the file to `architecture/decisions/NNN-slug.md`.
3. Adapt it to the central ADR template (see `decisions/000-template.md`).
4. Add the row to the status table of `architecture/README.md`.
5. Leave a **breadcrumb** in the old path (1 line: "Promoted to ADR NNN on YYYY-MM-DD, see …").
6. Update the cross-references.

> **In plain language.** A choice born "small" can grow. When it starts dictating rules to other pieces of the project, it gets "promoted" from a local note to an official decision — without erasing the trace of where it was before.

---

## 4. REJECTION records are first-class

A **reasoned NO** is worth as much as a yes. A decision to *not* do something (discarding an option, abandoning a path) is written with the same dignity as a positive choice.

- In ADRs: the **"Alternatives considered"** section isn't decorative — every discarded alternative has its "why not". An ADR without alternatives looks like a random decision.
- In PDRs: an abandoned pivot is marked **`state: abandoned`**, it doesn't disappear. *The story of "why we didn't do it" is worth as much as "why we did".*

> **In plain language.** Six months from now someone (or the agent) will bring back an already-discarded idea. If the "no" is written down and justified, you avoid going around in circles for nothing.

---

## 4b. Anatomy of a good record: boundaries, criteria, confirmation

A well-made ADR doesn't just say "what we decided and why": it also says **what it does NOT cover**, **on what criteria** it chose, and **how to verify** the decision is really being respected. Three fields, in addition to Context/Decision/Rationale/Consequences/Alternatives:

- **Out of scope (no-gos)** — the decision's explicit boundaries. Different from "deferred" issues: this is where deliberately excluded things go. Cuts scope-creep at the root ("this ADR doesn't cover legacy data migration").
- **Selection criteria** — the *grid* you weighed the options against (cost, lock-in, security, time-to-ship), not the conclusion. The Rationale says *why this one*; the criteria say *what you measured it against* — it's what makes the decision reconstructable.
- **Confirmation (how it's verified)** — the mechanism that proves the decision is implemented and respected, ideally automatic: a named test, a sentinel, an eyes-on smoke test. It's the twin of Axiom 1 ("if it matters that it's true, a machine must verify it") applied to the record: without it, an "Accepted" decision can silently have never been built.

The three fields are **optional when obvious**, but must be filled in as soon as the decision touches an invariant. The mini-ADR carries a compact version of them (one line of no-gos, one of confirmation).

> **In plain language.** Three questions a good decision record must be able to answer: "what did we *not* decide?", "what did we measure it against?", "how do I know it was actually done?". The first two prevent future misunderstandings; the third prevents a decision from staying only on paper.

---

## 5. Supersede at SECTION granularity — never delete

Decisions evolve, but history isn't destroyed.

- A superseded ADR/PDR is **never deleted**: it gets **superseded**.
- Superseding happens at **section granularity**, not whole-file. An ADR can have §A still valid and §C revised by a later decision. What was revised and by what is annotated (`Supersedes: ADR 007 §E + §F`).
- The incoming record declares what it replaces; the replaced record stays readable as historical context.

### Stale-banner mechanism

When a product pivot (PDR) invalidates an ADR's assumption, the ADR **doesn't pretend to be immutable**: it's flagged with a banner at the top of the file.

- A machine-readable marker a sentinel can read (see `08-quality-automation.md`), e.g. an HTML comment:
  `<!-- direction:stale PDR-NNN -->`
- A human-readable line right below, e.g.:
  `> ⚠️ Assumption revised by PDR-NNN (see DIRECTION.md): <one line on what changed>`

The sentinel cross-checks both sides (the PDR lists the ADR among its touch-points; the ADR cites the PDR) and flags inconsistencies (a banner pointing to a non-existent or abandoned PDR, declared but unchecked touch-points).

> **In plain language.** When the product pivots, old technical documents risk "lying". Instead of rewriting or discarding them, a yellow label gets stuck on them — "careful, this part was revised by PDR-NNN" — so whoever reads it (human or agent) knows not to trust it blindly.

---

## 6. The golden rule of the process

Valid for both ADR and PDR:

1. **One decision at a time.** Don't bundle five choices into a single shot.
2. The agent **presents the problem** in a few lines + 2-3 options **with pros/cons** (and one recommended).
3. **{{OPERATOR}} decides** (can ask questions, counter-propose).
4. **THEN** the record is written.
5. Move on to the next one.

**Two explicit prohibitions:**

- **No unilateral decisions from the agent.** Never choose and implement without discussion.
- **No doc-dumps.** Never write an ADR/PDR "as a surprise" without the preliminary conversation.

> **In plain language.** {{OPERATOR}} is a PM-director: their job is to *decide* with full understanding (the AI writes the code). The agent serves them the options pre-chewed (technical + implications), {{OPERATOR}} chooses, and only then does the choice crystallize on paper.

---

## 7. Discipline for ported IP (code copied from a legacy source)

When **porting** logic from a previous system or an external source, and the decision is "faithful copy" (not a rewrite):

- **Copy byte-for-byte.** Code marked as copy-literal transfers identically.
- **No improvements during the copy.** Don't rename, don't refactor, don't "clean up" while copying. Improvements and copying are two distinct jobs, at two distinct times — mixing them makes it impossible to tell an introduced bug from a pre-existing one.
- **Tracked map.** Keep an explicit "legacy file → new file" map (what's a faithful copy, what's hybrid, what's rewritten from scratch), so it's always clear which code is ported IP and which is new.
- **Always read the real source before porting.** Open the actual files (schemas, types, handlers, resolution helpers) — **never infer** from field names or nearby tasks. Column names, payload shapes, explicit vs derived options, implicit defaults: everything is verified against the source.

> **In plain language.** When reusing code that already works, you copy it *exactly* as it is and that's it. The temptation of "while I'm at it I'll improve it" is a classic generator of invisible bugs: first you copy it identically and verify it works, then — possibly, at a later point — you improve it. And you never guess what the source looks like: you open it and read it.

---

## See also

- `04-living-state-machine.md` — STATE/Board (implementation status) and DIRECTION (pivot log) as twins.
- `03-ssot-architecture.md` — who is SSOT of what, and the "before acting" reading order.
- `08-quality-automation.md` — the sentinel that checks stale banners and open touch-points.
- `../scaffold/docs/architecture/decisions/000-template.md` — central ADR template.
- `../scaffold/docs/implementation/20-discipline/04-mini-adr-template.md` — mini-ADR template + criteria.
