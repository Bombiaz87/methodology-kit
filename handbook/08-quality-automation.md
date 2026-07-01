> KIT · [agnostic] — the quality automation backbone: what to run at commit-time, push-time, CI; how to write portable guards; the secrets twin (block + encrypt). Describes the BEHAVIOR, not the stack: bring the same model into yours ({{PKG_MANAGER}}, {{PROCESS_MANAGER}}, any language).

# 08 · Quality automation

This module describes the **expected behavior** of an automation backbone. The examples are in a Node/{{PKG_MANAGER}} stack (it's the one the method was extracted from), but every principle is portable: wherever you see a concrete command, read it as "your equivalent in {{STACK}}".

**In plain language:** these are the safety nets that run on their own when you save, when you publish, and in the cloud. They exist to stop errors, secrets, or regressions from slipping through unnoticed — and to avoid making the PM pay for discipline the machine can enforce for free.

---

## 1. Three timing levels (fast → complete)

The cardinal principle: **the more frequent a check is, the faster it must be.** Never put slow things where the operator suffers them on every gesture.

| Moment | What runs | What does NOT run | Why |
|---|---|---|---|
| **commit-time** (pre-commit) | only the essential and very fast: secret scan on *staged* files | lint, type-check, tests | a commit must stay instant; block only on what's catastrophic (a secret entering git history is nearly irreversible) |
| **push-time** (pre-push) | lint + type-check + **state/direction** guards | **tests** | push is less frequent than commit, it can cost a few seconds; but tests (which require DB/build) stay in CI so they don't block the push |
| **CI** (on push/PR) | **everything**: lint, guards, type-check, build, migrations, tests, smoke | — | it's the only point where you can afford the full cost; it runs on a remote machine, not on the operator's keyboard |

**In plain language:** when you save (commit), the machine only checks that you're not about to publish a password. When you publish (push), it checks code form and document coherence. Only in the cloud (CI) does the full battery run, because it's slow and no one's holding their breath waiting.

<!-- profile:team -->
> **`team` profile.** On a shared origin, **local** hooks aren't enough (per-machine, bypassable): the same checks become **required checks** in CI — the **only shared chokepoint** for all devs. Local hooks remain optional convenience, not the gate. See `09-operating-profiles.md` and the `.github/workflows/ci.yml` scaffold.
<!-- /profile:team -->

*Example* — hook manager declared in the project manifest (`package.json`):

```json
"simple-git-hooks": {
  "pre-commit": "bash scripts/run-gitleaks-precommit.sh",
  "post-commit": "node scripts/update-state.mjs",
  "pre-push": "<lint> && <type-check> && node scripts/check-state-size.mjs && (node scripts/check-coherence.mjs || true)"
}
```

Note: **post-commit** doesn't block anything — here it regenerates the living state machine (see `04-living-state-machine.md`). It's work, not a gate.

---

## 2. Every guard is a simple script, invocable in 3 identical ways

Rule: a guard **doesn't live only in the hook or only in CI**. It's a standalone script, exposed as a **package script**, and it's called *the exact same way* by hand, from a hook, and from CI.

```json
"scripts": {
  "check:<guard-name>": "node scripts/<guard-name>.mjs",
  "check:state-size": "node scripts/check-state-size.mjs",
  "coherence:check":   "node scripts/check-coherence.mjs"
}
```

- by hand: `{{PKG_MANAGER}} run check:<guard-name>`
- in a hook: the same line inside `pre-push`
- in CI: the same line as a step

**In plain language:** if a guard fires in CI and you don't understand why, you must be able to rerun it identically on your terminal and see the same error. No magic hidden inside the cloud pipeline.

---

## 3. Two severities: blocking vs non-blocking nag

Every guard must declare *what kind of brake* it is:

- **Blocking** → `exit 1`. Stops commit / push / CI. Use it for invariants that must NEVER pass (a secret, a security rule violation, a type error).
- **Non-blocking nag** → `exit 0` (or `|| true` at the call-site). Prints a reminder but lets things through. Use it for things you want to remember without blocking the work (e.g. "there are open direction touch-points", see `03-ssot-architecture.md`).

*Example* from `pre-push`: `... && (node scripts/check-coherence.mjs || true)` — the direction sentinel **nags** but doesn't block; lint and type-check **block**.

**In plain language:** some checks are red lights (they stop you), others are sticky notes on the monitor (they remind you of something but let you keep going). Decide consciously which of the two each guard is.

---

## 4. Hook manager inline in the manifest

Git hooks live **inside the project manifest**, not in `.git/hooks/` files that no one versions. A `prepare` script **registers** them at install time.

```json
"scripts": { "prepare": "simple-git-hooks || true" },
"devDependencies": { "simple-git-hooks": "^2.x" }
```

- Versioned in the repo → every clone has the same hooks.
- `|| true` on `prepare` → a failure in hook registration doesn't break the install (e.g. CI where hooks aren't needed).

