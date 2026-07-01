---
title: "Inline decisions — full log"
---

> KIT · [agnostic] — append-only OVERFLOW ledger of the inline decisions. The Board (STATE.md) keeps only the ~15 most recent; here ALL of them are preserved. At every handoff the new ones go on top both here and in STATE. Empty the example.

> **Append-only** log of the **inline decisions and gotchas** that emerged during the implementation of {{PROJECT}}.
> It is the overflow of the `inline_decisions` field of [STATE.md](../STATE.md), which keeps only the ~15 most recent.
> Order: **newest-first**. Formalized decisions point to a mini-ADR / ADR / PDR; the others are operational notes not formalized elsewhere.

---

## Contract (how this file is maintained)

1. **At every {{HANDOFF_CMD}}**: the session's new inline decisions are added **on top** both here and in the `inline_decisions` frontmatter of `STATE.md`.
2. **STATE.md stays capped at ~15 entries** (the most recent, so as not to bloat the machine-readable frontmatter). This file **is never capped**: it keeps the full history.
3. **An entry leaves the Board but stays here**: when `STATE.md` exceeds the cap, the oldest entry is removed from the frontmatter — but it had already been copied here, so nothing is lost. The pre-push hook (`check-state-size.mjs`) reminds you to do the spillover if the cap is exceeded.
4. **Entry format**: one line (or paragraph) starting with the date + context, and — if the decision was formalized — the pointer to the record (`mini-ADR NNNN` / `ADR NNN` / `PDR-NNN`).

> In plain language: the Board shows only the recent "hot" decisions to stay readable; this file is the full archive that throws nothing away. The pre-push script warns you when it's time to move the old ones here.

**Entries**: 0 · **Period**: — · **Updated on**: —

---

_(example entry — replace with yours, newest-first)_

- YYYY-MM-DD session — **decision title**. Context in 1-3 sentences: what we were doing, what we decided and why, any gotcha caught from the real code. Pointer to the formal record if it exists (e.g. → mini-ADR 0001 / ADR 028 / PDR-004), otherwise "operational note".
