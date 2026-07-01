#!/usr/bin/env node
// KIT · [Node-ref] — COHERENCE sentinel for the living docs (SUPERSET of the direction layer).
//
// The automatic, severity-aware version of the manual audit-drift ritual (Axiom 1: "if it matters
// that it's true, a machine must verify it"). It checks:
//   [direction]  PDR headers, Propagation checkboxes, north-star freshness, stale banners in ADRs.
//   [coherence]  broken internal `.md` links (F1) · dangling ADR/PDR references (F1) ·
//                ambiguity markers `[TO-CLARIFY: …]` / `<!-- ASSUMED: … -->` (F5) ·
//                Board hygiene: stale handoff + declared blockers (F8).
//
// GUARDS-ARE-TESTED (handbook/08 §8): the PURE logic is EXPORTED and separated from I/O —
// parseDirection/analyzeDirection/extractMarkers/extractLocalLinks/findDanglingRefs/
// assessBoardStaleness/parseStateForBoard touch neither filesystem nor exit. Test: tests/check-coherence.test.mjs.
//
// All [coherence] checks are WARNINGS (they don't bump the exit code): they nag but don't block.
// Exit 0 = ok / warnings only.  Exit 1 = structural [direction] incoherence. In pre-push it runs in
// warning-mode (`|| true`) → never blocks (safe if multiple sessions share the working tree).
//
// Usage: `{{PKG_MANAGER}} coherence:check`  (historical alias `{{PKG_MANAGER}} direction:check`).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// {{DOCS_ROOT}} — docs root (default 'docs'); change it HERE if different (e.g. 'context').
const DOCS_ROOT = 'docs';
// {{ARCHIVE_DIRS}} — FROZEN archive folders (not maintained): excluded from the coherence
// checks so we don't nag about historical links. E.g. an 'NN-phases/' dir of archived v1 work.
const ARCHIVE_DIRS = new Set([/* e.g. '10-phases' */]);
// Board staleness threshold (days since last handoff): catch the real stalls (weeks).
const BOARD_STALENESS_DAYS = 14;

export const VALID_STATES = new Set([
  'idea',
  'decided',
  'propagating',
  'propagated',
  'abandoned',
]);
export const NAGGING_STATES = new Set(['decided', 'propagating']); // "must" propagate

// === [direction] PURE parse of DIRECTION.md =================================
// Returns { pdrs, northStarDate, malformed, invalidStates }. No side-effects.
export function parseDirection(content) {
  const pdrs = [];
  const malformed = [];
  const invalidStates = [];
  const lines = content.split('\n');

  const nsMatch = content.match(/<!--\s*north-star:updated\s+(\d{4}-\d{2}-\d{2})\s*-->/);
  const northStarDate = nsMatch ? nsMatch[1] : null;

  const headRe =
    /^###\s+(PDR-\d{3})\s+—\s+(.+?)\s+·\s+state:\s+([a-z-]+)\s+·\s+(\d{4}-\d{2}-\d{2})\s*$/;
  const looseHeadRe = /^###\s+PDR-\d{3}\b/;

  let current = null;
  let inPropagation = false;
  let inFence = false; // inside a ``` or ~~~ code block → example, not a real entry
  const closeCurrent = () => {
    if (current) pdrs.push(current);
    current = null;
    inPropagation = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    if (looseHeadRe.test(line)) {
      closeCurrent();
      const m = line.match(headRe);
      if (!m) {
        malformed.push({ line: i + 1, text: line.trim() });
        continue;
      }
      const [, id, title, state, date] = m;
      if (!VALID_STATES.has(state)) invalidStates.push({ id, state, line: i + 1 });
      current = { id, title: title.trim(), state, date, line: i + 1, open: 0, done: 0 };
      continue;
    }

    if (!current) continue;

    if (/^##\s/.test(line) || (/^###\s/.test(line) && !looseHeadRe.test(line))) {
      closeCurrent();
      continue;
    }
    if (/^\*\*Propagation\*\*/.test(line)) {
      inPropagation = true;
      continue;
    }
    if (inPropagation && /^\*\*[^*]+\*\*/.test(line) && !/^\*\*Propagation\*\*/.test(line)) {
      inPropagation = false;
    }
    if (inPropagation) {
      if (/^\s*-\s+\[\s\]/.test(line)) current.open++;
      else if (/^\s*-\s+\[x\]/i.test(line)) current.done++;
    }
  }
  closeCurrent();

  return { pdrs, northStarDate, malformed, invalidStates };
}

