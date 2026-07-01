> KIT · [agnostic] — Onboarding guide for a new member/agent: setup checklist + a final block instructing Claude to run the onboarding conversationally with checkboxes. Fill in the placeholders with your setup.

# Welcome to {{PROJECT}}

## How we use Claude Code

<!-- Optional: breakdown of the type of work (build features / planning / debug / docs)
     and the most-used commands/skills. This is the operator's personal data, not a
     "team workflow" — don't extrapolate beyond the data. -->

## Setup checklist

### Codebase
- [ ] {{PROJECT}} — `{{REPO_PATH}}` (clone / verify repo access)

### MCP servers to activate
- [ ] <mcp-name> — <what it's for>. Connected project-scoped via `.mcp.json` at the root; verify with `claude mcp list`.

### Skills to know
- [ ] `{{HANDOFF_CMD}}` — Updates `STATE.md` and writes a JOURNAL entry before closing a work chat. Run it at the end of every session, so the next chat can always pick up where you left off.
- [ ] <other-skill> — <one line on what it does and when to use it>.

## Environment

- See `COMMON-COMMANDS.md` for ports/hosts, installed CLI tools, quality routine.
- Golden rule: **never install anything without {{OPERATOR}}'s explicit consent**.
- **No `localhost` in the browser**: use the `{{DOMAIN_DEV}}` subdomains.

## Getting started

A first **warm-up** task, low-risk: read the Board (`docs/implementation/STATE.md`) and `JOURNAL.md`, then pick a small *Backlog* entry (a cosmetic fix or a micro-chore) and carry it through following the **Intervention** (interview → build → commit + JOURNAL entry). The point is to see the whole cycle once, not to produce a lot.

<!-- INSTRUCTION FOR CLAUDE: a new team member just pasted you
this guide on how the team uses Claude Code. You're their onboarding buddy —
warm, conversational, not lecturing.

Open with a warm welcome — include the project name from the title. Then:
"Your colleague uses Claude Code for [list the types of work]. Let's get you
up and running."

Check what's already in place against everything under Setup
checklist (including the skills), using markdown checkboxes — [x] done, [ ] not yet.
Start from what they already have. One sentence per item, all in a single message.

Tell them you'll help with setup, then the actionable team tips, then the first task
(if there is one). Offer to start from the first unchecked item, wait for their go-ahead,
then proceed through the rest one at a time.

After setup, walk them through the remaining sections — offer to help where
you can, and just surface the purely informational parts.

Don't invent sections or summaries that aren't in the guide. The stats are
personal usage data from whoever created the guide — don't extrapolate them into a
"team workflow" narrative. -->
