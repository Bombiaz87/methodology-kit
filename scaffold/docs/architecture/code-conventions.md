---
title: "{{PROJECT}} — Code conventions (by-feature organization)"
---

> KIT · [agnostic] — "by feature" code organization manual (modular monolith). Examples are labeled "Example" and kept neutral: translate them into your {{STACK}}. The golden rule holds outside JS/TS too.

Operating manual for organizing {{PROJECT}}'s code. Read it **before writing the
first module** and consult it whenever you create a new feature.

> Reference pattern: **"by feature" organization** (one domain = one folder). See the ADR
> that formalizes it (e.g. `decisions/00X-application-architecture.md`).

> **In plain language.** The code is organized by *what it does in the business* (one folder for
> "orders", one for "users"), not by *file type* (all components together, all queries
> together). That way, when you work on a feature, you have everything in one folder.

---

## Philosophy in 4 sentences

1. **One business domain = one module = one folder.** Everything about "X" lives in `modules/X/`.
2. **Modules are black boxes.** They expose a public API (an explicit entry point), the rest is private.
3. **`shared/` is the holy grail.** Only genuinely cross-cutting things (base UI, pure utilities, global types). Resist the temptation to dump domain stuff in there.
4. **A module never imports directly from inside another module.** Only from its public API.

---

## Golden rule (holds in any stack)

> **"If I delete this module, does this file have to disappear too?"**
> **Yes** → it goes inside `modules/{x}/`. **No** (other things need it too) → it goes in `shared/`.

This test resolves 90% of the "where do I put it?" doubts.

---

## Standard module structure

```
modules/{module-name}/
├── index.*            ← Explicit public API (what leaves the module)
├── data/              ← Data access (queries / repositories)
├── domain/            ← Pure business logic (zero framework) + types + validation
├── api/               ← Use cases: handlers, server actions, webhooks
├── ui/                ← Presentation (components / views), if applicable
└── tests/             ← The module's tests
```

**What goes where**

| Folder | Contains | Does NOT contain |
|----------|----------|--------------|
| `data/` | reading/writing the data source | business rules, validation, UI |
| `domain/` | types, validation schemas, pure rules (testable in isolation) | DB access, framework, network |
| `api/` | coordinates validation + business + data (the "use case") | presentation logic |
| `ui/` | presentation; imports types from `domain/`, actions from `api/` | direct data access |
| `tests/` | unit tests on `domain/` (fast), integration on `api/` | — |

**Public API.** `index.*` exposes **only** what other modules need to use (typically 10-30
lines). If it grows a lot, that's a "god module" signal → split it.

---

## Import rules (allow / forbid)

**✅ Allowed**
- Inside a module: import from any of its subfolders.
- From `shared/`: cross-cutting utilities/UI/types.
- From **another module**: ONLY via its public API (`@/modules/X`, never `@/modules/X/data/...`).
- From a shared package of the project.

**🚫 Forbidden**
- Importing the **inside** of another module (`@/modules/X/data/...`) → coupling to the implementation: if that module refactors `data/`, your code breaks.
- Putting domain-specific things in `shared/` (e.g. `shared/lib/orders-utils.*`) → it belongs in `modules/orders/`.

> **Enforcement.** At the start, with a small team: **discipline + code review**. When the team
> grows (4-5 people): add a boundary linter (short operation, zero migration).

---

## Naming conventions

| Thing | Convention | Example |
|------|-------------|---------|
| Folders | `kebab-case` | `modules/customer-portal/` |
| Source files | `kebab-case` | `order.repository.*` |
| Types / classes | `PascalCase` | `type Order`, `class OrderService` |
| Functions / variables | `camelCase` | `findOrderById` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_ITEMS_PER_PAGE` |
| Validation schema | `{Name}Schema` | `CreateOrderSchema` |
| Data tables | plural `snake_case` | `orders`, `audit_log` |
| Data columns | `snake_case` | `created_at`, `owner_id` |

> Adapt the rows to your {{STACK}}'s idiomatic conventions (e.g. `snake_case` for files in
> Python). The principle — **consistency, one rule per category** — doesn't change.

---

## Walkthrough: creating a new module from scratch

*Example* — adding the `reviews` module.

1. **Create the structure** — folder `modules/reviews/` with `data/ domain/ api/ ui/ tests/` + `index.*`.
2. **Define types and validation** in `domain/` (the shape of the data + the rules).
3. **Add the data schema** (tables/migrations) wherever the project's schemas live.
4. **Repository** in `data/` — queries only, no rules.
5. **Use case** in `api/` — validates the input (schema from `domain/`) → calls `data/`.
6. **UI** in `ui/` (if needed) — calls the use case, receives data via parameters.
7. **Public API** in `index.*` — exports only what's needed outside.
8. **Wire it up to the app's routing/entrypoint**.
9. **Test** in `tests/` — at least one, even minimal.

**Checklist before the module's first commit**
- [ ] folder with standard subfolders;
- [ ] `index.*` exposes only the essentials;
- [ ] at least 1 function in `data/`, 1 schema in `domain/`, 1 use case in `api/`;
- [ ] UI wired to routing (if applicable);
- [ ] at least 1 test;
- [ ] no imports from inside other modules.

---

## When to create a new module

**✅ Create a module if:** it's a **distinct business domain** with a clear name; it has **2-3 related
data entities**; it has **its own logic** (rules, state transitions); you'd **naturally mention it**
in a product conversation.

**❌ Don't create a module if:** it's "just another entity type" with no logic of its own (extend an
existing module); it's a utility (→ `shared/lib/`); it's a generic UI component (→ `shared/ui/`); it's a
wrapper around an external service with no domain logic (→ `shared/integrations/{provider}/`).

**When in doubt:** start by putting it in the "closest" module. Extract a new module only when the
code grows and struggles to fit there. It's easier to move code out than to invent premature modules.

---

## Anti-patterns (what NOT to do)

| Anti-pattern | Why it's bad | What to do instead |
|--------------|---------------|------------------|
| Importing from `@/modules/X/data/Y` | bypasses the public API, deep coupling | import from `@/modules/X` |
| Business logic in the routing/entrypoint file | "fat" routing, not reusable | move it to `modules/{x}/api/` or `domain/` |
| `shared/lib/{domain}-utils.*` | `shared/` turns into soup | move it to `modules/{x}/` |
| UI component with direct data access | mixes presentation and data | UI calls a use case, receives data via parameters |
| Repository that does validation | mixes data and domain | validation in `domain/`, repository does ONLY queries |
| Module with a single minimal entity | complexity with no payoff | fold it into a related module |

---

## Cross-app: same pattern everywhere

If the project has multiple apps, use the **same layout** (`modules/`, `shared/`, rules) in all of
them: whoever hops between apps finds the same mental model, near-zero onboarding. Modules **specific
to one app** live in that app; those **shared across apps** live in a shared package of the project.

---

## When a module grows too big

Symptoms: 10+ data entities, a 100+ line public API, tests multiplying, hard to navigate.
Strategies in order (each step is **reversible**):
1. split into internal subfolders;
2. extract a separate module (if the boundaries are clear);
3. extract into a shared package (if used by multiple apps);
4. extract into a separate service (if it has its own runtime).
