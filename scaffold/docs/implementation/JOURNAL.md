---
title: "Session journal"
---

> KIT · [agnostic] — append-only diary of the sessions. One entry per session, newest-first. Contains the verbatim template + one example entry. Empty the example and write your first entry.

> **Append-only** history of the {{OPERATOR}} + AI work sessions. Each entry = one session (chat). Ordered newest-first. You don't rewrite the past: you add on top.
>
> **Note**: the Journal is largely **reconstructible from `git log --grep`** if an entry is missing for some session — commits are the base truth, the Journal is the narrative of the "why" and the "what emerged". Keep it updated at every {{HANDOFF_CMD}}, but if an entry is skipped it's not a disaster.

---

## Template of an entry (copy + fill)

```markdown
## YYYY-MM-DD — Session: short title [type]

<!-- [type] ∈ feature / fix / hardening / docs / infra / meta-process / planning -->

**{{OPERATOR}} goal**: what was asked at the start of the chat (and any drift that emerged along the way).

**Outcome**: 3-8 lines. What was actually done, what emerged along the road (bugs caught at smoke, false alarms, discoveries from the real code), final state (committed / pushed, CI green / red). Honest about limits and deferrals.

**Decisions that emerged** (each tagged with the target record-level):
- _(decision)_ → record: **JOURNAL-only** | **mini-ADR NNNN** | **ADR NNN** | **PDR-NNN** | **backlog**
- ...

**Records created/updated**: new or touched ADR/PDR/mini-ADR; memory entries; backlog files. "None" if that's the case.

**Commits**: `xxxxxxx` (description) — pushed/local, CI green/red.

**In plain language**: 2-5 lines readable by someone who doesn't write code (see `20-discipline/05-plain-language.md`). What changes seen from outside, any honest limits, any episodes (false alarms, cache, etc.).
```

<!-- profile:team -->
> **`team` profile.** The entry header carries the **attribution**: `## YYYY-MM-DD · {{author}} · [area: <module>] — Session: title [type]`. And **{{OPERATOR}} goal** becomes **Goal (requester)** (who asked ≠ who executes). Git already carries author+timestamp on the commit; here the added value is the readable `who` + `area` at a glance. See `handbook/09-operating-profiles.md`.
<!-- /profile:team -->

---

## YYYY-MM-DD — Session: [example] single status badge in the editor [feature/UI]

> _(Illustrative example entry — replace it with your first real entry. The domain is invented for illustration.)_

**{{OPERATOR}} goal**: «the two "saved" and "published" indicators step on each other and confuse». Then, along the way: also a small layout fix on mobile.

**Outcome**: unified into **a single status indicator** at the top (red "!" if there's something to publish, green with a check if everything is aligned), with a clear priority (in-progress → error → unsaved-draft → invalid-form → aligned). Read from the real code before deciding: the two indicators were computed from two independent flags that could contradict each other → replaced with a single derived state. Build + eyeball verification; one regression test on the priority computation. **Honest episode**: on the first pass it looked like a second bug, it was browser cache (the server sends `no-store`) — verified, cleared.

**Decisions that emerged**:
- A single indicator instead of two → record: **JOURNAL-only** (UI refinement, no public interface touched).
- "Saved" implicit in the switch to "unpublished changes" (no explicit toast) → **JOURNAL-only**.

**Records created/updated**: no new ADR/PDR/mini-ADR. Board updated.

**Commits**: `0000000` (single status indicator) — pushed, CI green.

**In plain language**: before, at the top there were two signals ("saved" and "published") that sometimes contradicted each other and left the user confused. Now there's **just one**, at a glance: red if there's something to publish, green if everything is fine. Nothing new to learn, just less noise. Along the way, a false alarm caused by the browser cache, verified and cleared.
