---
title: "05 — Plain language (non-technical summary)"
---

> KIT · [agnostic] — the non-technical summary ("In plain language"): principles + skeleton + glossary. Now folded into the Journal entry, no longer a separate file. Needed when the audience doesn't write code (optional for a PM-dev).

> The **non-technical summary** of an Intervention. It's no longer a separate file: it's the **"In plain language"** section at the bottom of the [JOURNAL](../JOURNAL.md) entry, written at closing time together with the handoff.
>
> **Primary source**: the "Business decisions" + "UX decisions" that emerged in the [interview](./02-pre-task-interview.md). A well-done interview = a summary that's almost self-writing.
>
> **Who it's for**: non-tech partners/co-founders, future investors/advisors, future non-tech colleagues, and {{OPERATOR}} themselves six months from now.

---

## Principles

1. **Plain English, short sentences, subject+verb.** The first occurrence of a technical term goes in **bold** + a short gloss in parentheses.
2. **Real names, not hidden.** We say "{{DB}}", "webhook", "cache" — but we introduce them. The goal is for the reader to **learn something**, not for the complexity to be masked.
3. **Length**: short. 2-5 lines are enough for a Journal entry. When a didactic pass is needed (a new concept that needs explaining well), it can run longer.
4. **Glossary** when ≥1 new terms are introduced (see skeleton): 1-2 lines per term. For a micro-entry, an inline gloss can be enough.
5. **No code screenshots.** A block diagram only if it really helps.
6. **Written "out loud"**: how you'd explain it to a non-tech relative in two minutes on the phone.
7. **Honesty about limits.** If it's invisible plumbing, say so ("no visible change, but it enables X"). If a fix had a false alarm or an incident (cache, build), tell it calmly.

---

## Skeleton (for the "In plain language" section of a Journal entry)

```markdown
**In plain language**:

[What changed, seen from outside — 2-4 lines in plain English. Technical terms
introduced with an inline gloss at first occurrence.]

[Honest: what's NOT included / any limit / an incident along the way.]

[Optional — Glossary, if new terms were introduced:]
- **{Term}**: 1-2 line definition, example if it helps.
```

---

## Filled-in example ("In plain language" section)

> _(Domain invented for illustration purposes.)_

**In plain language**: we turned on **data separation** (a mechanism in the **database** — the "warehouse" where all the data lives — that stops one customer from seeing another customer's data, even if it's in the same table). It's an invisible wall: even if a piece of code mistakenly asked for "all the data", the database would only answer with what's authorized. For the end customer **nothing visible changes** — but it's the foundation without which we couldn't safely serve a second customer. We did it from day one because adding it later would cost a lot more.

🎓 **Glossary**
- **Database**: the "warehouse" where all persistent data is stored (users, content, invoices). Always running on a server.
- **Data separation (multi-customer isolation)**: a mechanism that decides, row by row, who can see it. Like a bouncer at the entrance of every table.

---

## When to omit it

For a one-line fix or a trivial hotfix, the Journal entry can have a one-sentence "In plain language", or omit it if there's really nothing to tell a non-tech reader. Otherwise: there's always something worth telling, even for a "boring" infrastructure Intervention.