// PURE analysis of the direction layer: returns { errors, warnings }.
export function analyzeDirection(parsed, adrRefs = []) {
  const { pdrs, northStarDate, malformed, invalidStates } = parsed;
  const errors = [];
  const warnings = [];
  const byId = new Map(pdrs.map((p) => [p.id, p]));

  for (const m of malformed) {
    errors.push(
      `malformed PDR header at line ${m.line}: "${m.text}". Expected: "### PDR-NNN — Title · state: <token> · YYYY-MM-DD".`,
    );
  }
  for (const s of invalidStates) {
    errors.push(
      `${s.id}: state "${s.state}" is invalid (line ${s.line}). Allowed: ${[...VALID_STATES].join(', ')}.`,
    );
  }
  if (pdrs.length === 0) warnings.push('no PDR entry found in the log — is §2 empty?');

  const latestPdrDate = pdrs.reduce((acc, p) => (p.date > acc ? p.date : acc), '0000-00-00');
  if (northStarDate && latestPdrDate > northStarDate) {
    warnings.push(
      `the north-star (§1) is updated to ${northStarDate} but the latest pivot is ${latestPdrDate} → review "Current model" and bump the north-star:updated marker.`,
    );
  } else if (!northStarDate) {
    warnings.push('the <!-- north-star:updated YYYY-MM-DD --> marker is missing in §1.');
  }

  for (const p of pdrs) {
    if (p.state === 'propagated' && p.open > 0) {
      errors.push(
        `${p.id} is marked "propagated" but has ${p.open} touch-point(s) still open (line ${p.line}). Either complete the boxes, or move it back to "propagating".`,
      );
    }
    if (NAGGING_STATES.has(p.state) && p.open > 0) {
      warnings.push(
        `${p.id} "${p.title}" [${p.state}] — ${p.open} touch-point(s) to propagate (${p.done} done). See §2 of the entry.`,
      );
    }
  }

  for (const { pdrId, file } of adrRefs) {
    const p = byId.get(pdrId);
    if (!p) {
      errors.push(`${file} cites "direction:stale ${pdrId}" but ${pdrId} does not exist in the §2 log.`);
    } else if (p.state === 'abandoned') {
      errors.push(
        `${file} is flagged stale by ${pdrId}, but ${pdrId} is "abandoned" — remove the banner or reopen the pivot.`,
      );
    }
  }

  return { errors, warnings };
}

// === [coherence] PURE functions (unit-testable) ============================

// Blocking ambiguity marker. `TBD`/`TODO` NOT included: they are deliberate deferrals. Skip the
// placeholder notes (ellipsis/dots only) = examples that DESCRIBE the syntax in the docs.
const isMarkerPlaceholder = (s) => /^[….\s]*$/.test(s);
export function extractMarkers(text) {
  const out = [];
  for (const m of text.matchAll(/\[TO-CLARIFY:\s*([^\]]*)\]/g)) {
    const note = m[1].trim();
    if (!isMarkerPlaceholder(note)) out.push({ kind: 'TO-CLARIFY', note });
  }
  for (const m of text.matchAll(/<!--\s*ASSUMED:\s*([^>]*?)\s*-->/g)) {
    const note = m[1].trim();
    if (!isMarkerPlaceholder(note)) out.push({ kind: 'ASSUMED', note });
  }
  return out;
}

