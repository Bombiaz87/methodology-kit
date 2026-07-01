> KIT · [agnostic] — The SSOT map: which file is the source of truth for which topic, plus the "before acting" reading order. Adapt it by assigning a single SSOT to each topic in your project.

# Documentation architecture (SSOT map)

> **In plain language.** A healthy project has, for every question, **one single place** where the true answer lives. "Where are we going?" → one file. "Where do we stand?" → another. "How did we decide to build it?" → yet another. When every topic has its SSOT (Single Source Of Truth), documents stop contradicting each other and the agent always knows where to look.

---

## 1. The principle: one SSOT per topic

Every topic in the project has **exactly one source of truth**. Other documents can *link* to that source, but not repeat its content (duplication is the seed of drift: two copies diverge, and nobody knows anymore which one is right).

The practical rule: before writing a piece of information, ask yourself *"what's the SSOT for this topic?"*. If you're not in that SSOT, write a link, not a copy.

---

## 2. Who is SSOT of what

| File / directory | Is SSOT of… | Role |
|---|---|---|
| `README.md` (root) | **nothing** — it's just the index | **Router-SSOT**: declares who is SSOT of what and points there |
| `CLAUDE.md` | — | **Charter for the agent**: operating rules, prohibitions, what to read before acting |
| `ONBOARDING.md` | — | **Human entry point** + "instructions for the agent" block |
| `docs/DIRECTION.md` | **product/business** direction + pivot log (PDR) | Where we're going and why (alive) |
| `docs/implementation/STATE.md` | **implementation status** (Board) | Where we stand (alive) |
| `docs/identity/` | **foundational** identity (mission, who we serve, promise) | Why we exist (periodic re-read) |
| `docs/architecture/` | **technical decisions** (ADR) | How we build (frozen until superseded) |

> **In plain language.** The README is the museum's floor plan, not a room: it tells you which room has what, and that's it. DIRECTION is the product's compass, STATE is the work's dashboard, identity is the project's ID document, architecture is the book of technical rules.

### 2a. Root README = router-SSOT ("just the index")

The root README **contains no first-hand truth**. Its only job is to declare the map: *"the product model lives in DIRECTION.md; the status lives in STATE.md; this README is just the repo's index"*. That way anyone (human or agent) enters through the right door without the README becoming a second place to keep up to date.

### 2b. CLAUDE.md = charter for the agent

`CLAUDE.md` is the document the agent reads first: behavior rules, operating conventions, prohibitions (e.g. "no unilateral decisions", "selective file staging", "read the real source, don't infer"), and the **"before acting" reading order** (§3). It's not product documentation: it's the *agent's user manual for this project*. Specific areas can have nested `CLAUDE.md` files (see `../reference/pattern-nested-claude-md.md`).

### 2c. ONBOARDING.md = human entry point

`ONBOARDING.md` welcomes a new **person**: how the project is put together, where to start, how to move around. It includes an explicit **"instructions for the agent"** block — so the human understands *how* the agent is guided and isn't surprised by its behavior.

### 2d. STATE / Board = implementation status

`STATE.md` is the **Board**: what's in flight, what's next, the gates/milestones, the backlog. It's the SSOT of *where we stand*. It lives alongside JOURNAL (the append-only diary of "what happened"). Detail in `04-living-state-machine.md`.

### 2e. DIRECTION = product direction

`DIRECTION.md` is STATE's **strategic twin**: where the product/business is going *today* (north-star rewritten in place) + the **history of pivots** (append-only PDR log). Detail in `04-living-state-machine.md` and `02-decision-discipline.md`.

### 2f. identity/ = foundational SSOT

`docs/identity/` defines who we are, why we exist, who we serve, with what promise. It's **foundational** but not immutable:

- **Re-read cadence.** It must be re-read periodically (e.g. every 6-12 months) and updated if reality diverges.
- **"Forward" stale-banner.** When the model evolves (a PDR), the foundational docs can remain *partially* true: a banner is placed at the top saying "these docs hold up in principle, but on <topic> the model has changed — read them in light of PDR-NNN, see DIRECTION.md". Same mechanism as the ADR stale-banner (see `02-decision-discipline.md` §5), but pointed forward (toward the pivot that made them partial).

