---
title: "DIRECTION — where the product is going (north-star + pivot log)"
---

> KIT · [agnostic] — skeleton of the "direction layer": a living north-star + an append-only PDR log. Fill §1 with your model, add a PDR entry on every pivot. The `check-coherence.mjs` sentinel reads the header format: respect it.

> **What this file is.** The **strategic twin** of `implementation/STATE.md`.
> STATE says *where the implementation is today*; DIRECTION says *where the product and
> the business are going today* — and keeps the **history of the pivots** (what we abandoned,
> changed, why). ADRs capture *how* we build; here is *where* we're going.
>
> **It is not an ADR and freezes nothing.** The architectural plan is a **technical
> baseline**; this file is living by construction. When a product pivot
> invalidates an ADR's assumption, you **flag** it here and **supersede** the ADR —
> you don't pretend the plan is immutable.
>
> **It is checked by a sentinel** (`{{PKG_MANAGER}} direction:check`, see §4):
> it won't let you forget a pivot that's been decided but not yet propagated.

> **In plain language.** Two different questions: "where is the work at?" → STATE;
> "why are we building exactly this?" → DIRECTION. Up here we don't describe
> *how* the code is made: we describe *where we want to get to* and *what we've
> changed our minds about doing*.

---

## 1. Current model (north-star)

<!-- north-star:updated YYYY-MM-DD -->

> Rewrite **in place** this section when the model changes (don't accumulate: the
> history lives in §2). One screenful, readable in 30 seconds. `[PDR-NNN]` points back to the
> pivot that led there.

- **Who we serve** — _(the target customer / user segment)_ `[PDR-NNN]`
- **Product** — _(what we offer, in one sentence)_ `[PDR-NNN]`
- **How we acquire** — _(the acquisition channels / motions)_ `[PDR-NNN]`
- **How we operate** — _(what headcount/structure, how we deliver)_ `[PDR-NNN]`
- **How we monetize** — _(revenue model, price, key unit economics)_ `[PDR-NNN]`
- **What we do NOT do (today)** — _(explicit scope-outs: what we deliberately refuse)_
- **Under exploration (open touch-point, NOT yet a PDR)** — _(possible undecided pivots; when one is decided → it becomes a PDR)_
- **Hard constraints** — _(legal / resource / timing constraints that bind the choices)_

**Implementation status** → in `STATE.md` (living SSOT of the work). Here only *where we're going*, not *where we are*.

---

## 2. Pivot log (append-only)

> One entry per **macro pivot** (see the criterion in §3). **It is never deleted**: an
> abandoned pivot is marked `state: abandoned`, it doesn't disappear — the history of
> "why we didn't do it" is worth as much as the "why we did". The entries are called
> **PDR** (Product Direction Record), twins of ADRs but for product/business.
>
> **Header line format (respect it: the sentinel reads it):**
> `### PDR-NNN — Title · state: <token> · YYYY-MM-DD`
> State tokens: `idea` · `decided` · `propagating` · `propagated` · `abandoned`.
> Inside each entry, the checkboxes `- [ ]`/`- [x]` exist **only** under `**Propagation**`.

**Skeleton of a PDR entry** — copy it OUTSIDE the block and fill it. It's in a fence on purpose: so the `direction:check` sentinel doesn't read it as a real entry (and doesn't auto-flag on the empty template).

```markdown
### PDR-001 — _(Title of the pivot)_ · state: idea · 2026-01-15

**What changes** — _(the pivot in 2-4 lines: from what to what)._

**Why** — _(the underlying reason: what forced/enabled it)._

**Open (undecided)** — _(the loose ends still to untie: timing, budget, external go-aheads, ADRs still to write)._

**Makes stale** (touch-points) — see Propagation.

**Propagation**
- [ ] `DIRECTION.md` north-star §1 — reflects the pivot + bump `north-star:updated`
- [ ] _(ADR touched)_ — banner `<!-- direction:stale PDR-001 -->` + human line added
- [ ] _(CLAUDE.md / onboarding)_ — reworded
- [ ] _(memory / other docs)_ — annotated
- [ ] **ADR generated** (if the pivot requires it) — to write, with back-ref `[PDR-001]`

**References** — _(thinking-doc, conversation, review that produced the pivot)._
```

---

## 3. Propagation rule (the habit that keeps the system honest)

A pivot that stays in your head or in a thinking-doc **is not propagated**: the plan-documents
keep lying. The discipline, in 4 steps:

1. **Update the north-star** (§1) in place + bump `<!-- north-star:updated YYYY-MM-DD -->`.
2. **Add a PDR entry** (§2) with the header in the exact format + the `**Propagation**`
   checklist that lists *all* the touch-points (ADR, CLAUDE.md, memory, roadmap…).
3. **Flag the ADRs touched**: in the ADR file add `<!-- direction:stale PDR-NNN -->` + a
   human line `> ⚠️ Assumption revised by PDR-NNN (see docs/DIRECTION.md)`. Tick the box when done.
4. **`{{PKG_MANAGER}} direction:check` must pass** before considering the pivot
   `propagated`. As long as there are open boxes, the sentinel reminds you (warning, doesn't block).

**When to write a PDR** (threshold, twin of the mini-ADR): the pivot touches **2 or more** of
{*who we serve*, *how we acquire*, *how we monetize*, *how we operate/headcount*}, **or**
it invalidates an ADR's assumption. Below this threshold → it's a product detail: it lives in its
thinking-doc or in `implementation/30-reference/inline-decisions.md`, not here.

**PDR vs ADR** — the PDR says *where we're going and why* (product/business); the ADR says *how we
build it* (technical). A product pivot often **generates** an ADR: the PDR lists it as a
touch-point, the ADR is born with a back-reference `[PDR-NNN]`.

---

## 4. How the sentinel checks (`{{PKG_MANAGER}} direction:check`)

The script `scripts/check-coherence.mjs` (pure Node, installs nothing) verifies:

- **Warning (doesn't block, exit 0)** — every PDR `decided`/`propagating` with **open
  touch-points** → it lists them: that's your propagation to-do. And if the north-star is **older**
  than the latest pivot → "the current model may be stale, review it".
- **Error (blocks, exit 1)** — *structural* incoherences: an ADR citing a `direction:stale
  PDR-NNN` that doesn't exist or is `abandoned`; a PDR marked `propagated` but with boxes still open;
  a malformed PDR header. These are traceability bugs, not "strategy not finished".

It runs in `pre-push` in **warning** mode (it reminds you, doesn't stop you) and by hand whenever you want the picture.
