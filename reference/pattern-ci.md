> KIT · [Node-ref] — the 3 observed CI/CD archetypes. Universal patterns; the examples are Node/{{PKG_MANAGER}}, port them to your stack.

# CI/CD patterns — 3 archetypes

Three workflow shapes that cover almost every need of a monorepo driven by {{OPERATOR}}+Claude. The cross-cutting idea: **CI costs money** (runner-minutes, calls to external services, API quota), so every workflow is designed to spend the least and fail fast.

In plain language: CI is the automatic quality check on every push. These three molds say *when* to run, *in what order*, and *what to protect without burning money*.

> **Is CI mandatory?** Only in the **`team`** profile, where it's the shared *required check* on the origin — the one chokepoint no dev can bypass. In **`solo`** (the default) the gate is the **local pre-push**; CI is optional — adopt it when you want the remote safety net, not because the kit demands it. Either way, keep the archetypes below cost-aware: a `push`+`pull_request` trigger runs the full battery on every push *and* every PR. See `../handbook/09-operating-profiles.md`.

---

## Archetype 1 — Main CI, increasing cost

Runs on `push` and `pull_request` to the main branch. It's the guardian of every change.

### Behavior spec

**a) Cancel-in-progress concurrency**
```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```
Consecutive pushes on the same ref cancel the previous run: you only pay for the last one. (See archetype 3 for the opposite case on deploys.)

**b) Parallel, decoupled `secret-scan` job**
A standalone job, separate from the heavy job (build/DB), to give fail-fast feedback on leaks without waiting for the rest.
- **Actions pinned by SHA** (not by mobile tag): `uses: actions/checkout@<sha40> # v6.0.2`. A tag like `@v6` can be re-pointed by an attacker; a SHA can't.
- **Self-check**: before scanning the repo, the job injects a FAKE non-allowlisted secret and verifies the scanner catches it. If it doesn't, the scanner is broken/misconfigured and the job fails immediately.
  ```bash
  # Example — the fake leak MUST be detected, otherwise exit 1
  echo "<FAKE-CREDENTIAL-NON-ALLOWLISTED>" > /tmp/fake-leak.txt
  if scanner dir /tmp --exit-code 1; then
    echo "self-check FAILED: the scanner did not detect the fake leak" >&2
    exit 1
  fi
  ```
- **Trigger-adaptive scan**: on PR it scans *only* the PR commits' diff (fast); on push it scans the whole working tree. On PR you need `fetch-depth: 0` + checkout of the real `head.sha` and an explicit `fetch` of the base SHA, otherwise the `base..head` range doesn't resolve on the runner.

In plain language: a dedicated job that looks for passwords/keys accidentally left in the code. It first self-tests with a fake key (if it's not found, the alarm goes off), then it looks only at changed lines (fast) or everything (on push).

**c) Step order = increasing cost (fail-fast ON SPEND)**
In a single job, if a step fails the following steps don't run → you only pay for the elapsed time. So: **cheap-and-fails-often first, expensive-and-rare last.**
```
lint → domain guard → type-check → doc build (smoke) → DB bootstrap → migrations → test → heavy build (LAST)
```
- Expensive setups (e.g. DB bootstrap) come *after* the cheap steps: a lint failure no longer pays for the DB setup.
- The most expensive build (e.g. a standalone artifact, ~minutes) is at the bottom: it only runs if everything else is green.

In plain language: put the fast checks that break often first (formatting, types), and the slow, stable ones last. That way, when something breaks, the machine stops right away and doesn't waste minutes.

**d) Env-aware build cache**
Cache of the incremental build directory (e.g. `.turbo`), with a per-SHA key and prefix `restore-keys` to fetch the most recent cache.
- The build tool's key must capture `src + test + deps + env`. **Sources outside `src/`** that change a critical invariant (e.g. a migration/policy file living outside `src/`) **must be declared as a global cache dependency**, otherwise you risk a *false green*: you change a critical policy, the cache doesn't invalidate, the test passes by inertia.
- The build tool must never cache a FAILED task → no poisoning from red runs.

In plain language: work already done on unchanged packages gets reused (much faster CI). But watch out: if a security rule lives in a file the cache ignores, you might see "green" even after breaking it. It has to be declared explicitly.

**e) Smoke on real artifact + assert by observation**
After the build, assertions on the real output (file exists, minimum size, expected content). Don't assume the output's shape: actually look at it (see `../scaffold/docs/implementation/20-discipline/01-tdd-discipline.md`).

---

## Archetype 2 — External-call smoke (on-demand only, secret-gated)

For tests that make **real calls to paid services** (metered APIs, external providers). The calls cost money → this workflow does NOT run on push/PR.

### Behavior spec

**a) Manual trigger only**
```yaml
on:
  workflow_dispatch:
```
No scheduling, no automation: you run it by hand (post-SDK-upgrade, pre-release, debugging). That way you don't burn quota on every commit.

**b) Secret-gate with clean skip**
First step: if the required secret is missing (fork PR, incomplete setup), it emits a `::warning::` and sets `skip=true`; every following step has `if: steps.gate.outputs.skip != 'true'`. The workflow ends GREEN without doing anything, instead of failing confusingly.

**c) Masking secrets decrypted at runtime**
If secrets arrive encrypted (e.g. SOPS/age) and get decrypted on the runner, **every value must be masked** (`::add-mask::<value>`) before landing in the environment, so it never shows up in the logs.
```
decrypt → for each KEY=value: ::add-mask::value + append to $GITHUB_ENV (multiline-safe heredoc)
```

In plain language: some tests call services that charge per call. This check is run by hand only when needed, skips silently if keys are missing, and hides the keys from the logs.

---

## Archetype 3 — Path-filtered deploy with gate

For publishing an artifact (edge worker, service) to production.

### Behavior spec

**a) Path-filtered trigger**
```yaml
on:
  push:
    branches: [main]
    paths:
      - '<path/to/the/service>/**'
      - '.github/workflows/<this-workflow>.yml'
  workflow_dispatch:
```
The deploy only starts if that service's code changes (or the workflow itself). Never on PR: no preview deploys.

**b) Concurrency `cancel-in-progress: false`**
```yaml
concurrency:
  group: <service>-deploy
  cancel-in-progress: false
```
**Opposite of archetype 1.** An in-progress deploy must NOT be cancelled halfway through (it would leave state half-done): deploys queue up and complete serially.

**c) Typecheck + test gate BEFORE the deploy**
```
checkout → setup → install (this service only) → typecheck → test → deploy
```
It only publishes if typecheck and tests pass. The install is restricted to just the service's package for speed.

**d) Documented rollback**
In the header comment: rollback = re-run a previous workflow OR re-deploy the previous SHA.

In plain language: it publishes only when *that* service changes, only after the checks pass, and a deploy is never interrupted halfway (it queues). If it goes wrong, the previous version gets re-published.

---

## Summary: concurrency compared

| Archetype | Trigger | `cancel-in-progress` | Why |
|-----------|---------|----------------------|--------|
| 1 — Main CI | push + PR | `true` | fast pushes cancel each other, you pay for the last one |
| 2 — External smoke | `workflow_dispatch` | (n/a) | runs only by hand, cost per call |
| 3 — Deploy | push:main path-filtered | `false` | serial deploys, never halfway |

See also: `sentinels-and-generators.md` (the guard scripts called from CI) and `../scaffold/.gitleaks.toml` (the secret scanner config).