**In plain language:** hooks are written into the project, so anyone who clones the repo inherits them automatically. No "works on my machine but not yours."

> [Node-ref] Here it's `simple-git-hooks`. In your stack use the equivalent (e.g. a Makefile + `core.hooksPath`, or your package manager's native hook manager). The expected behavior is: **hooks versioned in the repo + registered to a setup command**.

---

## 5. CI in increasing cost order + secret-scan self-check + pinned actions

### 5a. Order = increasing cost (fail-fast on *consumption*)

In a job, a step that fails stops the job: the following steps don't run and you don't pay for them. So: **first what's cheap and fails often; at the bottom what's expensive and rare.**

Reference order (from the real source):

```
lint → static guards → type-check → doc build/light smoke
   → DB bootstrap → migrations → tests → heavy build (last)
```

- lint/type-check are cheap and break often → at the top.
- the heavy build / the stable package that rarely breaks → at the bottom: if something upstream is red, you never pay for the expensive build.
- DB setup sits **before the tests but after lint/type-check**: a lint error should no longer have to pay for the database bootstrap.

**In plain language:** put the fast checks that fail often up front, so when something's broken you find out in 10 seconds instead of after 5 minutes — and you don't waste machine-minutes (= money) on a run that's already doomed.

### 5b. Secret-scan as a parallel job with self-check

The secret-scan is a **separate, parallel job** (fail-fast feedback on leaks, decoupled from the DB and the build). Inside it has a **self-check**: it injects a fake key and verifies the scanner **catches** it.

*Example* (self-check logic):

```bash
# inject a NON-allowlisted fake key into a temp file
echo "<fake-key-not-allowlisted>" > /tmp/fake-leak.txt   # tool:allow
if scanner dir /tmp --exit-code 1; then
  echo "self-check FAILED — the scanner did not detect the fake key" >&2
  exit 1
fi
echo "self-check OK (fake key detected, exit 1 as expected)"
```

> Note: it injects the fake-key into a file **outside the repo** (`/tmp`), so the project config doesn't see it. If instead the fake key is hard-coded in a **committed** file (e.g. the workflow YAML itself), the scan with the project config will flag it → **that exact string must be allowlisted** in `.gitleaks.toml`, like the other example keys.

**In plain language:** an anti-secrets check that never fires is indistinguishable from a broken one. The self-check deliberately puts a fake password in front of it: if it doesn't see it, we know the guard is broken — not that the repo is clean.

> Watch the shape of the scan: on a PR it scans **only the PR's commits** (diff `base..head`, fast); on a push to the main branch it scans the entire working tree. Checkout depth and the `ref` must be tuned accordingly (a badly resolved git range makes the scanner exit 1 *without* scanning → a silent false green).

### 5c. CI actions pinned by SHA

Every third-party action is **pinned to the commit SHA**, not to a moving tag:

```yaml
uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
```

Same for tools downloaded at runtime: **fixed version** (`scanner v8.21.2`), not "latest".

**In plain language:** a tag like `@v6` can change content under your feet (even due to a supply-chain intrusion). Pinning to the SHA means CI runs *exactly* the code you reviewed, not whatever someone puts in there tomorrow.

---

## 6. Env-aware build cache + data-layer files bust the cache

> **Only if you're a monorepo / multi-package.** A cached task orchestrator (turbo, nx…) makes sense when you have multiple packages that recompile against each other. **If you're a single app, skip this section and `turbo.json` entirely**: you don't need it, the build/test runner you already use is enough. The rest of the chapter (timing, guards, secrets, linter) still applies.

The build cache (e.g. `.turbo`) cuts CI times by reusing results from packages **unchanged** between runs. Two rules to avoid **false greens**:

1. **Env-aware**: the cache hash must include the env vars that change behavior (e.g. `DATABASE_URL`, `NODE_ENV`) and the relevant config files.
2. **Data-layer files bust the cache**: artifacts that do NOT live in `src/**` but change test correctness (e.g. migrations / DDL / security rules living in `.sql` files outside the source) must be declared as **global dependencies**, so a change to them invalidates the entire test cache.

*Example* (build orchestrator config):

```json
{
  "globalDependencies": [".env", ".env.local", "<migrations-dir>/**"],
  "tasks": {
    "test": {
      "inputs": ["src/**", "tests/**", "package.json"],
      "env": ["DATABASE_URL", "NODE_ENV", "LOG_LEVEL"]
    }
  }
}
```

