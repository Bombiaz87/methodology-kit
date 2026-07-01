> KIT · [agnostic] — the two operating profiles (`solo` / `team`) and how topology modulates git, enforcement, state, memory, authority, and attribution. Read it when you adopt the kit on a project with more than one dev on the origin.

# 09 · Operating profiles — `solo` vs `team`

The kit was born for **one operator + agent**. But almost all the operational dimensions — how you commit, where state lives, who decides — **change together** when you go from one operator to **N devs on the same origin**. To avoid making the adopter choose seven disconnected knobs (and risk incoherent combinations like *"team, but Board in a single file"*), the kit packages them into **a single axis: operating topology**, with two profiles.

- **`solo`** *(default)* — one operator, one working tree, direct work, local enforcement. It's the kit as described in the rest of the handbook.
- **`team`** — multiple devs, each with their own clone; **the origin is the shared SSOT**, modified by everyone. The *operational shell* changes — not the core of the method.

> **The invariant that does NOT depend on topology.** The knowledge architecture — record-per-duration (PDR/ADR/Journal), dual direction/technical track, living docs, adversarial review, the secrets twin — is **identical** in both profiles. Only the **operating loop** forks. Making the kit team-capable doesn't touch its *why*.

## The profile table

Every row of the `team` profile cites the mechanism it's inspired by (from a comparative analysis of the most widespread AI-dev methods).

| Dimension | `solo` *(default)* | `team` *(shared origin)* | Inspired by |
|---|---|---|---|
| **Git** | direct on `main`, selective staging | branch + PR, `main` protected; selective staging **isn't needed** (the branch isolates) | SuperClaude |
| **Enforcement** | local hooks | **CI = required check** on the origin (the only shared chokepoint); local hooks → optional ergonomics | docs-as-code |
| **Volatile state** | `STATE.md` "In flight" committed | volatile → **tracker** *or* **owner-namespaced** section; **slug keys, never numeric IDs** (they collide on merge); `blockedBy:[slug]` + **circuit-breaker** on stale "In flight" | Task Master + Shape Up |
| **Prose SSOT** | ADR/DIRECTION/JOURNAL in repo | **identical** (append-mostly, low contention) | — |
| **Knowledge / memory** | local `~/.claude`, per-machine | + **committed team layer** in the repo; "**reread-everything**" ritual at handoff; convention→baseline feedback channel | Memory Bank + Agent OS |
| **Authority** | the operator decides | **lightweight RACI**: who owns direction / who ratifies an ADR / who merges | MADR + Shape Up |
| **Attribution** | implicit (1 operator; git is enough) | **every record carries who · where · when** (below) | MADR + Task Master |
| **Review** | adversarial skill (self-review) | **PR peer review** + fresh-context reviewer (sees the diff, not the reasoning) | Awesome Claude Code |
| **Communication** | double layer | per-audience (eng team → "plain language" optional) | — |
| **Onboarding** | light | glossary + risk/debt register (if the team grows) | arc42 |

> **Authority in a small, flat team.** Don't reach for `CODEOWNERS` or per-area owners: when everyone reviews everything there's no real area ownership, so forcing owners is friction, not governance. Keep authority a **one-line convention** — e.g. *"an ADR needs one other dev's ack; anyone merges after one review"*. `CODEOWNERS` + required-reviewer-per-path earns its keep only once the team is big enough for genuine area ownership — **revisit at ≥5** (the same threshold as the extended RACI fields).

## Attribution: who · what · where · when

In `solo` the Journal entry has no author (a single operator; git is enough). In `team` every entry carries **who · what · where · when** — and attribution isn't left to memory (**Axiom 1**): the **post-commit hook** stamps the author in `STATE.last_commit_author`, and the agent fills `{{author}}` in the entry from the git author:

```
### 2026-06-22 · {{author}} · [area: portal/billing]      ← who · when · where
- What: gate edit-on-behalf cross-tenant media              ← what
- Record: ADR-031 (or mini-ADR / —)
- Commit: 91c84bd · PR #123                                ← verifiable
```

This generalizes to the other records: the **ADR** gains `decision-makers` + `consulted`/`informed` (MADR); the **Board "In flight"** gains an `owner` field. Honest note: git *already* carries author+timestamp on the commit — the record's added value is the **`who` + `area` readable at a glance**, without `git blame` archaeology, because in prose the entry can be appended by the agent *on behalf of* a dev.

## How the profiles are embodied (for scaffold maintainers)

The scaffold carries **both** variants in the few points where they diverge (the git section of `CLAUDE.md`, the Journal entry schema, the enforcement block), marked with explicit zones:

```
<!-- profile:solo -->
… solo-operator variant …
<!-- /profile:solo -->
<!-- profile:team -->
… team variant …
<!-- /profile:team -->
```

**Step 4 of the Adoption Protocol** (`00-START-HERE.md`) asks *"topology: solo or team?"* first, and the agent **prunes** the variant not chosen before writing. If there's no answer, `solo` wins.

> **In plain language.** A single knob — "solo" or "team" — switches on the right set of coherent rules, instead of making you answer seven disconnected questions and risk a half-assembled machine.

## What is DELIBERATELY out of the `team` profile

To avoid bloating the kit (Axiom 2: proportionate record, no over-engineering), the `team` profile **does not** import: BMAD's full role-personas, Shape Up's betting-table and fixed cycles, the 3-level `customize.toml` merge, the `AGENTS.md` roster, the Sync-Impact-Report, SuperClaude's rule-priority hierarchy. These are heavier than a small team on a shared origin pays back. It also **documents** rather than ships three things: the conflict-safe *state machinery* (the small-team fix is the one-line `STATE_AUTOSTAMP=off` opt-out + a tracker for volatile state — see `04-living-state-machine.md`; the heavier per-owner Board / tracker integration is ≥5 territory); a **commit-count drift sentinel** (*"N commits since the Board's `last_commit` was stamped, but `focus`/`next` untouched"*) — a more precise signal than the calendar-day staleness-guard, but it belongs to the same ≥5 bucket: for a solo operator the advisory `Stop` hook (`07-claude-harness.md` §9) already covers the same signal in-session; and a **committed team-memory layer** (durable team facts get *promoted to a convention/ADR* — which the repo already versions — rather than a second store). **Revisit at team ≥ ~5** (the same threshold MADR indicates for extended RACI fields).

## From here

- **The operating loop the profiles modulate** → `01-operating-model.md`
- **The Board and its synchrony** (where attribution and circuit-breaker bite) → `04-living-state-machine.md`
- **Hooks and CI** (where `team` shifts enforcement) → `08-quality-automation.md`
