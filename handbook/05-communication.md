> KIT · [agnostic] — How Claude communicates choices and decisions to a **PM-director** operator (directs and decides; the AI writes the code). Adapt it: the interview-style applies everywhere; the "plain language" layer is for an audience that doesn't write code — optional for a PM-dev. Independent of {{STACK}}.

# 05 — Communication with the operator

> **In plain language**: this project's {{OPERATOR}} is a **PM-director** — they direct and decide, and evaluate choices from a product/business point of view; the AI writes the code (whether they can code or not). All of Claude's communication must be technically precise **and** translatable into concrete implications. Never dumb it down, never a dev-only monologue. *(If the operator is a PM-dev, the "plain language" layer is optional — see `00-philosophy.md` and `09-operating-profiles.md`.)*

## The cardinal principle: the double layer

For **every decision** and **every option** you present, give **two lines**:

1. **Tech** — the engineering sentence, with precise terms (API, library, file, pattern). No euphemisms on the key words: if the choice is between two validation strategies, say it with their real names.
2. **In plain language** — the same choice reformulated in terms of product / customer / operations. What changes, seen from outside, if we pick A instead of B.

> **In plain language**: every time you propose something, write it twice — once for the engineer the operator isn't, once for the PM the operator is. The second line doesn't simplify to hide things: it translates to enable a decision.

**Example** (one option from an email-validation decision):

> - Option A *(Recommended)* — "Format-only regex"
>   - *Tech*: RFC-5322-lite regex validation, synchronous, zero external calls.
>   - *In plain language*: we only check that the email has the right shape (the `@`, the domain). We don't verify the mailbox actually exists.
>   - (+) zero latency, zero cost  (−) a valid-looking typo slips through

**Only exception** to the double layer: internal tooling choices **invisible to the product** (e.g. "linter A vs linter B"). There, a terse PM line like "Difference invisible to the customer" is enough.

---

## The interview-style

When a decision needs to be made, don't ask it in free form ("do you want me to do X or Y?"). Use a structured question format, with these rules:

- **One decision per question.** Never merge two choices into a single question.
- **At most ~4 questions per round.** If more decisions are needed, do more rounds.
- **Every option with explicit pros/cons** (+/−) and one marked **Recommended** (with the reason).
- **Double layer** (see above) on the question *and* on every option.

Intensity adapts to the archetype of the work (see [02-pre-task-interview](../scaffold/docs/implementation/20-discipline/02-pre-task-interview.md)):
- Complex **user-facing** work → 2-3 rounds (one per block: business / UX / technical).
- Pure **infra/plumbing** work (e.g. configuring a tool) → **zero rounds**: go straight ahead, asking would just be noise.

> **In plain language**: decisions get presented like an interview — closed questions, one at a time, each with the options laid out side by side (pros, cons, and the one I recommend with why). That way the operator decides fast and with full knowledge, instead of reading a monologue and having to guess what you're asking them.

### What NOT to do

- Never ask "X or Y?" without pros/cons + Recommended.
- Never merge 2 decisions into 1 question.
- Never more than ~4 questions in a round.
- Never run the interview for pure infra work (noise).
- Never present an option without its "In plain language" line.

---

## The "plain language" rules

Beyond conversations, the project produces written **non-technical summaries** (e.g. a JOURNAL entry, or a twin document explaining an Intervention to a non-technical reader — a co-founder, a future investor, a future non-tech employee, the operator themselves six months from now). These are the writing rules (faithful lift from the real method):

1. **Plain language, short sentences, subject + verb.** No labyrinthine sentences.
2. **Real names, with an inline gloss on first use.** *Don't* hide the complexity: teach it. The first time a technical term appears, put it in **bold** followed by a brief explanation in parentheses. From then on you can use it bare.
   - Example of the cut: *"We turned on row-level security (a database mechanism that decides, row by row, who can see what). It's the wall that separates one customer's data from another's even when they live in the same table."*
3. **Glossary always present.** A fixed section, 3-6 terms with a 1-2 line definition. If the Intervention doesn't introduce new terms, put in 2-3 context terms anyway: it counts as a refresher and makes the document didactic.
4. **Length ~1 page.** It can stretch to 1.5-2 if needed to explain a new concept well. Never under half a page (if it's that short, the glossary is probably too thin).
5. **No code.** A simple block diagram is fine if it genuinely helps.
6. **Written "out loud"**, the way you'd explain it to someone non-technical in a two-minute phone call.
7. **Honesty about scope.** If it's invisible plumbing, say so ("no visible change for the customer, but it enables X"). Don't inflate it.

> **In plain language**: summaries for people who don't code aren't "dumbed-down versions" — they're *didactic* versions. They use the real names of things (e.g. a technology's actual name) but explain them on first use, so the reader **learns**, and there's always a small glossary at the bottom. One short page, short sentences, zero code.

### Typical structure of a non-tech summary

A good twin summary covers, in plain language:
- **TL;DR** — 1-2 sentences: what we built and why it matters.
- **What we built** — with real names introduced via gloss.
- **Why it was needed** — the product/business problem solved.
- **What changes for the user** — concrete impact (or "nothing, it's plumbing").
- **Glossary** — 3-6 terms.
- **What's NOT included** — explicit scope-gates, to avoid wrong expectations.
- **What it enables next** — which next piece becomes possible.
- **Effort & cost** — time spent, any new recurring/one-off costs.

---

## Why all this

The {{OPERATOR}} is the person who **decides** where the product goes, but doesn't defend the implementation line by line. If Claude only communicates in dev language, a non-coding operator can't decide well; if Claude simplifies too much, they lose technical control. The double layer and the interview-style solve both risks: **technical precision + translatability**, calibrated to the audience (for a PM-dev the second layer is optional).

> **In plain language**: the operator is the director, not the camera operator. They need to know exactly what we're shooting (precision) and what it means for the film (translation). Giving them only one of the two sets them up to get the direction wrong.
