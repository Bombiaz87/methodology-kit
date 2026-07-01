> KIT · [agnostic] — the periodic anti-drift audit ritual, as a reusable template. Adapt names/areas to your {{PROJECT}}.

# Template: periodic anti-drift audit

## What it's for

Warning-only sentinels (see `sentinels-and-generators.md`) and the handoff discipline (see `../scaffold/docs/implementation/20-discipline/03-handoff-protocol.md`) **aren't enough on their own**: by design they don't block work, so drift accumulates silently. The periodic audit is the ritual that **recaptures accumulated drift** once the soft defenses have let something through.

The key point — and the reason this ritual exists:
1. **The sentinel is warning-only** → a push can go through with open propagation touch-points.
2. **The handoff can be skipped** → STATE/JOURNAL/maps stay stuck on old sessions.
3. **The propagation checklists themselves can be INCOMPLETE** → and this is the sneaky danger: the checklist looks "almost done" but never listed half the files to touch. A decision marked "propagated" can be hiding files still stuck on the old model.

In plain language: automatic alarms are deliberately gentle (they don't block you, so as not to slow you down). But "gentle" means that, session after session, the documentation and the code can drift away from reality without anyone noticing. The audit is the periodic deep-clean that brings everything back in sync — and it's the only moment you discover that a "completed" checklist was actually incomplete.

> **The most serious risk isn't cosmetic drift** (a stale README). It's when drift hides a **compliance/security risk**: Example — a strategic decision bans a certain practice, but the "official" onboarding documents still contain the operational instructions for doing it. A new contributor (human or agent) would be instructed to do exactly the forbidden thing. The audit is what catches these connections that a single check doesn't see.

---

## How it's done

### Throwaway folder `_audit-<date>/`

Create `docs/_audit-<YYYY-MM-DD>/`. It's **ephemeral**: once the fixes are applied, delete it. It doesn't pollute the living documentation.

### Partition by area

One report per documentation/code area (`area-01-...md`, `area-02-...md`, ...). Each area is audited in isolation by a reviewer (human, or one agent per area, fanned out). Define the **scope** (what's in) and the **excluded** (e.g. historical/archive records, which aren't audited).

### Root-cause synthesis

A `00-SUMMARY.md` file that **links** the area reports and collapses the findings into a handful of **root causes**. The value isn't the list of findings, but:
- grouping N findings into a few mechanical causes ("70% collapses into 4 batches");
- surfacing the **cross-area connections** that no single report sees (that's where the serious risk hides);
- separating **fixes** (applicable right away) from **decisions** (need the operator, aren't fixes).

In plain language: don't hand over a list of 38 problems. Hand over "there are 5 causes, 2 of them urgent because they touch compliance, and 4 batches of mechanical fixes that close 30 of them; the other 2 things you have to decide yourself."

---

## Skeleton — `00-SUMMARY.md`

```markdown
# Audit docs/ — SUMMARY (<YYYY-MM-DD>)

> Synthesis linking the N area reports (`area-01`…`area-NN`). Throwaway folder:
> once the fixes are done, `docs/_audit-<date>/` can be deleted.
>
> **Scope audited**: <areas included>. **Excluded**: <historical/archive records>.

---

## TL;DR — the diagnosis in one sentence
<one sentence: what's the real problem. E.g. "there's almost nothing to delete,
there's stuff to propagate and date">

---

## Root causes (each branches into multiple areas)

### 🔴 RC-1 — <cause title> [touches X of N areas]
<description> + table | Area | Where it shows up |

> ⚠️ **The connection the single report doesn't see:** <the cross-area risk —
> typically the most urgent, e.g. compliance/security>

> **The anti-drift system exists but was ignored:** <the sentinel is warning-only;
> the propagation checklists are incomplete; this audit IS the completed checklist>

### 🟠 RC-2 — <...>
### 🟡 RC-3 — <...>

---

## Other isolated findings (outside the root causes)
- 🔴 <quick fix, high risk>
- 🟠 <...>

---

## Action plan — N batches + M decisions
> Estimate: the batches close ~X of ~Y findings. The first 2 are 70% of the value.

### Batch A — <the most important/urgent>
### Batch B — <handoff + map regeneration>
### Batch C — <navigability: indexes/READMEs>
### Batch D — <quick isolated fixes>

### 🟡 Decisions that need the OPERATOR (not fixes, choices)
1. <open choice blocking a root cause>

---

## Index of area reports
- `area-01-<name>.md` — <one line>
- `area-02-<name>.md` — <one line>
```

---

## Skeleton — area report `area-NN-<name>.md`

```markdown
# Audit area NN — <area name> (<YYYY-MM-DD>)

**Scope**: <which files/folders>. **Excluded**: <...>.

## Findings
| # | Sev | File | Finding | Root cause | Proposed fix |
|---|-----|------|---------|--------------|--------------|
| 1 | 🔴 | `<path>` | <what's misaligned> | RC-1 | <action> |
| 2 | 🟠 | `<path>` | <...> | RC-3 | <...> |

## Connection notes
<any links to findings in OTHER areas — the summary will use these for the root causes>

## Nothing to delete / archive
<distinguish: stale-needs-updating vs actually-obsolete-to-remove>
```

---

## Severity (shared legend)

| | Meaning | Typical action |
|---|---|---|
| 🔴 | real risk (compliance/security) or wrong fact propagated everywhere | before any sharing |
| 🟠 | substantial but not dangerous misalignment | in the propagation batch |
| 🟡 | navigability noise (stale indexes/READMEs, "draft" tense) | what makes everything *look* confusing |

> Method note: the perceived "nothing makes sense" often doesn't come from serious problems (🔴, rare) but from 🟡 noise (stale READMEs, docs still stuck on "to be decided" when the decision is already made). Dating and updating the indexes gives the biggest perceived relief for the same effort.

---

## When to run it

- After several sessions without disciplined handoff (the tell: STATE/JOURNAL point to work already closed).
- After an important strategic decision, to verify it was actually propagated (and that the checklist wasn't incomplete).
- On a periodic cadence (e.g. monthly) as background hygiene.

See also: `sentinels-and-generators.md` (why warning-only lets drift through), `../scaffold/docs/implementation/20-discipline/03-handoff-protocol.md` (the discipline that, when skipped, creates the drift) and `../scaffold/docs/DIRECTION.md` (where the strategic decisions + the propagation checklists live).
