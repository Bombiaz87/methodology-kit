> KIT · [agnostic] — Spec of the agent's memory system (one-fact-per-file + index). Lives OUTSIDE the repo, in the harness's project store. Adapt it: use your project's slug in the path, keep the dedup and staleness discipline.

# Protocol: the agent's memory

Memory is how the agent **remembers between sessions** things that aren't obvious from reading the code. It's deliberately separate from the repo.

**In plain language:** the agent's notebook. Only things that CANNOT be understood from the code alone go here — the unwritten "why," the traps discovered the hard way, environment decisions. Not a duplicate of the code.

---

## Where it lives (OUTSIDE the repo)

The memory store lives in the harness's project folder, **not** in the repo:

```
~/.claude/projects/<project-slug>/memory/
├── MEMORY.md                 # the INDEX (one line per memory)
├── <type>-<topic>.md         # one file per fact
└── …
```

**Why outside the repo:** memory is the agent's point-in-time observation about *this environment/user*, not versioned product documentation. It doesn't go through code review, it doesn't propagate to human collaborators, it doesn't pollute the diff. (Documentation that *must* be versioned lives in `{{REPO_PATH}}/docs/`.)

<!-- profile:team -->
### `team` profile — local memory stays personal, but a promotion channel is needed

In a team, per-machine memory **fragments**: what one dev's agent learns, the others don't see. Local memory stays as-is (personal, point-in-time, outside the repo) — but add two things:

- **Promotion channel (local → shared).** When a fact stops being "mine" and becomes "the team's" (a convention, an infra quirk affecting everyone, a domain term), **promote** it from local memory to the right committed doc: glossary, `code-conventions.md`, an ADR, or `DIRECTION.md`. Memory is the scratchpad; the repo is the shared SSOT.
- **"Re-read everything" ritual at handoff.** Before writing Board/Journal, re-read STATE + DIRECTION + the latest Journal entries — even if you've already seen them — so you don't work off a stale derived state produced by another dev. See `../handbook/09-operating-profiles.md`.
<!-- /profile:team -->

---

## Founding rule: one fact per file + one index

- **One file = one fact.** No omnibus files. The name is `<type>-<topic-slug>.md`.
- **`MEMORY.md` = index only.** One line per memory: linked title + one summary sentence. Details live in the linked file, **never** in the index. The index is a map, not a summary.

```markdown
## <Thematic section>
- [Short title](file-name.md) — one line of what it contains, under ~200 chars
```

**In plain language:** the index tells you *what exists and where*; open the file only when you need that fact. Keeping the index lean is what makes it useful.

---

## Schema of a memory file

YAML frontmatter + body.

```markdown
---
name: <type>-<topic-slug>
description: "One self-contained sentence: the fact, specific enough to be useful out of context."
metadata:
  node_type: memory
  type: <feedback|project|reference|infra>
  originSessionId: <id-of-session-that-generated-it>
---

**Why:** why this fact exists / what went wrong. The part that CANNOT be inferred from the code.

**How to apply:** what to do in practice next time — steps, the right command, what to avoid.

Wiki-link to related memories: [[other-memory-file]].
```

`description` is what the agent sees before deciding whether to open the file: it must be self-contained.

---

## The 4 types

| `type` | What it captures | Example intent |
|---|---|---|
| `feedback` | {{OPERATOR}}'s preference/correction — how they want you to work | "never install without consent", "run tests serially" |
| `project` | Product/project decision or state not obvious from the code | "the direction layer is the living SSOT, twin of the board" |
| `reference` | Durable technical fact — vendor setup, tool quirk, recipe | "the DB command doesn't auto-load env: prefix with NODE_OPTIONS=…" |
| `infra` | Environment/infrastructure — host, ports, perimeter | "the {{OPERATOR}} can't see localhost from the browser: use {{DOMAIN_DEV}}" |

---

## When to save (and when NOT to)

**Save ONLY if it's non-obvious from the code.** Filter question: *"would another agent, reading the clean codebase, infer this?"* If yes → it's not memory.

