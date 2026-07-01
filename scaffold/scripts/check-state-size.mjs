#!/usr/bin/env node
// KIT · [Node-ref] — pre-push: blocks if the living state machine (STATE.md) balloons past
// thresholds (KB/counters) or if archive markers leak into the scope field. Expected behavior:
// the Board stays lean; history migrates to the JOURNAL/ledger, it doesn't pile up in the frontmatter.
//
// ZERO-DEP on purpose (no js-yaml): it reads only ONE scalar (focus) and COUNTS the entries of two
// lists (next_actions, inline_decisions) → a minimal frontmatter parser is enough. A "drop-in"
// [Node-ref] guard that pulls in no dep is easier to adopt and to test.
//
// GUARDS-ARE-TESTED (see handbook/08 §8): the pure logic is EXPORTED
// (extractFrontmatter / getScalar / countListItems / checkStateContent) and separated from I/O and
// from exit → testable without touching the filesystem. Test: scripts/tests/check-state-size.test.mjs.
//
// Wired into pre-push + manually via `{{PKG_MANAGER}} check:state-size`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// --- Tunable constants (exported for the tests) ------------------------------
export const LIMITS = {
  maxFileKb: 120,
  maxScopeChars: 8000,
  maxNextActions: 8,
  maxInlineDecisions: 25,
};
// Marker that must NOT appear in the scope field (signals archives that leaked back in).
export const ARCHIVE_MARKER = 'SESSION ARCHIVE';

// {{DOCS_ROOT}} — docs root (default 'docs'); change it HERE if different (e.g. 'context').
const DOCS_ROOT = 'docs';

// --- PURE functions (no I/O, no exit → testable) -----------------------------

// Extracts the frontmatter block (between the FIRST `---` on line 1 and the closing `---`).
// Returns null if the file doesn't start with a frontmatter (e.g. a banner put on top: known bug).
export function extractFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  return m ? m[1] : null;
}

// Value of a top-level scalar `key: value`. Handles a quoted string followed by a comment
// (`focus: ""   # note`) and a bare value with an inline comment (`key: val  # note`).
export function getScalar(fm, key) {
  const m = fm.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'));
  if (!m) return null;
  let v = m[1].trim();
  if (v === '') return '';
  const q = v[0];
  if (q === '"' || q === "'") {
    const end = v.indexOf(q, 1);
    return end >= 0 ? v.slice(1, end) : v.slice(1);
  }
  const h = v.indexOf(' #'); // inline comment
  if (h >= 0) v = v.slice(0, h);
  return v.trim();
}

// Counts the entries of a top-level YAML list: inline `key: [a, b]` or block `key:\n  - a`.
// Empty entries (`- ""`, `- `) don't count.
export function countListItems(fm, key) {
  const lines = fm.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(new RegExp(`^${key}:[ \\t]*(.*)$`));
    if (!m) continue;
    const rest = m[1].replace(/[ \t]+#.*$/, '').trim(); // strip inline comment
    if (rest.startsWith('[')) {
      const inner = rest.replace(/^\[|\]$/g, '').trim();
      return inner === '' ? 0 : inner.split(',').filter((s) => s.trim() !== '').length;
    }
    let count = 0;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^[ \t]+-[ \t]?/.test(lines[j])) {
        const item = lines[j].replace(/^[ \t]+-[ \t]*/, '').trim().replace(/^["']|["']$/g, '');
        if (item !== '') count++;
      } else if (/^\S/.test(lines[j])) {
        break; // new top-level key → end of list
      }
    }
    return count;
  }
  return 0;
}

// PURE check: returns an array of error messages (empty = ok).
export function checkStateContent(content, limits = LIMITS) {
  const errors = [];
  const sizeKb = Buffer.byteLength(content) / 1024;
  if (sizeKb > limits.maxFileKb) {
    errors.push(
      `STATE.md is ${sizeKb.toFixed(0)}KB (max ${limits.maxFileKb}KB). Move history into JOURNAL.md / inline-decisions.md.`,
    );
  }

  const fm = extractFrontmatter(content);
  if (fm === null) {
    errors.push(
      'unparsable frontmatter in STATE.md — the `---` block must be the FIRST thing in the file (no banner/lines above).',
    );
    return errors;
  }

  const scope = getScalar(fm, 'focus') ?? getScalar(fm, 'task_scope') ?? '';
  if (scope.length > limits.maxScopeChars) {
    errors.push(
      `scope is ${scope.length} chars (max ${limits.maxScopeChars}). It must be the current scope, not concatenated archives.`,
    );
  }
  if (scope.includes(ARCHIVE_MARKER)) {
    errors.push(`scope contains "${ARCHIVE_MARKER}" — archives go in JOURNAL.md, not in the scope field.`);
  }

  const actions = countListItems(fm, 'next_actions');
  if (actions > limits.maxNextActions) {
    errors.push(
      `next_actions has ${actions} entries (max ${limits.maxNextActions}). Keep only the genuinely next actions; executed sessions live in JOURNAL.md.`,
    );
  }

  const decisions = countListItems(fm, 'inline_decisions');
  if (decisions > limits.maxInlineDecisions) {
    errors.push(
      `inline_decisions has ${decisions} entries (max ${limits.maxInlineDecisions}). Move the oldest into the ledger 30-reference/inline-decisions.md.`,
    );
  }

  return errors;
}

// --- I/O + exit (impure) -----------------------------------------------------

function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const ROOT = path.resolve(__dirname, '..');
  const STATE_FILE = path.join(ROOT, DOCS_ROOT, 'implementation/STATE.md');

  if (!fs.existsSync(STATE_FILE)) {
    console.log('[check-state-size] STATE.md not found — skip');
    return 0;
  }
  const content = fs.readFileSync(STATE_FILE, 'utf8');
  const errors = checkStateContent(content);
  for (const e of errors) console.error(`\x1b[31m[check-state-size] ERROR: ${e}\x1b[0m`);
  if (errors.length > 0) {
    console.error(`\n[check-state-size] ${errors.length} error(s) — push blocked.`);
    return 1;
  }
  const sizeKb = Buffer.byteLength(content) / 1024;
  console.log(`[check-state-size] STATE.md OK (${sizeKb.toFixed(0)}KB, under the thresholds).`);
  return 0;
}

// Run SOLELY if launched directly (not when the test imports the pure functions).
// pathToFileURL → cross-platform comparison (see _guard-template.mjs).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
