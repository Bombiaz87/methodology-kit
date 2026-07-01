#!/usr/bin/env node
// KIT · [Node-ref] — SKELETON of a "forbidden-pattern" guard: forbidden regex + scoped path filter + exported ALLOWLIST (empty-but-extendable) + exported pure functions (classifyFile/checkRepo/stripComments). Expected behavior: copy it, replace pattern/messages/categories, and you get a testable CI guard that forbids an anti-pattern outside a PR-reviewable list.
//
// scripts/_guard-template.mjs
// Template of a "convention guard": fails CI when a file uses a forbidden
// pattern WITHOUT being in an explicit (and PR-reviewable) allow-list.
//
// In plain language: some things in the code are dangerous only when used "by hand"
// and off the proper rails (example of a DOMAIN guard: a function that bypasses
// data isolation, an unvalidated redirect). This skeleton forbids them by default
// and keeps a documented whitelist of legitimate exceptions — so every exception
// goes through a review instead of slipping in unnoticed.
//
// HOW TO ADAPT IT:
//   1. FORBIDDEN_RE  → the call/pattern you want to forbid by default.
//   2. ALLOWLIST     → the legitimate exceptions (file + category + reason). Starts empty.
//   3. SCOPED_RE     → optional: forms that are NOT violations ("channeled" use of the pattern).
//   4. SCAN_DIRS / extensions → adapt to your {{STACK}}.
//   5. the actionable messages in main().
//
// NB: do NOT ship the DOMAIN patterns (RLS-bypass, open-redirect) as a working guard:
//     this is a SKELETON. Replace the regex with your real anti-pattern.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// --- Tunable constants --------------------------------------------------------

// (1) The pattern FORBIDDEN by default. Neutral example: a function `unsafeAccess(`.
//     Replace it with your real anti-pattern.
const FORBIDDEN_RE = /\bunsafeAccess\s*\(/;

// (3) "Channeled" forms that do NOT count as a violation (legitimate use of the pattern).
//     Neutral example: `withGuard(unsafeAccess(...))`. Empty = no scoped case.
const SCOPED_INLINE_RE = /withGuard\(\s*unsafeAccess\s*\(/;
// Assignment form: `const x = unsafeAccess()` is scoped only if `x` is
// NEVER dereferenced as `x.<...>`. (see classifyFile)
const ASSIGN_RE = /(?:const|let)\s+(\w+)\s*=\s*[^=]*unsafeAccess\s*\(\s*\)\s*;?\s*$/;

// (2) ALLOWLIST — legitimate exceptions. Starts EMPTY: you fill it, one entry per file,
//     with `category` + `reason` (both mandatory — the test verifies it). Adding
//     an entry is an explicit, PR-reviewable change.
export const ALLOWLIST = [
  // {
  //   file: 'src/lib/bootstrap.ts',
  //   category: 'bootstrap-context',
  //   reason: 'resolves the context from which everything else is then channeled',
  // },
];

// (4) Where to scan + what to scan.
const SCAN_DIRS = ['apps', 'packages', 'src'];
const SKIP_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.next',
  '.turbo',
  'coverage',
  'tests',
  '__tests__',
]);
// Files that DEFINE the forbidden symbol — they aren't "uses". Adapt.
const DEFINITION_FILES = new Set([]);

// ---------------------------------------------------------------------------
// Exported pure functions (testable in isolation).
// ---------------------------------------------------------------------------

/**
 * Strips comments (`//` and block) preserving the line count, so that the
 * forbidden pattern cited in a comment/JSDoc isn't mistaken for a real use.
 * Deliberately simple approximation (doesn't handle `//`/`/*` inside a string literal).
 * @param {string} text
 * @returns {string}
 */
export function stripComments(text) {
  let inBlock = false;
  return text
    .split('\n')
    .map((line) => {
      let out = '';
      let i = 0;
      while (i < line.length) {
        if (inBlock) {
          const end = line.indexOf('*/', i);
          if (end === -1) {
            i = line.length;
          } else {
            inBlock = false;
            i = end + 2;
          }
        } else {
          const lineComment = line.indexOf('//', i);
          const blockStart = line.indexOf('/*', i);
          if (blockStart !== -1 && (lineComment === -1 || blockStart < lineComment)) {
            out += line.slice(i, blockStart);
            inBlock = true;
            i = blockStart + 2;
          } else if (lineComment !== -1) {
            out += line.slice(i, lineComment);
            i = line.length;
          } else {
            out += line.slice(i);
            i = line.length;
          }
        }
      }
      return out;
    })
    .join('\n');
}

/**
 * Analyzes a file's source and says whether it contains a FORBIDDEN (non-channeled) use.
 * @param {string} source  file content
 * @returns {{ violating: boolean, lines: number[] }}
 */
export function classifyFile(source) {
  const text = stripComments(source);
  const lines = text.split('\n');
  const hitLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!FORBIDDEN_RE.test(line)) continue;

    // (A) inline-channeled → allowed
    if (SCOPED_INLINE_RE.test(line)) continue;

    // (B) assignment: allowed only if the variable is never dereferenced
    const assign = line.match(ASSIGN_RE);
    if (assign) {
      const id = assign[1];
      const dereferenced = new RegExp(`\\b${id}\\s*\\.`).test(text);
      if (dereferenced) hitLines.push(i + 1);
      continue;
    }

    // (C) any other non-channeled use → violation
    hitLines.push(i + 1);
  }

  return { violating: hitLines.length > 0, lines: hitLines };
}

