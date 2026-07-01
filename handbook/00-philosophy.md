> KIT · [agnostic] — the two load-bearing axioms of the method. Applies to any project/stack; explains *why* the rest of the kit is built this way. Read it before adopting any automation.

# 00 · Philosophy — the two load-bearing axioms

This kit isn't "a set of files to copy". It's a **working method** for a project where:

- the typical operator (here: **{{OPERATOR}}**) is a **PM-director**: directs, decides, and reviews; the AI agent writes the production code — whether the operator can code (**PM-dev**) or not (the only practical difference is whether the "plain language" layer is needed);
- the Claude Code agent is the **primary builder**;
- the project documentation is **alive** (it changes with every Intervention), not a wiki that grows stale.

Everything else in the kit follows from two axioms. If you only keep these two in mind, you've understood the method.

---

## Axiom 1 — Binding automation over voluntary discipline

**Technical line.** The number-one risk of a living documentation system is **sync drift between files**: the Board says one thing, `git log` says another, the ADRs describe a third, the agent's memory a fourth. That's why the kit **favors binding automation** — git hooks (pre-commit / pre-push / post-commit), machine-readable manifests, linters, sentinels, generators — **over the model's voluntary discipline**.

**In plain language.** An AI assistant halfway through a long session "forgets" its good intentions: it skips a check, forgets to update a file, takes a hypothesis at face value. The rule written in the document ("always remember to…") **isn't enough**: nobody enforces it. A hook that **blocks the commit** if the thing isn't done, does. So: every time you notice a rule depends on the good will of whoever is working, ask yourself *"can I turn this into an automatic check that fails on its own?"*. If yes, do it.

Practical consequences (spelled out in the other chapters):

| Drift risk | Binding mechanism | Where |
|---|---|---|
| The Board (`STATE.md`) diverges from the `git log` | **post-commit** hook that re-bumps the git fields in the frontmatter | `04-living-state-machine.md` |
| A state file becomes huge/unreadable | **size** sentinel in pre-push | `08-quality-automation.md` |
| A product pivot stays "hanging" without being recorded | **direction** sentinel that reminds of open touch-points | `03-ssot-architecture.md` |
| Record frontmatter out of schema | **docs validator** in pre-push | `08-quality-automation.md` |
| Secrets committed by mistake | secret scanner in **pre-commit** + CI | `reference/pattern-ci.md` |
| Non-conforming format/lint → red CI | linter **auto-fix before commit** | `06-engineering-practices.md` |

> Guiding principle: **if it matters that it's true, a machine must verify it** — not a note in a document, not a reminder to the agent. You forget the note; the hook doesn't.
>
> Corollary (anti-over-engineering): always validate **the basic diagnostic hypothesis** before building complex automation. A failing check can be a momentary false alarm (build just finished, warm cache): verify "cold" before concluding there's a structural problem. *Example: a linter reporting hundreds of errors right after a build, but zero cold across two stable runs → it wasn't debt, it was noise.*

---

## Axiom 2 — The record level is proportional to how long the decision LASTS, not how big the code is

**Technical line.** Every decision leaves a trace, but **at different levels of durability**. The record level is chosen based on *how long that decision will bind the future*, **not** on how many lines of code it produced. A small but architectural capability (a new cross-cutting contract) → high record. A huge but reversible and local refactor → low record.

**In plain language.** Don't confuse "I wrote a lot of code" with "I made an important decision". Sometimes you change a thousand lines but it's just reversible plumbing (a Journal line). Sometimes you change three lines but establish a rule everything else will have to respect forever (architectural decision → ADR). The Journal is for "what happened"; ADRs and PDRs are for "why, and how long this binds us".

### Record routing table

| What you decided | How long it lasts | Where the "why" lives |
|---|---|---|
| **Product/business pivot** — changes *who we serve / how we acquire / how we monetize / how we operate*, **or invalidates an ADR's assumption** | until it is itself superseded | **PDR** in `docs/DIRECTION.md` (+ propagation checklist) + Journal entry |
| **Architectural decision** — data schema, cross-cutting contract, auth choice, an assumption that binds other modules | until superseded by a new ADR | **ADR / mini-ADR** in `docs/architecture/decisions/` (+ Journal entry). ADR vs mini-ADR threshold: `docs/implementation/20-discipline/04-mini-adr-template.md` |
| **Everything else** — UI polish, local refactor, micro-fix, QA bug, cosmetic migration | duration of the Intervention itself | **Journal entry** (with a summary in *plain language* for the operator) + **memory** if it's not obvious from the code |

> The mini-ADR ↔ ADR threshold is the **twin** of the PDR criterion (see `03-ssot-architecture.md`): same reasoning ("2+ axes touched / an assumption invalidated"), applied to two different layers.

---

## Why the Direction layer is separate from the Technical layer

The kit keeps **two parallel and distinct tracks**:

- **Technical layer** — *how* we build: ADR + Board (`STATE.md`). SSOT of engineering decisions and current state.
- **Direction layer** — *where we're going*: `DIRECTION.md` + **PDR** log. SSOT of product/business direction.

**Technical line.** A product decision ("we're changing who we serve", "we're changing how we acquire customers") **is not** a technical decision, and mixing them creates two pathologies: either strategic pivots "float" unrecorded in scattered notes until it's forgotten why the deviation happened, or the ADRs get frozen as dogma and the plan is pretended to be immutable even when the product has already moved elsewhere.

**In plain language.** You decide the technical stack (language, database, hosting) once and freeze it: that's the *how*. But *where the product is going* keeps evolving, and when it does it can make an ADR written under a different assumption "old". Keeping the two layers separate: the *how* stays stable (you don't re-discuss the stack every chat), while the *where* can change **in a tracked way** — you record the pivot as a PDR, rewrite the north-star, and mark the touched ADRs as superseded (a "stale" banner) instead of pretending they still hold.

Golden rule on both layers: **no unilateral pivots from the agent**. Options are presented with pros/cons, the operator confirms, *then* the record is written (PDR or ADR). Details in `02-decision-discipline.md`.

---

## From here

- **How work happens, Intervention by Intervention** → `01-operating-model.md`
- **How a decision is made and recorded** → `02-decision-discipline.md`
- **The two layers (technical vs direction) in detail** → `03-ssot-architecture.md`
- **The living Board and its automatic sync** → `04-living-state-machine.md`
- **How to communicate with the PM-director operator (double layer)** → `05-communication.md`
- **Adapting the kit to a team — `solo`/`team` profiles** → `09-operating-profiles.md`
