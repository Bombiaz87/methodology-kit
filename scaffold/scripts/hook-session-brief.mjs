#!/usr/bin/env node
// KIT · [Node-ref] · advisory session hook — SessionStart: prints a compact brief of the Board
// (STATE.md) to stdout so a FRESH chat starts oriented. It makes the cold-start ritual ("a new chat
// reads the Board first", handbook/04 · Recovery) MECHANICAL instead of hoped-for. Wire it under
// `.claude/settings.json` → hooks.SessionStart. See handbook/07 §9.
//
// ADVISORY + FAIL-OPEN: it never blocks and never throws. If STATE.md is missing or unparsable it
// exits 0 in silence — a broken brief must NOT break the session start (warning-vs-blocking,
// handbook/08 §3). A hook that runs on every session must be cheap and quiet.
//
// GUARDS-ARE-TESTED (handbook/08 §8): the pure logic (buildBrief) is EXPORTED and separated from
// I/O + exit. Test: scripts/tests/hook-session-brief.test.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// Reuse the Board's frontmatter reader (single source of truth for the parse — handbook/08 §2).
import { extractFrontmatter, getScalar } from './check-state-size.mjs';

// {{DOCS_ROOT}} — docs root (default 'docs'); change it HERE if different (e.g. 'context').
const DOCS_ROOT = 'docs';
// The brief lands in EVERY fresh context (a cost, like the root CLAUDE.md — handbook/07 §1d). Keep it tiny.
const MAX_LINES = 12;

// --- PURE (no I/O, no exit → testable) ---------------------------------------

// A frontmatter value counts as "present" only if it's non-empty and not an empty
// YAML list (`[]`) — so `blockers: []` and `focus: ""` don't produce a noise line.
function meaningful(v) {
  const t = (v || '').trim();
  return t === '' || t === '[]' ? '' : t;
}

// STATE.md content → a compact brief string. Empty string = nothing worth injecting.
export function buildBrief(content, { maxLines = MAX_LINES } = {}) {
  const fm = extractFrontmatter(content);
  if (fm === null) return ''; // no parsable frontmatter → stay silent (fail-open)

  const focus = meaningful(getScalar(fm, 'focus') || getScalar(fm, 'task_scope'));
  const blockers = meaningful(getScalar(fm, 'blockers'));

  const lines = ['📋 Board (STATE.md) — orient before acting:'];
  if (focus) lines.push(`• Focus: ${focus}`);
  if (blockers) lines.push(`• Blockers: ${blockers}`);
  lines.push('• Full Board (In flight / Next / Gates): docs/implementation/STATE.md');

  return lines.slice(0, maxLines).join('\n');
}

// --- I/O + exit (impure, always exits 0) -------------------------------------

function main() {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const ROOT = path.resolve(__dirname, '..');
    const STATE_FILE = path.join(ROOT, DOCS_ROOT, 'implementation/STATE.md');
    if (!fs.existsSync(STATE_FILE)) return 0;
    const brief = buildBrief(fs.readFileSync(STATE_FILE, 'utf8'));
    if (brief) console.log(brief);
  } catch {
    // fail-open: a broken brief must never break the session start.
  }
  return 0;
}

// Run SOLELY if launched directly (not when the test imports buildBrief).
// pathToFileURL → cross-platform comparison (see _guard-template.mjs).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