Save when:
- the {{OPERATOR}} corrects you on *how* to work (→ `feedback`)
- you discover the hard way a tool/environment trap the code doesn't reveal (→ `reference`/`infra`)
- a product decision has a "why" the code doesn't explain (→ `project`)

Do NOT save:
- what's readable from the code (signatures, folder structure, what a function does)
- meta-notes about the model/harness or generic prompting best-practices — memory captures **project** constraints, not model tuning
- minute chronology ("today I did X") — that's the JOURNAL/git log

---

## Discipline: dedup / update / delete

Memory **rots** if it only grows. Keep it like a garden:

- **Dedup:** before creating a file, check the index — if the fact already exists, **extend** it, don't open a second near-duplicate.
- **Update:** when a fact changes (a quirk fixed upstream, a port that changed), **rewrite** the file and the index line. Don't leave two truths.
- **Delete:** when a fact is no longer true, **delete** the file and its line. A stale memory is worse than no memory — it misleads with apparent authority.

---

## Index size limit + mitigation

`MEMORY.md` gets loaded (in whole or in part) into context. If it exceeds the limit, **only part gets read** → invisible memories.

- **Symptom:** a warning like `MEMORY.md is NN KB (limit: MM KB) — index entries are too long. Only part of it was loaded.`
- **Mitigation:** keep each index line **under ~200 chars**, one line per memory. Move every detail into the linked file. If the index is still too big, **archive** dead entries (delete) and **group** by thematic sections instead of bloating the lines.

**In plain language:** the index must stay a lean summary. If it turns into a novel, the agent only reads half of it and forgets the rest without noticing.

---

## Staleness banner

Every memory is a **dated observation**, not live state. When the harness injects an old memory, it prepends a warning:

> This memory is N days old. Memories are point-in-time observations, not live state — claims about code behavior or file:line citations may be stale. Verify against the current code before asserting as fact.

**Rule of use:** a memory tells you *where to look*, it doesn't replace verification. On code claims or file:line citations, **re-read the source** before treating them as truth.

---

## Voice examples (anonymized)

### Example — `feedback`
```markdown
---
name: feedback-never-install-without-consent
description: "NEVER install packages/tools (package installs, runners with auto-install, system installs) without prior consent. Even transient tools in temp folders count."
metadata:
  node_type: memory
  type: feedback
  originSessionId: <id>
---
**Absolute rule:** no command that downloads/installs software without first asking for explicit consent.
Also applies to: transient installs in `/tmp/`, runners with auto-install, browser binaries for visual debugging.
**Why:** the {{OPERATOR}} wants full control over the environment — no orphan artifacts, no phantom dependencies. Triggering case: installing a browser driver in `/tmp/` for debugging without asking → sharp correction.
**How to apply:** before any install, stop and ask with pros/cons/footprint; first check what's already available (`which`, scan node_modules, process list). Also applies to sub-agents: if an agent installs something, it's as if you did it.
```

### Example — `project`
```markdown
---
name: project-direction-layer
description: "The direction layer = DIRECTION.md doc (north-star of the current model + pivot log) + sentinel that reminds of open touch-points; strategic twin of the status board."
metadata:
  node_type: memory
  type: project
  originSessionId: <id>
---
**Why:** the system tracked *tactical* deviations well (code vs task) but had no place for *macro* product/business pivots — they floated as "pre-decision" while the plan docs presented themselves as frozen.
**How to apply:** when a pivot changes who-we-serve / how-we-acquire / how-we-monetize / how-we-operate (2+ axes) or invalidates a decision's assumption → add a pivot entry in the direction doc + propagation checklist + update the north-star + banner on the affected decisions. Golden rule: no unilateral pivots from the agent — confirm with the {{OPERATOR}} first. See [[reference-direction-sentinel]].
```

---

## Cross-link

- Nested `CLAUDE.md` gotchas often point to these memories → see [pattern-nested-claude-md.md](./pattern-nested-claude-md.md).
- The direction layer and its sentinel → see `../handbook/03-ssot-architecture.md` and `./sentinels-and-generators.md`.
