> KIT · [agnostic] — Engineering practices that hold regardless of stack: calibrated-intensity TDD, assert-by-observation, recon before migrating, validate-the-source, git discipline, adversarial review. Adapt the lines with `{{TOKEN}}` to your project's values.

# 06 — Engineering practices

Six cross-cutting practices. They don't address the *what* to build (domain) but the *how* to build it well: where to spend rigor on tests, how not to get fooled by magic strings, how to move before a refactor, how not to corrupt parallel work with git, when to run code through a hostile eye.

The common thread: **rigor isn't uniform, it's targeted**. It concentrates where an untested bug is costly and eases off where ceremony has low return.

---

## 1. BALANCED-intensity TDD

> **Philosophy**: strict TDD where an untested bug is irreversible or costly; *alongside* tests where the red→green ceremony has low return; no tests where the code is copy-paste already verified upstream.

**In plain language (for the {{OPERATOR}})**: not all code deserves the same amount of testing. Logic that, if it's wrong, loses money or data gets tested BEFORE it's written. The glue between pieces gets tested while you write it. Copy-pasting ready-made components doesn't get tested at all. Writing "test first" on the right code costs 5 minutes and saves hours of debugging.

### The category → test-first? matrix

Adapt the category names to your {{STACK}}; the *classification criterion* is universal.

| Code category | Test FIRST? | Type | Why |
|---|---|---|---|
| **Pure business logic** (pure functions, calculations, domain rules) | **YES** | unit | Deterministic functions → red→green→refactor is trivial |
| **Validation schemas** (input parsing, constraints, refinement) | **YES** | unit | Edge cases: invalid input, optional fields, boundary conditions |
| **Critical invariants** (data isolation, idempotency, append-only, access policy) | **YES** | integration | A bug here is irreversible or costly — see §1.1 |
| **Retry policies / queued jobs** | **YES** | integration | Retry differentiated by error type: must fail at the right number of attempts |
| **Server actions / application handlers** | alongside | integration | Happy-path smoke + 1 error case, while you write |
| **Webhook signature verification** | alongside | unit + integration | Signature in unit, body parsing in integration |
| **UI components with logic** (stateful forms, hooks) | alongside | component test | Only for non-obvious logic; pure UI gets skipped |
| **Route/page wrappers** (binding only) | NO | — | The logic lives in the modules, not here |
| **Copy-paste components** (primitives from a library) | NO | — | Already tested upstream |
| **Pure layout** (sidebar, topbar, navbar) | NO | — | Human visual review is enough |
| **Build output** | NO (e2e covers it) | e2e on-demand | E2E on the 3-5 critical flows, not per-commit |

**Reading rule**: if the function has **more than one branching path**, write at least 1 happy test + 1 error test — even if it "looks like glue code". Complex glue code accumulates silent bugs.

### 1.1 Critical invariants get tested BEFORE the code

These are the bugs that, if they make it to production, have **irreversible or costly** consequences. For these: never write the code before the test. Examples of invariant families (yours depend on the domain):