// LOCAL markdown link targets (excludes http/mailto/tel, pure anchors, placeholders {} <> * `).
export function extractLocalLinks(text) {
  const out = [];
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = m[1].trim();
    if (!target) continue;
    if (/^(https?:|mailto:|tel:|#)/i.test(target)) continue;
    if (/[{}<>*`]/.test(target)) continue;
    target = target.split('#')[0].split('?')[0].trim();
    if (target) out.push(target);
  }
  return out;
}

// Dangling ADR/PDR references: a cited number that doesn't exist among the known ones.
export function findDanglingRefs(text, adrNumbers, pdrNumbers) {
  const out = [];
  for (const m of text.matchAll(/\bADR[\s-]?(\d{3})\b/g)) {
    if (!adrNumbers.has(m[1])) out.push({ kind: 'ADR', id: m[1] });
  }
  for (const m of text.matchAll(/\bPDR-(\d{3})\b/g)) {
    if (!pdrNumbers.has(m[1])) out.push({ kind: 'PDR', id: m[1] });
  }
  return out;
}

// Board hygiene: stale handoff + declared blockers. Returns an array of warnings.
export function assessBoardStaleness(
  { inVoloCount, lastHandoffMs, hasBlockers },
  nowMs,
  thresholdDays = BOARD_STALENESS_DAYS,
) {
  const out = [];
  if (inVoloCount > 0 && lastHandoffMs != null) {
    const days = Math.floor((nowMs - lastHandoffMs) / 86_400_000);
    if (days > thresholdDays) {
      out.push(
        `Board: ${inVoloCount} "In flight" item(s) but last handoff ${days}d ago (threshold ${thresholdDays}d) → the Board may be stale (refresh with handoff).`,
      );
    }
  }
  if (hasBlockers) out.push('Board: blockers declared in the frontmatter (check they are still real).');
  return out;
}

// Extracts from STATE.md content the fields for staleness (pure on string). NB: for the "In flight"
// count don't use `\Z` (in JS regex it would mean the letter "Z", and timestamps end in "Z").
export function parseStateForBoard(content) {
  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  const block = fm ? fm[1] : '';
  const handoffM = block.match(/^last_session_handoff_at:\s*(.+)$/m);
  const raw = handoffM ? handoffM[1].trim() : null;
  let lastHandoffMs = null;
  if (raw && raw !== 'null') {
    const parsed = Date.parse(raw);
    lastHandoffMs = Number.isNaN(parsed) ? null : parsed;
  }
  const blockersM = block.match(/^blockers:\s*(.*)$/m);
  let hasBlockers = false;
  if (blockersM) {
    const v = blockersM[1].trim();
    if (v && !/^\[\s*\]$/.test(v)) hasBlockers = true;
  }
  let inVoloCount = 0;
  const inVolo = content.match(/###\s+[^\n]*In flight[^\n]*\n([\s\S]*?)(?=\n#{1,6}\s|$)/);
  if (inVolo) inVoloCount = (inVolo[1].match(/^\s*[-*]\s+\S/gm) || []).length;
  return { lastHandoffMs, hasBlockers, inVoloCount };
}

// === I/O ===================================================================

function scanAdrBanners(adrDir, root) {
  const refs = [];
  if (!fs.existsSync(adrDir)) return refs;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) {
        const txt = fs.readFileSync(full, 'utf8');
        for (const m of txt.matchAll(/<!--\s*direction:stale\s+(PDR-\d{3})\s*-->/g)) {
          refs.push({ pdrId: m[1], file: path.relative(root, full) });
        }
      }
    }
  };
  walk(adrDir);
  return refs;
}

function walkMdFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || ARCHIVE_DIRS.has(entry.name)) {
        continue;
      }
      out.push(...walkMdFiles(full));
    } else if (entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

// Auto-generated files (maps) declare "Auto-generated" at the top: fixing their links lives in the
// generator, not by hand → we skip them.
const isGenerated = (text) => /auto-generated/i.test(text.slice(0, 800));

function collectAdrNumbers(adrDir) {
  const nums = new Set();
  if (!fs.existsSync(adrDir)) return nums;
  for (const name of fs.readdirSync(adrDir)) {
    const m = name.match(/^(\d{3})-.*\.md$/);
    if (m) nums.add(m[1]);
  }
  return nums;
}

// A link resolves as a file/dir, or in the doc-site forms (Astro/Starlight): strip trailing slash,
// `.md`/`.mdx`, or `index.md`/`index.mdx`.
function linkResolves(root, fileDir, target) {
  const base = target.startsWith('/') ? path.join(root, target) : path.resolve(fileDir, target);
  const noSlash = base.replace(/\/+$/, '');
  return [
    base,
    noSlash,
    `${noSlash}.md`,
    `${noSlash}.mdx`,
    path.join(noSlash, 'index.md'),
    path.join(noSlash, 'index.mdx'),
  ].some((c) => fs.existsSync(c));
}

// [coherence] checks across all living docs. Returns an array of warnings.
function checkCoherenceFiles(root, pdrNumbers) {
  const warnings = [];
  const docsDir = path.join(root, DOCS_ROOT);
  const adrNumbers = collectAdrNumbers(path.join(docsDir, 'architecture/decisions'));
  const files = walkMdFiles(docsDir);
  const rootClaude = path.join(root, 'CLAUDE.md');
  if (fs.existsSync(rootClaude)) files.push(rootClaude);

  const danglingSeen = new Set();
  for (const file of files) {
    const rel = path.relative(root, file);
    const text = fs.readFileSync(file, 'utf8');
    if (isGenerated(text)) continue;
    const fileDir = path.dirname(file);

    for (const target of extractLocalLinks(text)) {
      if (!linkResolves(root, fileDir, target)) {
        warnings.push(`broken link in ${rel}: "${target}" → file does not exist.`);
      }
    }
    for (const mk of extractMarkers(text)) {
      warnings.push(`${mk.kind} marker in ${rel}${mk.note ? `: "${mk.note}"` : ''} — resolve before closing.`);
    }
    for (const ref of findDanglingRefs(text, adrNumbers, pdrNumbers)) {
      const key = `${ref.kind}-${ref.id}-${rel}`;
      if (danglingSeen.has(key)) continue;
      danglingSeen.add(key);
      warnings.push(`dangling reference in ${rel}: ${ref.kind} ${ref.id} does not exist.`);
    }
  }

  const statePath = path.join(docsDir, 'implementation/STATE.md');
  if (fs.existsSync(statePath)) {
    warnings.push(...assessBoardStaleness(parseStateForBoard(fs.readFileSync(statePath, 'utf8')), Date.now()));
  }
  return warnings;
}

const C = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const ROOT = path.resolve(__dirname, '..');
  const DIRECTION = path.join(ROOT, DOCS_ROOT, 'DIRECTION.md');
  const ADR_DIR = path.join(ROOT, DOCS_ROOT, 'architecture/decisions');

  const errors = [];
  const warnings = [];
  let pdrNumbers = new Set();

  if (fs.existsSync(DIRECTION)) {
    const parsed = parseDirection(fs.readFileSync(DIRECTION, 'utf8'));
    const adrRefs = scanAdrBanners(ADR_DIR, ROOT);
    const d = analyzeDirection(parsed, adrRefs);
    errors.push(...d.errors);
    warnings.push(...d.warnings);
    pdrNumbers = new Set(parsed.pdrs.map((p) => p.id.replace('PDR-', '')));
    const counts = {};
    for (const p of parsed.pdrs) counts[p.state] = (counts[p.state] || 0) + 1;
    const summary = Object.entries(counts)
      .map(([s, n]) => `${n} ${s}`)
      .join(' · ');
    console.log(
      C.dim(`[coherence] log: ${parsed.pdrs.length} PDR (${summary || '—'}) · flagged ADRs: ${adrRefs.length}`),
    );
  } else {
    console.log(`[coherence] ${DOCS_ROOT}/DIRECTION.md not found — skipping direction layer.`);
  }

  warnings.push(...checkCoherenceFiles(ROOT, pdrNumbers));

  for (const e of errors) console.error(C.red(`[coherence] ERROR: ${e}`));
  for (const w of warnings) console.log(C.yellow(`[coherence] ⚠ ${w}`));

  if (errors.length > 0) {
    console.error(C.red(`\n[coherence] ${errors.length} structural [direction] error(s).`));
    return 1;
  }
  if (warnings.length > 0) {
    console.log(C.yellow(`\n[coherence] ${warnings.length} reminder(s) (non-blocking).`));
  } else {
    console.log(C.green('[coherence] living docs are coherent. ✓'));
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