> **In plain language.** Identity is the "why we were born". It changes rarely, but when the product pivots, some sentences in the foundational document age: instead of rewriting it, a label is put on it saying "still holds in spirit, but on this point look at the updated direction".

### 2g. architecture/ = technical decisions

`docs/architecture/` is the SSOT of *how we build*: the ADR status table (`README.md`), the central ADRs (`decisions/`), the code conventions. It's **frozen until superseded** (see `02-decision-discipline.md` §5). The status table in `architecture/README.md` is the living index of all technical decisions.

### 2h. Two onboarding artifacts: glossary + risk log

Beyond the ADRs, two lightweight artifacts lower the entry barrier for a partner / new hire / new chat:

- **Glossary** (`architecture/glossary.md`) — translates code jargon ↔ product jargon. It's mostly useful for **confusing aliases**: multi-tenant boundaries (the primary scope isn't the secondary one) and product↔code terms (the same thing has two names). One line per term; it gets updated *here* as well as in the ADR when a term changes. It's a dictionary, not architectural documentation.
- **Risk/debt log** — *not* a fourth file to maintain in parallel (it would drift): better a **lightweight index** in `architecture/README.md` that **points** to the sources already alive (security gaps, go-live log, deferred backlog, Board). Consolidating would mean duplicating; indexing doesn't.

Both are *descriptive and low-cost*. Their opposite — unexplained jargon and risks scattered without an index — is a hidden cost paid at every onboarding.

---

## 3. "Before acting" reading order

At the start of every session, the agent reads in **this order**:

1. **`CLAUDE.md`** (root) — the charter: how to behave on this project.
2. **`docs/implementation/STATE.md`** — the Board: where we stand *right now*.
3. **`docs/DIRECTION.md`** — where the product is going + recent pivots.
4. **`docs/architecture/README.md`** — the ADR table: what's already decided technically.
5. **Nested CLAUDE.md** files for the area being worked on (local scope).
6. Specific ADRs / code conventions, as needed.

> **In plain language.** First the rules of engagement (CLAUDE.md), then what I'm doing today (STATE), then where I'm going (DIRECTION), then the technical rules (architecture). Skipping the order = working in the dark.

**Precedence rule between instructions.** When a nested `CLAUDE.md` says something more specific than the root one, the more specific one wins for the area you're working in. `CLAUDE.md` instructions **override the agent's default behaviors**.

---

## 4. Document hierarchy (diagram)

```
README.md  ──────────────  (router-SSOT: "just the index", who is SSOT of what)
   │
   ├── CLAUDE.md ─────────  agent charter  (reading order, prohibitions, conventions)
   ├── ONBOARDING.md ─────  human entry point  (+ "instructions for the agent" block)
   │
   └── docs/
        ├── DIRECTION.md ──────────  SSOT product/business direction  (north-star + PDR)    ◀─┐
        │                                                                                     │ twins
        ├── identity/ ─────────────  foundational SSOT  (periodic re-read, stale-banner)      │
        │                                                                                     │
        ├── architecture/ ─────────  SSOT technical decisions  (central ADRs + conventions)   │
        │     ├── README.md ───────  ADR status table (living index)                          │
        │     ├── code-conventions.md                                                         │
        │     └── decisions/NNN-*.md                                                          │
        │                                                                                     │
        └── implementation/                                                                   │
              ├── STATE.md ────────  SSOT implementation status  (Board: In flight/Next/…)  ◀─┘
              └── JOURNAL.md ──────  append-only diary (what happened)
```

The two **twins** (DIRECTION ↔ STATE) answer the two always-alive questions: *where we're going* and *where we stand*. Everything else hangs from there: identity upstream (why), architecture alongside (how).

---

## See also

- `02-decision-discipline.md` — ADR/PDR, thresholds, supersede, stale-banner.
- `04-living-state-machine.md` — STATE/Board and DIRECTION in detail.
- `../reference/pattern-nested-claude-md.md` — nested CLAUDE.md files for local scope.
- `../scaffold/docs/README.md` — this map's instance in the scaffold.