- **Data isolation**: someone who shouldn't see certain data gets an *error*, not an empty result (an empty set masks the bug — the error exposes it).
- **Idempotency**: processing the same external event twice (a provider's retry) must not produce duplicate side effects. Test: invoke twice → count 1 row.
- **Append-only / audit**: an unprivileged actor attempting UPDATE/DELETE on a log must *fail*.
- **Retry policy**: transient error → N attempts then stop; deterministic error → 0 retries, fail immediately.

> **Generalization note**: the concrete guards for these invariants (e.g. bypassing a DB-level access policy, or an open redirect) are **examples of domain guards** — they need to be written in YOUR project against YOUR risk surface, not copied from a kit. What matters here is the *test pattern*: provoke the violation and demand that it blow up.

### 1.2 Test environment setup

| Type | External dependencies | Indicative speed |
|---|---|---|
| Unit | none (everything mocked) | <100ms/test |
| Integration with {{DB}} | real {{DB}}, isolated schema/transaction | ~hundreds of ms/test |
| Integration with jobs/queue | test {{DB}} + deterministic runner, external APIs mocked | ~seconds/test |
| E2E | full dev stack, real external services | minutes, **on-demand, never per-commit** |

Anti-fragility conventions (apply everywhere):
- **Migrations run once** in setup, then every test in `BEGIN/ROLLBACK` — don't re-run migrations for every file (slow and fragile).
- **No shared mutable state** between tests: the runner parallelizes in non-deterministic order.
- **Never mock what you're testing**: if you're testing a DB-level policy, use the real DB — the mock hides exactly the bug you're looking for.
- **Mock paid/flaky services** (LLM, email, storage): deterministic fixtures, not real calls in tests.

### 1.3 Coverage not gated *(replaceable default)*

> **This is an opinionated default, not an invariant** (see `00-START-HERE.md` → *Invariants vs replaceable defaults*). If your project already gates coverage and is happy with it, **keep your gate**: it's a legitimate choice.

The kit's recommended default: **don't** turn coverage into a CI gate. Rationale: a hard threshold induces *gaming* (tests written for the number, not for the risk); the real gate is **human review + green tests on the critical invariants**.

The tradeoff, honestly:
- **Without a gate** (kit default): no gaming, but it takes human discipline — no machine warns you if a critical area stays uncovered.
- **With a gate** (a valid choice): the machine guarantees a coverage floor, at the price of gaming-risk and a few low-value tests written for the number.

If you measure, consciously pick one of the two; if you don't gate, you can still emit coverage as a **non-blocking artifact**. *Indicative* targets (not constraints): high for domain logic, medium for data, lower for API, minimal for UI, zero on pure layout.

**In plain language**: counting the percentage of tested lines can push you to write useless tests just to bump up the number — that's why, *by default*, the kit doesn't turn it into a gate. But if you already have a coverage gate that gives you confidence, keep it: it's a preference, not a sacred rule.

---

## 2. Assert-by-observation (observe BEFORE asserting)

When a test or CI asserts on a **magic string generated by an external tool/library** (build output, rendered HTML, log lines, deserialized webhook payload, a generated file's format), **don't infer the string from intuition, theoretical spec, or memory**.

**Mandatory procedure**:
1. **Actually run** the string's producer (build, run, directly invoked fixture).
2. **Inspect the real output** (open the file, format the log, examine the JSON).
3. **Copy-paste** the magic string into the assert — don't retype it from memory.
4. If case-insensitivity is needed for forward-compat, make it explicit **and comment why**.

> **Example**: an assert on a generated file was looking for `User-agent: *` (lowercase, per RFC convention). The tool wrote it in PascalCase, `User-Agent: *`. A case-sensitive match would have failed as a surprise in CI. It got caught before the commit only because someone *looked* at the real file. Lesson: inferring from the spec → surprise red CI.

**Twin anti-pattern**: "making the test pass by changing the assertion". When a test fails, the **first** question is "does the code have a bug?", not "is the test wrong?". Changing the assert to force green — convincing yourself that "the code is right, the test is wrong" — is almost always the wrong move. The two anti-patterns are mirror images: one writes the assert without looking at the real output, the other rewrites the assert to hide its failure.

**In plain language**: before writing "the result must be EXACTLY this", run the program and look at what it actually produces. External libraries have quirks of capitalization, spacing, field order that nobody guesses from memory.

---

## 2b. Honesty / anti-sycophancy

Assert-by-observation is the *technical* version of a broader principle: **telling it like it is**. An agent that tells the operator what they want to hear — "yes, great idea", "done, all green" — when the evidence says otherwise is worse than one that makes mistakes: it hides the problem instead of exposing it. Three behavioral directives, to be placed among the charter's CRITICAL rules:

- **Don't go along just to please.** When the evidence contradicts the operator (or a previous statement of yours), **disagree and argue the case** — on the evidence, not under pressure. The PM-operator needs the real opinion to decide; a courtesy "yes" takes information away from them.
- **Honest status.** If tests fail, say so with their real output; if a step was skipped, say so; "done and verified" only gets written **when it's actually been verified by observation**. Never a declared green that hasn't been observed.
- **No chained assumptions.** A conclusion built on three "probably"s is folklore: verify the weak link before moving on.

> **In plain language.** Better an agent that says "this doesn't work and I'm not sure why" than one that agrees with you for a quiet life. Trust is built on honest status, not on enthusiasm.

---

## 3. Recon before migrating (cross-cutting refactoring)

For migrations or refactors that touch an **interconnected machine** (renaming a concept used everywhere, moving a responsibility, changing a global convention): **map the impact BEFORE editing**.

- Search for all occurrences (code **and** supporting assets: docs, config, scripts, automations).
- Draw up the list of touched points and the safe order of changes.
- **Don't rebuild the same bureaucracy under new names**: if you're eliminating a structure, eliminate it — don't clone it under a new name.

**In plain language**: before pulling a thread that runs through the whole house, follow where it goes. Otherwise you tear something in a room you weren't watching.

---

## 4. Validate the source before porting (don't infer from names)

Every time you port or reimplement logic that references an existing system (legacy, third-party library, a service's payload, DB schema), **open the real files** — validation schemas, types, handlers, resolution helpers — **BEFORE** writing a single line.

**Never infer** from: field names, nearby tasks, intuition about "what it should probably be called". This applies to: DB column names, payload shapes between stages, explicit vs. derived options, implicit defaults.

> **Example**: a field was assumed to exist on a schema (`X.hero.layout`) because the name sounded plausible. In reality it didn't exist: the value was resolved elsewhere, via a preset table. The name-based assumption would have produced broken code. The rule that came out of it: ALWAYS read the real schema/type of the fields you consume.

**In plain language**: don't assume what's inside a piece of data just because the name sounds right. Open the real file and read it. Five minutes of reading beats an hour of debugging a field that didn't exist.

---

## 5. Git discipline

Three rules, all motivated by the real working context (multiple sessions, a PM who decides when to commit, minimal branching).

### 5.1 SELECTIVE staging of only the task's files

The {{OPERATOR}} can launch **multiple sessions in the same {{REPO_PATH}} folder**: the working tree is shared. To avoid dragging another session's uncommitted work into your commit, do **targeted staging** of only the task's files:

```
git add <task-file-1> <task-file-2>
```

**Never** `git add -A` nor `git add .`.

**In plain language**: many people work on the same desk at home. Take only your own papers, not the whole pile — otherwise you end up handing in someone else's half-finished work too.

### 5.2 Commit/push only on explicit request

- **No commits** during planning/discussion phases unless the {{OPERATOR}} asks for it.
- **Push only on request**.

### 5.3 Working directly on `main` when the project chooses to

If the project adopts the "work and commit directly on `main`" model, this **overrides the harness default** *"if you're on the main branch, create a branch first"*: no automatic branches, no pass-through PRs. Branch/PR **only if the {{OPERATOR}} explicitly asks for it**.

> This is the **topology** knob (see `09-operating-profiles.md`): `solo` = direct on `main`; `team` (shared origin) = branch→PR + protected `main` — and with it CI-as-gate, attribution, and volatile state on a tracker switch on *together* (even the selective staging from §5.1 stops being necessary: the branch isolates it). Check the {{PROJECT}}'s profile — don't unilaterally impose a git workflow.

---

## 6. Adversarial review + disciplined triage

At the end of a task that touches **sensitive areas** (where a bug is costly: data access, authentication, state-mutating actions, payments/billing, audit-log, schema/migration, files that touch direction/architectural decisions), **propose** an adversarial review **before the commit**. The {{OPERATOR}} confirms whether to run it.

- It's **complementary** to a standard code-review and security-review, not a replacement for them.
- On trivial tasks, **don't** propose it (noise).

**Then: disciplined triage of the findings.** When the review produces more than a couple of findings, **don't** auto-fix the "obvious" warnings and commit on momentum. Route them through a triage:
1. **Judge** each finding (is it valid? does the fix introduce new bugs? is it only resolvable after a dependency?).
2. **Act** one source at a time (fix-now / fix-with-dependency / todo-later / accept-with-rationale).
3. **Checkpoint** with the {{OPERATOR}} and **re-verify** after each fix.
4. Track the decisions; **then** commit.

**In plain language**: before handing over delicate code, have it torn apart by a hostile eye that's only looking for problems. But when ten notes come back, don't fix them in a rush: evaluate them one by one, some get fixed right away, some later, some get accepted with a written reason. The rush to "fix everything and commit" is exactly where new bugs get introduced.

---

## Operational summary

| Practice | Trigger | Move |
|---|---|---|
| Calibrated TDD | writing new code | classify with the matrix → test-first only where needed |
| Critical invariants | touching isolation/idempotency/append-only/retry | test FIRST, provoke the violation |
| Assert-by-observation | asserting on an external tool's string | run → look → copy-paste |
| Recon before migrating | cross-cutting refactoring | map impact (code + assets) before editing |
| Validate the source | porting/consuming existing logic | open the real schema/type, don't infer from names |
| Selective git | about to commit | targeted `git add <file>`, never `-A` |
| Adversarial review | task on a sensitive area | propose review → triage → then commit |

Cross-link: decision discipline → [`02-decision-discipline.md`](02-decision-discipline.md) · operating model → [`01-operating-model.md`](01-operating-model.md) · TDD template → [`../scaffold/docs/implementation/20-discipline/01-tdd-discipline.md`](../scaffold/docs/implementation/20-discipline/01-tdd-discipline.md) · pre-task interview template → [`../scaffold/docs/implementation/20-discipline/02-pre-task-interview.md`](../scaffold/docs/implementation/20-discipline/02-pre-task-interview.md).
