---
title: "Glossary — domain terms and codebase aliases"
---

> KIT · [agnostic] — a dictionary that translates code jargon ↔ product jargon, so whoever
> joins (a co-founder, a new hire, a new agent chat) doesn't mix up ambiguous terms.
> One line per term: meaning + what it's called elsewhere + where it lives in the code. **Not**
> architectural documentation (that lives in the ADRs) — it's a dictionary. Replace the examples
> with your domain's terms; keep the **most confusing ones** at the top (usually the multi-tenant
> boundaries and the product↔code aliases).

## Identity & brand

| Term | Meaning | Alias / note |
|---|---|---|
| **{{COMPANY}}** | The legal entity / company. | Often not user-facing. |
| **{{PRODUCT}}** | The product brand shown to the customer. | Everything the customer sees. |

## Security boundaries / multi-tenancy (the most confusing ones)

| Term | Meaning | Alias / note |
|---|---|---|
| **{{primary scope}}** | The main isolation boundary (e.g. organization/account). | ⚠️ don't confuse with the secondary one. |
| **{{secondary scope}}** | The nested boundary (e.g. user/resource under the organization). | |
| **{{scoped access}}** | The data-access wrapper that applies the scope (the correct default). | vs direct access (below). |
| **{{privileged access}}** | The access that bypasses isolation — allowed only in N named cases, ideally enforced by a sentinel. | See `code-conventions.md`. |

## {{Primary domain}} (e.g. pipeline, orders, content…)

| Term | Meaning | Alias / note |
|---|---|---|
| **{{entity 1}}** | … | Table `…`. |
| **{{entity 2}}** | … | … |

---

> **Maintenance.** Add a term when an alias causes **real confusion** (not every
> word). If a term changes meaning in the code, update it **here** as well as in the ADR. Aliases
> that surfaced but weren't written down get extracted with the *discover-standards*
> practice (`code-conventions.md`).
