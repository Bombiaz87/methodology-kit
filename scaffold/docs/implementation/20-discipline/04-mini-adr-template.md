---
title: "04 — Mini-ADR (template + criteria)"
---

> KIT · [agnostic] — when a decision deserves a mini-ADR vs a full ADR (3 binary questions) + verbatim template + example + promotion path. Applies wherever you keep architectural decisions in files.

> The mini-ADR is a valid record level in **continuous flow**: an implementation decision emerging during an Intervention, local and non-binding for the rest of the architecture. The threshold (the 3 questions) decides whether a mini-ADR is enough or a full ADR is needed.

**Key difference**:
- **Architectural ADR** (`docs/architecture/decisions/`) → binds the whole architecture, survives over time, is the SSOT of a technical decision.
- **Mini-ADR** → applies locally to its context/Intervention, is not a cross-cutting constraint.

---

## When to create a mini-ADR (3 binary questions)

1. **Does it touch more than one package or app?** → architectural
2. **Does it change a public interface** (package export, exposed data schema, URL route)? → architectural
3. **Does it survive as a constraint** beyond the context it was born in (does it apply afterward too)? → architectural

| "Yes" answers | Decision |
|---|---|
| 0/3 | local **mini-ADR** |
| 1/3 | **mini-ADR** with `propagation_risk: review` flag in frontmatter |
| 2/3+ | full **architectural ADR** |

> In plain language: if the choice stays confined and no other piece has to adapt, a short note is enough (mini-ADR). If instead it "forces" the rest of the system to comply, it should be written as a real architectural decision, visible to everyone.

> This criterion is the **twin** of the one for PDRs (product/business pivots): same logic "2+ axes touched ⇒ promote to the higher level".

---

## Application examples

### A — mini-ADR (0/3)
**Decision**: we'll use a certain ID format for table PKs.
- Touches more than one package? NO. · Changes a public interface? NO (the ID is opaque). · Survives as a cross-context constraint? NO.
→ **local mini-ADR**.

### B — mini-ADR with review flag (1/3)
**Decision**: in integration tests we use a real containerized DB instead of an in-memory fake (which has bugs on policies).
- More than one package? NO. · Public interface? NO. · **Survives as a constraint? YES** (applies to all future tests).
→ 1/3 → **mini-ADR with `propagation_risk: review`**. To be promoted if it shows it constrains choices elsewhere.

### C — promotion to ADR (3/3)
**Decision**: error codes follow a `PREFIX-{module}-{NNN}` format exposed via API + log.
- More than one package? YES. · Public interface? YES. · Permanent constraint? YES.
→ 3/3 → it's born directly as an **architectural ADR**, not as a mini-ADR.

---

## Mini-ADR template

```markdown
---
id: {NNNN}                 # internal numbering (4 digits)
slug: short-kebab-case-name
date: YYYY-MM-DD
status: accepted           # accepted | superseded | reverted
propagation_risk: low      # low | review | high
relates_to_adr: ["003"]    # architectural ADRs touched (if applicable)
---

# Mini-ADR {NNNN} — {title}

## Context
[2-4 lines: what we were doing, why we found ourselves deciding]

## Decision
[1-3 lines: what we decided]

**Out of scope** (optional, 1 line — what the decision explicitly does NOT cover, to cut scope-creep. Omit if obvious.):

**Product impact** (optional, ONLY if it has a visible effect on customer/cost/UX/scalability):
[1-2 lines in PM-readable language. If it's pure invisible plumbing, OMIT this line — don't fill it with empty sentences.]

## Rationale
- Reason 1
- Reason 2

## Alternatives considered
- **Alt 1**: dropped because [...]
- **Alt 2**: dropped because [...]

## Consequences
- ➕ [positive]
- ➖ [negative]

## Confirmation (how it's verified)
[1 line — how we know it's really implemented: test, sentinel, smoke by observation. E.g. "covered by `foo.test`" or "manual verification, guardrail to be built". Omit if pure plumbing with no invariant to protect.]

## When to promote to an architectural ADR
[Criteria: if another context depends on this decision → promote; if other packages need to conform → promote]
```

---

## Filled-in example

```markdown
---
id: 0001
slug: id-strategy
date: YYYY-MM-DD
status: accepted
propagation_risk: low
relates_to_adr: ["003"]
---

# Mini-ADR 0001 — Table ID strategy

## Context
While setting up the data schema, we find ourselves deciding the PK ID format. The base ADR doesn't specify it (left to the implementation).

## Decision
We'll use a compact, URL-safe, lexicographically sortable ID format for all PKs.

**Product impact**: the customer sees nothing different, but public URLs (tokens, links) are cleaner and DB indexes slightly smaller (irrelevant at small scale, useful at large scale).

## Rationale
- URL-safe → no weird characters in links.
- Compact → smaller indexes.
- Sortable → cursor pagination without an extra column.

## Alternatives considered
- **UUID v4**: dropped because it's not sortable.
- **Serial bigint**: dropped because it reveals volume and creates lock contention.

## Consequences
- ➕ URL-safe IDs everywhere.
- ➖ App-side generation instead of DB-side (negligible difference).

## When to promote to an architectural ADR
If the need for domain-differentiated ID formats emerges (prefixed style), the decision becomes structural and gets promoted.
```

---

## Promotion path (mini-ADR → architectural ADR)

If a mini-ADR proves binding for the rest of the system:
1. Identify the next free ADR number.
2. Move the file to `docs/architecture/decisions/{NNN}-{slug}.md`.
3. Adapt it to the full ADR template (Status / Context / Decision / Rationale / Consequences / Alternatives / When to reconsider / References).
4. Add the entry to the status table in `docs/architecture/README.md`.
5. Leave a breadcrumb where the mini-ADR used to be ("Promoted to ADR NNN on DD/MM, see ...").
6. Update cross-references.

---

## Anti-patterns

| Anti-pattern | Why it's bad | What to do instead |
|---|---|---|
| Mini-ADR for every micro-choice (variable name) | Inflation → nobody reads them | Only decisions with an interesting rationale |
| Mini-ADR with no alternatives | Looks like a random decision | Always 2-3 alternatives, even brief ones |
| Architectural ADR disguised as a mini-ADR (3/3 yes) | Important decision hidden, discovered late | Promote to a full ADR right away |
| Changing a mini-ADR without superseding it | History lost | New record with `supersedes:`, the old one becomes `status: superseded` |