function walk(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIR_NAMES.has(e.name)) continue;
      walk(path.join(dir, e.name), acc);
    } else if (e.isFile()) {
      if (!/\.(ts|tsx|js|jsx)$/.test(e.name)) continue;
      if (/\.test\.(ts|tsx|js|jsx)$/.test(e.name)) continue;
      acc.push(path.join(dir, e.name));
    }
  }
  return acc;
}

/**
 * Scans the repo and returns violations + stale allow-list entries.
 * @param {string} rootDir  repo root
 * @param {Array<{file:string}>} allowlist
 * @returns {{ violations: Array<{file:string,lines:number[]}>, stale: Array<{file:string,reason:string}> }}
 */
export function checkRepo(rootDir, allowlist) {
  const allowSet = new Set(allowlist.map((e) => e.file));
  const files = [];
  for (const d of SCAN_DIRS) walk(path.join(rootDir, d), files);

  const violations = [];
  const violatingFiles = new Set();

  for (const abs of files) {
    const rel = path.relative(rootDir, abs).split(path.sep).join('/');
    if (DEFINITION_FILES.has(rel)) continue;
    const { violating, lines } = classifyFile(fs.readFileSync(abs, 'utf8'));
    if (!violating) continue;
    violatingFiles.add(rel);
    if (!allowSet.has(rel)) violations.push({ file: rel, lines });
  }

  // Stale entries: in the allow-list but the file no longer exists / no longer violates.
  const stale = [];
  for (const entry of allowlist) {
    const abs = path.join(rootDir, entry.file);
    if (!fs.existsSync(abs)) stale.push({ file: entry.file, reason: 'file does not exist' });
    else if (!violatingFiles.has(entry.file))
      stale.push({ file: entry.file, reason: 'no longer uses the forbidden pattern' });
  }

  return { violations, stale };
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------

function main() {
  const { violations, stale } = checkRepo(REPO_ROOT, ALLOWLIST);

  if (violations.length === 0 && stale.length === 0) {
    console.log(`[guard] OK — ${ALLOWLIST.length} file(s) allow-listed, no forbidden use outside the list.`);
    return 0;
  }

  if (violations.length > 0) {
    console.error(`\n[guard] ✗ ${violations.length} file(s) use the FORBIDDEN pattern outside the allow-list:\n`);
    for (const v of violations) console.error(`  • ${v.file} (line(s): ${v.lines.join(', ')})`);
    console.error(
      '\nFix it in one of two ways:\n' +
        '  1. channel the use into the allowed form (see SCOPED_INLINE_RE);\n' +
        "  2. if the use is legitimate, add the file to the ALLOWLIST with category + reason.",
    );
  }

  if (stale.length > 0) {
    console.error(`\n[guard] ✗ ${stale.length} stale entry(ies) in the allow-list:\n`);
    for (const s of stale) console.error(`  • ${s.file} — ${s.reason}`);
    console.error('\nRemove the stale entries from the ALLOWLIST.');
  }

  return 1;
}

// Run main() SOLELY if launched directly (not when the test imports the pure functions).
// `pathToFileURL` normalizes argv[1] into a file:// URL → CROSS-PLATFORM comparison.
// (On Windows import.meta.url is "file:///C:/..." while `file://${argv[1]}` would be
//  "file://C:\\..." with backslashes → they NEVER match → main() silently won't run.)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
