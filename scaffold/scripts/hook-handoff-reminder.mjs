#!/usr/bin/env node
// KIT · [Node-ref] · advisory session hook — Stop: if work moved but wasn't saved, reminds to run
// the handoff. It makes Layer 3 (the in-context checklist, handbook/04) MECHANICAL: the weakest
// defense layer stops depending on the model choosing to read a checklist. Wire it under
// `.claude/settings.json` → hooks.Stop. See handbook/07 §9.
//
// ADVISORY + FAIL-OPEN: it REMINDS, it never blocks the turn (a Stop hook *can* trap the turn — the
// kit deliberately does not; that's for unattended autonomous runs, not an interview-first,
// human-gated model — handbook/01). Any error → exit 0 in silence.
//
// GUARDS-ARE-TESTED (handbook/08 §8): the pure logic (buildReminder / shaMatch) is EXPORTED and
// separated from git I/O + exit. Test: scripts/tests/hook-handoff-reminder.test.mjs.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extractFrontmatter, getScalar } from './check-state-size.mjs';

// {{DOCS_ROOT}} — docs root (default 'docs'); change it HERE if different.
const DOCS_ROOT = 'docs';
// The closing ritual's command name. Adapt to your project's handoff command ({{HANDOFF_CMD}}).
const HANDOFF_CMD = '/handoff';

// --- PURE (no I/O, no exit → testable) ---------------------------------------

// Abbreviated-sha tolerant equality (the Board stamps %h; a full sha may appear elsewhere).
export function shaMatch(a, b) {
  if (!a || !b) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

// Given the git/board signals, returns the advisory reminder. Empty string = nothing to nag.
export function buildReminder({ dirty, headSha, boardLastCommit }, handoffCmd = HANDOFF_CMD) {
  if (dirty) {
    return `🧭 Uncommitted changes in the working tree — run ${handoffCmd} (or commit) before closing, so the Board/JOURNAL don't drift from the code.`;
  }
  if (headSha && boardLastCommit && !shaMatch(headSha, boardLastCommit)) {
    return `🧭 The Board's last_commit (${boardLastCommit}) ≠ HEAD (${headSha}) — run ${handoffCmd} to realign STATE.md and add the JOURNAL entry.`;
  }
  return '';
}

// --- I/O + exit (impure, always exits 0) -------------------------------------

function gitOrNull(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function main() {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const ROOT = path.resolve(__dirname, '..');
    if (gitOrNull('git rev-parse --is-inside-work-tree', ROOT) !== 'true') return 0;

    const dirty = (gitOrNull('git status --porcelain', ROOT) || '') !== '';
    const headSha = gitOrNull('git log -1 --format=%h', ROOT);

    let boardLastCommit = null;
    const STATE_FILE = path.join(ROOT, DOCS_ROOT, 'implementation/STATE.md');
    if (fs.existsSync(STATE_FILE)) {
      const fm = extractFrontmatter(fs.readFileSync(STATE_FILE, 'utf8'));
      if (fm) boardLastCommit = getScalar(fm, 'last_commit');
    }

    const msg = buildReminder({ dirty, headSha, boardLastCommit });
    if (msg) console.log(msg);
  } catch {
    // fail-open: an advisory reminder must never trap the turn.
  }
  return 0;
}

// Run SOLELY if launched directly (not when the test imports the pure functions).
// pathToFileURL → cross-platform comparison (see _guard-template.mjs).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
