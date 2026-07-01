---
title: "03 — Handoff protocol"
---

> KIT · [agnostic] — handoff protocol: how to keep Board + Journal always consistent with the git log. 3-layer defense (hook → command → checklist) + recovery from a stale state. Adapt the script/command names.

> Operating discipline to guarantee that `STATE.md` (the Board) and `JOURNAL.md` stay **always consistent** with the `git log`, regardless of how well the AI "remembers" the instruction to update them during a long chat.

**Layered defense**: 3 layers, from most binding to least.
- **Layer 1 — Git hook** (binding, automation).
- **Layer 2 — Slash command** ({{HANDOFF_CMD}}).
- **Layer 3 — Manual discipline** (checklist at the end of the session).

> Guiding principle (see README): **binding automation over voluntary discipline**. What a hook does on its own is never forgotten; what depends on remembering eventually slips.

---

## Layer 1 — Git hook (binding)

### Setup

Hooks are configured via a lightweight manager (e.g. `simple-git-hooks`, ~1KB), declared in `package.json`. Minimal example:

```json
{
  "simple-git-hooks": {
    "post-commit": "node scripts/update-state.mjs",
    "pre-push": "node scripts/check-state-size.mjs"
  },
  "scripts": { "prepare": "simple-git-hooks" }
}
```

{{OPERATOR}} runs `{{PKG_MANAGER}} install` → the hooks self-configure in `.git/hooks/`. Nothing else to do.

### post-commit

Runs **after every `git commit`**. Updates `STATE.md`'s machine-readable frontmatter (surgical in-place edit, via Node + a YAML parser):
- `last_commit` → HEAD's short SHA
- `last_commit_message` → first line of the commit
- `last_commit_at` → ISO timestamp of the commit (`git show -s --format=%cI HEAD`)
- `updated` → ISO timestamp now()

> This way the Board's git fields **can never lie** relative to the repo: the machine writes them, not the human.

### pre-push

Runs **before every `git push`**. Blocks the push if an invariant is violated. Example guards suited to the continuous-flow model:
- `inline_decisions` not past the cap (~15) — overflow goes to `30-reference/inline-decisions.md`.
- Valid `STATE.md` frontmatter (required fields present).
- (optional) local gate `{{PKG_MANAGER}} lint && {{PKG_MANAGER}} check` for parity with CI.

Exits with code 1 on errors → push blocked.

> NOTE: in continuous flow there are **no** hooks that assume a "task.md" or a task manifest (no `gen-manifest` / `validate-task-deps`). If you're porting an older kit, remove those hooks.

---

## Layer 2 — Slash command {{HANDOFF_CMD}}

Defined in `.claude/commands/handoff.md`. {{OPERATOR}} types it before closing the chat. The AI runs:

1. `git log --oneline -10` to reconstruct the latest actions.
2. **Board** refresh (`STATE.md`): updates `focus`, the `In flight` / `Next` columns, `next_actions` (1-3), `blockers`, and moves the new `inline_decisions` to the top (cap ~15; overflow → ledger reference).
3. Appends an entry to `JOURNAL.md` with the session template (Goal / Outcome / Tagged decisions that emerged / Records created / Commits / In plain language).
4. Final output: "Board refreshed, JOURNAL updated, ready to close chat."

If {{OPERATOR}} forgets to call it, the post-commit hook has already updated the machine-readable part. But the human `focus`/`next_actions` and the JOURNAL entry don't get filled in → recovery in a new chat will be "colder".

---

## Layer 3 — End-of-session checklist

Visible at the end of the session (in-context for the AI while it writes the last message — works better than an instruction in `CLAUDE.md` because it's right in front of it):

```markdown
## CHECKPOINT — confirm before closing
- [ ] STATE.md: focus + Board columns updated
- [ ] git log --oneline -3 matches what's described
- [ ] ADR/PDR/mini-ADR created if durable decisions emerged
- [ ] Tests green (output pasted above)
- [ ] JOURNAL entry added (with "In plain language")
- [ ] new inline_decisions at the top of STATE + ledger reference
```

---

## Recovery procedure

### Case 1 — Cold new chat, consistent system

{{OPERATOR}}: "continue {{PROJECT}}". The AI:
1. Reads `CLAUDE.md` (auto) → `00-quick-start.md` → `STATE.md`.
2. From the frontmatter it knows `focus`, `current_gate`, `last_commit`.
3. Checks that `git log --oneline -5` matches `last_commit`.
4. Announces: "I'm on _(focus)_; next action _(next_actions[0])_. Proceed?"

### Case 2 — STATE is stale (doesn't match the git log)

**Symptom**: `git log -1 --format=%H` ≠ `STATE.md.last_commit`. This is the main drift signal: the Board talks about one world, the repo shows another.

**Procedure**:
1. Run `{{PKG_MANAGER}} update-state` (call the script manually, simulating the post-commit hook) → `last_commit` realigned to HEAD.
2. The human `focus` / `next_actions` might be stale → the AI reads `git log` + `JOURNAL.md` to reconstruct what changed and rewrites `focus`/`next_actions`.
3. Proceed normally.

### Case 3 — The Board references a Gate or a reference that no longer exists

**Procedure**: `git log` on the Board's files to figure out when it changed; realign the gate entry or the reference to the current name.

---

## Anti-patterns to avoid

| Anti-pattern | Why it's bad | What to do instead |
|---|---|---|
| Editing STATE.md by hand without a commit | Guaranteed drift between working copy and everything else | Edit → commit → hook updates the git fields on its own |
| Skipping pre-push with `--no-verify` | Violated invariants break consistency | Fix the cause, never bypass the hook |
| Marking something "done" without green tests | Hidden bugs, the Board lies | The checklist requires pasted green test output |
| Leaving `focus` empty on an interrupted chat | The new cold chat doesn't know where to restart from | Always fill `focus` + `next_actions` when closing mid-way |
| More than one state file | Ambiguity is drift | There is ONE `STATE.md` |
| Editing an auto-generated file by hand | It will get overwritten | Edit the source, let it regenerate |

---

## Golden rules for {{OPERATOR}}

1. **Always close with {{HANDOFF_CMD}}** if you changed something. Costs 30 seconds, saves hours of "wait, where was I?".
2. **No manual pushes** if the chat closed badly — open a new chat and let the AI verify the state first.
3. **If the hooks break**, run `{{PKG_MANAGER}} install` (re-trigger the setup). Never disable them with a flag — fix them.
4. **The number-one drift symptom** is `git log HEAD` ≠ `Board.last_commit`: if you see it, do recovery (Case 2) before working.
