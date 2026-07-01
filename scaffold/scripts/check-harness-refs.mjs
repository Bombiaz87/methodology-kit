#!/usr/bin/env node
// KIT · [Node-ref] — harness config-drift sentinel: scans the `.claude` control files
// (settings.json hooks, slash-commands, skills) for HIGH-CONFIDENCE local path references
// (`scripts/…`, `.claude/…`, `docs/…`, `src/…` with a file extension) that no longer exist on disk.
// A hook that points at a renamed script, or a command that cites a moved doc, fails SILENTLY —
// this guard surfaces that (it becomes valuable exactly once native hooks reference scripts, §9).
//
// NARROW BY DESIGN: it follows only anchored, extension-bearing paths, and SKIPS placeholders
// (`{{…}}`, `<…>`), globs (`*`) and `..` (ambiguous) — so it doesn't cry wolf on prose examples.
// See handbook/07 §9 + reference/sentinels-and-generators.md.
//
// SEVERITY: warning (exit 0). It nags, it doesn't block — the parse is heuristic and a rare
// illustrative path shouldn't stop a push. Promote to blocking on your high-confidence subset if you want.
//
// GUARDS-ARE-TESTED (handbook/08 §8): the pure logic (extractPathRefs / checkHarnessRefs) is
// exported and separated from I/O + exit. Test: scripts/tests/check-harness-refs.test.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Anchored dirs we treat as repo-root-relative + the file extensions we follow.
const ANCHOR = '(?:scripts|\\.claude|docs|src)';
const EXT = '(?:mjs|cjs|js|mts|cts|ts|tsx|json|md|mdx|sh|ya?ml|toml|css|svg)';
const REF_RE = new RegExp(`(?:^|[\\s"'\`(\\[])((?:\\./)?${ANCHOR}/[A-Za-z0-9._\\-/]+\\.${EXT})\\b`, 'g');

// Where the harness control files live (relative to the repo root).
export const HARNESS_PATHS = {
  settings: '.claude/settings.json',
  commandsDir: '.claude/commands',
  skillsDir: '.claude/skills',
};

// --- PURE (no I/O → testable) ------------------------------------------------

// Extract high-confidence, root-relative path refs from a blob of text.
// Skips placeholders ({{…}}, <…>), globs (*) and relative-climbing (..).
export function extractPathRefs(text) {
  const out = new Set();
  for (const m of text.matchAll(REF_RE)) {
    const ref = m[1].replace(/^\.\//, '');
    if (/[{}<>*]/.test(ref) || ref.includes('..')) continue;
    out.add(ref);
  }
  return [...out];
}

// --- I/O ----------------------------------------------------------------------

function listMarkdown(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listMarkdown(p, acc);
    else if (e.isFile() && e.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

// Scans the harness control files under rootDir; returns { dead: [{source, ref}], sources }.
export function checkHarnessRefs(rootDir, paths = HARNESS_PATHS) {
  const sources = [];
  const settings = path.join(rootDir, paths.settings);
  if (fs.existsSync(settings)) sources.push(settings);
  listMarkdown(path.join(rootDir, paths.commandsDir), sources);
  listMarkdown(path.join(rootDir, paths.skillsDir), sources);

  const dead = [];
  for (const src of sources) {
    let text;
    try {
      text = fs.readFileSync(src, 'utf8');
    } catch {
      continue;
    }
    const rel = path.relative(rootDir, src).split(path.sep).join('/');
    for (const ref of extractPathRefs(text)) {
      if (!fs.existsSync(path.join(rootDir, ref))) dead.push({ source: rel, ref });
    }
  }
  return { dead, sources: sources.length };
}

// --- exit (impure) ------------------------------------------------------------

function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const ROOT = path.resolve(__dirname, '..'); // repo root = parent of scripts/
  const { dead, sources } = checkHarnessRefs(ROOT);

  if (dead.length === 0) {
    console.log(`[check-harness-refs] OK — ${sources} harness file(s) scanned, no dead references.`);
    return 0;
  }
  console.warn(`\n[check-harness-refs] WARN: ${dead.length} dead reference(s) in .claude control files:\n`);
  for (const d of dead) console.warn(`  • ${d.source} → ${d.ref} (not found)`);
  console.warn('\nFix the reference (a renamed/moved script or doc) or remove it. (warning — does not block)');
  return 0; // warning-only: nags, never blocks
}

// Run SOLELY if launched directly (not when the test imports the pure functions).
// pathToFileURL → cross-platform comparison (see _guard-template.mjs).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