Only **successful** tasks get cached (a failed task isn't cached) → no cache poisoning on red runs. The restore takes the most recent cache by prefix; the save is per-SHA.

**In plain language:** the cache makes CI fly, but if you forget to tell it that an important file (e.g. the database rules) has changed, it reuses an old result and tells you "green" on broken code. For critical files outside the source: declare that changing them throws away the entire test cache.

> [Node-ref] Here the orchestrator is `turbo` + `actions/cache`. The principle is universal: **a cache key that reflects everything that changes the output**, and critical files outside the source must explicitly invalidate it.

---

## 7. The secrets twin: scanner BLOCKS + encryption to COMMIT safely

They're two halves of the same system. Half the system, without the other half, is useless or dangerous.

| Half | Tool (example) | What it does |
|---|---|---|
| **Block** | secret scanner (gitleaks) | prevents a plaintext secret from entering git (commit-time + CI) |
| **Encryption** | SOPS + age | allows you to **commit encrypted secrets** safely: **public** key versioned in the repo, **private** key kept elsewhere |

Why both:
- Scanner only → you have no safe place to keep secrets: they end up outside the repo, in unversioned channels, and get lost / drift.
- Encryption only → nothing stops a plaintext secret (by mistake) from slipping into history.

> **Two scans, two different questions — choose them deliberately.**
> - `gitleaks git` (or `--staged`): *"is the **tracked/committed** content clean?"* → this is the one that goes in **pre-commit + CI** (it's what ends up in git history).
> - `gitleaks dir <path>`: *"is there a plaintext secret **on disk**, even in *gitignored* files?"* → great as a **local audit** (can find a plaintext prod secret in a never-committed `tmp/`), but in hooks/CI it gives false positives on gitignored files. **Do not** use it as the implicit default instead of `git`.
>
> **If the scanner isn't available (e.g. Windows without the binary):** document a **Docker** fallback with a **pinned** image (e.g. `zricethezav/gitleaks:v8.21.2`); on Git Bash you need `MSYS_NO_PATHCONV=1` or the `/repo` bind-mount path gets swallowed. And **deliberately choose the posture**: *hard-block-if-missing* (scanner mandatory) **vs** *warn-if-missing* (because the truly binding net is **CI**, which runs it regardless). The kit defaults to hard-block in pre-commit with a `--no-verify` escape hatch.

### 7a. Scanner allowlist = *documented* false positives

The allowlist isn't a trash bin: every entry has a reason. Typical false positives to allowlist:
- the **encrypted** files themselves (the `ENC[...]` envelope has high entropy → triggers the high-entropy rule);
- **public** keys / integrity hashes (lockfile);
- example strings in documentation and test fixtures (not real secrets, but they satisfy a provider's regex *shape*);
- gitignored files that the filesystem scanner sees anyway (`.env`, build dirs).

*Example* (scanner config):

```toml
[extend]
useDefault = true          # ~150 upstream rules + yours

[allowlist]
regexes = [
  '''<doc-example-key>''',   # example in the documentation, not a real leak
]
paths = [
  '''secrets/.*\.enc\.yaml$''', # encrypted envelopes → expected high entropy
  '''pnpm-lock\.yaml$''',       # integrity hash
  '''\.env$''', '''\.env\.local$''',
]
```

### 7b. Encryption: who encrypts what (creation rules)

The encryption config declares **which public keys encrypt which files**. The **private** keys live outside the repo (password manager / CI secret for deploy / test fixture for the round-trip).

*Example* (encryption rules):

```yaml
creation_rules:
  - path_regex: secrets/dev\.enc\.yaml$
    age: >-
      <test-fixture-public-key>,<operator-public-key>
  # staging/prod → separate recipients (keys of whoever operates in production + CI deploy key)
```

When you add a recipient (e.g. a new team member), you re-encrypt the files with `sops updatekeys` — the content stays, only the envelopes change.

**In plain language:** the scanner is the guard who searches you on the way out so you can't carry a password off in your pocket. Encryption is the safe where you can *keep* passwords at home (in the repo) without risk, because only whoever has the right key can open it. You need both: the guard without a safe leaves you with no secure place; the safe without a guard doesn't stop someone from pocketing one by mistake.

> [Node-ref] Here: `gitleaks` (block) + `SOPS`/`age` (encryption). In your stack pick equivalents, but keep the **two halves**. The kit's placeholder files: `.gitleaks.toml`, `.sops.yaml.example`, `scripts/load-secrets-sops.mjs`, `scripts/run-gitleaks-precommit.sh`.

---

## 8. GUARDS-ARE-TESTED: static guards have unit tests + fixtures

A guard is code like everything else: if it's not tested, it **rots silently** (it stops catching the violations it should catch, and no one notices because it keeps exiting green).

Rule: every static guard **exports pure functions** (parsing/classification separated from the filesystem walk and the `exit`) + has a **unit test with fixtures** (cases that must pass and cases that must fail).

*Example* — structure of a testable guard:

```js
// scripts/<guard-name>.mjs
export function classify(source) { /* pure logic, no I/O */ }
export function checkRepo(rootDir, allowlist) { /* uses classify + walk */ }

import { pathToFileURL } from 'node:url';
function main() { /* reads, prints, decides exit code */ }
// runs ONLY when launched directly (not on test import) — cross-platform comparison
if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
```

```js
// scripts/tests/<guard-name>.test.mjs
import { classify } from '../<guard-name>.mjs';
// POSITIVE fixture: legitimate input → no violation
// NEGATIVE fixture: violating input → violation detected
```

> ⚠️ **Cross-platform footgun — the "launched directly" guard.** The common idiom `` import.meta.url === `file://${process.argv[1]}` `` **doesn't work on Windows**: there `import.meta.url` is `file:///C:/...` (slash) while `` `file://${argv[1]}` `` becomes `file://C:\...` (backslash) → they **never** match → `main()` doesn't start **silently** (exactly the silent rot this chapter wants to avoid: a guard that doesn't run is indistinguishable from one that passes). Use `pathToFileURL(process.argv[1]).href`: it normalizes the path into an identical `file://` URL on every OS.

Bonus from the real source: the guard also detects **stale allowlist entries** (an allowlisted file that no longer exists or no longer violates) → the allowlist trims itself instead of accumulating dead exceptions.

**In plain language:** an automated check that isn't itself put to the test is an alarm that could be unplugged without you knowing. We give it fake "good" and "bad" cases and verify it says yes to the good ones and no to the bad ones. See the templates `scripts/_guard-template.mjs` + `scripts/tests/_guard-template.test.mjs`.

> Note: the guard you saw as an *example* in the source (direct use of the DB accessor outside a scoping function) is a **DOMAIN guard** — it enforces a security rule specific to that project. In the kit we cite it only as a form; you do **not** bring it over as working code. What you bring over is the *pattern*: pure functions + motivated allowlist + stale-entry detection + unit test with fixtures.

---

## 9. A single linter for lint + format — and the `.claude` gotcha

As a rule, it's better to have **a single tool** for lint and formatting (less config, fewer conflicts, no "the formatter fights the linter") — *but see the anti-churn note at the bottom if you already have two that work*. Configure: included files, rules, style (indentation, quotes, trailing commas), overrides for tests.

**Non-negotiable gotcha — EXCLUDE the `.claude` folder from the linter.** The automation/workflow files in there (`.js`) use constructs the linter's standard parser **can't analyze** (e.g. top-level `return`, because the harness executes them as a function body, not as a module). If you don't exclude `.claude`, lint fails on files that are correct in their context.

*Example* (linter config):

```json
{
  "files": {
    "includes": [
      "**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.json",
      "!**/node_modules", "!.claude", "!**/dist", "!**/.next", "!**/coverage"
    ]
  },
  "formatter": { "indentWidth": 2, "lineWidth": 100 },
  "linter": { "rules": { "recommended": true } },
  "overrides": [
    { "includes": ["**/tests/**", "**/*.test.*"],
      "linter": { "rules": { "style": { "noNonNullAssertion": "off" } } } }
  ]
}
```

**In plain language:** a single tool that does both "spelling" (format) and "grammar" (lint) of the code. But the Claude harness folder must be left out: those files are deliberately written in a way a normal linter would interpret as an error.

> [Node-ref] Here the single linter is `Biome`. **If you already have a working lint+format setup (even with two tools, e.g. ESLint+Prettier), do NOT change it: it would be churn at zero-benefit risk.** The invariant is *"format-drift is an error in CI"*, not *"a single tool"*. What you always bring over, whatever your linter is, is the gotcha: **exclude `.claude`** from its scan.

---

## Adoption checklist

- [ ] Three timing levels configured (fast commit / medium push / full CI).
- [ ] Every guard is a package script, invocable identically by hand/hook/CI.
- [ ] Every guard declares its severity (blocking `exit 1` vs nag `|| true`).
- [ ] Hooks versioned in the manifest + registered to `prepare`/setup.
- [ ] CI ordered by increasing cost; secret-scan with self-check; actions pinned by SHA.
- [ ] Env-aware build cache; data-layer files declared as cache-busters.
- [ ] Complete secrets twin: scanner (block) **+** encryption (safe commit).
- [ ] Every static guard: pure functions + unit test + fixtures + stale-allowlist detection.
- [ ] A single linter for lint+format, with `.claude` excluded.

**See also:** `06-engineering-practices.md` (TDD and test discipline), `07-claude-harness.md` (why `.claude` is special), `reference/pattern-ci.md` and `reference/sentinels-and-generators.md` (practical detail on guards, sentinels, and generators).
