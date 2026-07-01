---
title: "01 — TDD discipline (balanced)"
---

> KIT · [agnostic] — "balanced" TDD discipline: what to test BEFORE the code, what alongside, what not at all. + the assert-by-observation rule. Adapt the "Category" column to your codebase.

> **Philosophy**: strict TDD where an untested bug costs a lot (data isolation, payment/event idempotency, append-only invariants); *alongside* tests where the red→green ceremony has low ROI (UI glue, layouts, copy-paste components).

---

## The rule as a matrix

| Code category | Test FIRST? | Type | Notes |
|---|---|---|---|
| Pure business logic (domain functions) | **YES** | unit | Pure functions → red→green→refactor is trivial |
| Validation schemas (input parsing) | **YES** | unit | Edge cases: invalid input, optional, refinement |
| Data isolation helpers (tenant/user scoping) | **YES** | integration with test DB | A query with no context must **fail** (permission error), not silently return zero rows |
| DB-level security policy on a new table | **YES** | integration | "Actor A can't see Actor B's data" and "the bypass role bypasses" |
| Webhook idempotency (external events) | **YES** | integration | Invoking the same event twice → a single INSERT / a single side-effect |
| Append-only log (audit / events) | **YES** | integration | UPDATE/DELETE from the application role must fail |
| Async job retry policy | **YES** | integration | Retry differentiated by error type (transient N times, deterministic 0) |
| Server actions / application handlers | alongside | integration | Smoke test happy path + 1 error case |
| Webhook signature verification | alongside | unit + integration | Malformed signature → rejected before body parsing |
| Component with logic (form, stateful hook) | alongside | component test | Only for non-obvious logic; pure UI is skipped |
| Copy-paste UI components (primitives) | NO | — | Already tested upstream |
| Pure layouts (sidebar, topbar, navbar) | NO | — | Human visual review is enough |
| Page wrappers (binding only) | NO | — | The logic lives in the domain modules |
| Static build output | NO (E2E covers it) | E2E | E2E on critical flows (login, publishing, checkout) |

> In plain language: we write the test **first** when an error there would be serious or costly to discover later (money, mixed-up customer data, duplicate events). For graphics and trivial wiring, just watching it work is enough.

---

## The critical invariants to test BEFORE the code

These are the bugs that, if they reach production, have irreversible or costly consequences. **Never write the code before the test.** Family examples (adapt to your own):

1. **Multi-actor isolation**: a query with no scope context must **fail with a permission error**, not return `[]`. The denial test is the most important one: a silent `[]` hides the hole.
2. **External event idempotency**: processing the same event twice (provider retry) must not produce double side-effects. Protected by a UNIQUE constraint + the test that verifies it.
3. **Append-only audit log**: the application role can insert but **not** modify/delete.
4. **Differentiated retry policy**: transient error → N retries with backoff; deterministic error → 0 retries, fail immediately.
5. **Fail-on-no-context scoping helper**: without the context set, the query fails (doesn't return partial rows).

> For each one: the test is the executable spec. If you don't know how to write the test, you haven't understood the invariant yet.

---

## Reference patterns (reuse, don't reinvent)

The frameworks you use already have battle-tested testing patterns. **Don't reinvent TDD discipline from scratch.** Look at the tests of your ORM, your job runner, your auth library inside `node_modules` or in their repos: they show unit + integration patterns already proven. Reuse them.

- **DB integration**: migrations run **once** in setup; each test uses `BEGIN/ROLLBACK` or an ephemeral schema. Never migrate on every file.
- **Async jobs**: a deterministic runner like `runWorkerOnce()` + mocked sleep, no real waiting.
- **E2E**: on-demand, never in per-commit CI (slow, flaky, real external services). A handful of specs on critical flows.

---

## Setup test environments

| Type | DB | Mock external | Speed |
|---|---|---|---|
| Unit (`*.test`) | none | all | <100ms |
| Integration DB | real {{DB}} (isolated schema) | all except DB | ~500ms |
| Integration job | test {{DB}} + test job runner | external APIs mocked | ~1-3s |
| E2E | full dev stack + browser | none — real services in sandbox | minutes, on-demand |

**Naming convention** (descriptive, a reading aid — not an enforced constraint): `{name}.test` = unit; `{name}.integration.test` = integration; `{table}-isolation.test` = data isolation; `{name}.e2e.spec` = end-to-end. The test runner picks up everything regardless: the suffix is there to make clear *what the file covers*.

---

## Smoke test on external output: observe BEFORE asserting

When the test/CI asserts on a **magic string** generated by a library or external tool (build output, rendered HTML, log lines, deserialized webhook payload), do NOT guess the string from intuition or the theoretical spec. **Local run → observe the real output → THEN write the assert.**

**Example**: an assert on a generated file was looking for `User-agent` (lowercase, per the RFC), but the build tool wrote `User-Agent` (PascalCase). A case-sensitive `grep` would have failed in CI as a surprise. Caught before the commit only because the real output was checked.

**Operating rule**:
1. **Local build/run** of the string's producer.
2. **Cat / inspect** the real output.
3. **Copy-paste** the string into the test (do NOT retype it from memory).
4. If you need to be case-insensitive for forward-compat, use the explicit flag and comment why.

**Twin anti-pattern**: "making the test pass by changing the assertion without asking whether the code is right". Here, the twin: **writing the assertion without looking at the real output**.

---

## Anti-patterns to avoid

| Anti-pattern | Why it's bad | What to do instead |
|---|---|---|
| Mocking the DB in isolation/policy tests | Bugs are often "wrong SQL policy" — the mock hides them | Real DB (ephemeral schema) for integration tests |
| Migrating on every test file | Very slow and fragile | Migration once in setup; `BEGIN/ROLLBACK` per test |
| Tests that depend on execution order | The runner parallelizes non-deterministically | Full setup+teardown per test, no mutable shared state |
| Tests that call real external services | Costly and flaky | Mock with deterministic response fixtures |
| Skipping "it's just glue anyway" without asking if it really is | Complex glue accumulates bugs | >1 branch → at least 1 happy-path test + 1 error test |
| Making the test pass by changing the assertion | "the code is right, the test is wrong" — almost never true | First question: "does the code have a bug?", not "is the test wrong?" |

---

## When to make an exception

You can skip the test-FIRST only if: (1) you're exploring a new API (spike — spike code gets thrown away afterward); (2) the code is *mechanically* equivalent to something already tested (e.g. a new route that reuses the same handler); (3) it's pure UI with no derived state. In every other case: **if you're not sure, write the test first.** It costs 5 minutes and forces you to clarify the API, catches subtle bugs at the first refactor, documents the expected behavior.
