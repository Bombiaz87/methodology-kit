#!/usr/bin/env node
// KIT · [Node-ref] — "docs-as-data" linter: parses the YAML frontmatter over a tree of .md files and
// verifies the graph's integrity (existing refs, no dup-id, no self-ref, no cycles via DFS,
// id == filename-prefix, status enum). Expected behavior: error (exit 1) on structural
// breakages, warning (exit 0) on conventions; wired into pre-push + by hand.
//
// GUARDS-ARE-TESTED (handbook/08 §8): the graph logic is EXPORTED as a PURE function
// validateGraph(docs) — takes already-parsed documents, returns {errors, warnings}, no I/O.
// Test: scripts/tests/validate-docs.test.mjs.
//
// js-yaml is loaded DYNAMICALLY (await import) only in the I/O: so the test (which uses only
// validateGraph) runs without dependencies, and the guard stays runnable even if the record folder
// doesn't exist yet. js-yaml must still be declared as a dep for real use (see snippet).
//
// Errors (exit 1): missing/unparsable frontmatter · missing id · id≠filename-prefix ·
//   duplicate id · self-reference · depends_on→nonexistent id · cycle · status out of enum.
// Warning (exit 0): enables→id not yet created (forward ref to a planned doc).
//
// Wired into pre-push + manually via `{{PKG_MANAGER}} validate-docs`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// {{DOCS_ROOT}} — docs root (default 'docs'); change it HERE if different (e.g. 'context').
const DOCS_ROOT = 'docs';
export const VALID_STATUSES = ['pending', 'in-progress', 'blocked', 'completed'];
export const FILENAME_ID_RE = /^(\d{2}[a-z]?-\d{2})/; // id prefix from the filename
const DEPENDS_FIELD = 'depends_on'; // backward ref (must exist)
const ENABLES_FIELD = 'enables'; // forward ref (may not exist yet)
const SKIP_FILE = (f) => f === 'README.md' || f.endsWith('-vc.md') || !f.endsWith('.md');

// --- PURE: validates a graph of ALREADY-parsed documents. No I/O, no exit. --------------------
// docs = [{ id, status?, depends_on?, enables?, _filename }]
export function validateGraph(docs) {
  const errors = [];
  const warnings = [];
  const idMap = new Map();

  for (const d of docs) {
    if (idMap.has(d.id)) {
      errors.push(`duplicate id "${d.id}" (${d._filename} and ${idMap.get(d.id)._filename})`);
    } else {
      idMap.set(d.id, d);
    }
  }

  for (const doc of docs) {
    const dependsOn = doc[DEPENDS_FIELD] || [];
    const enables = doc[ENABLES_FIELD] || [];

    const fnId = doc._filename ? doc._filename.match(FILENAME_ID_RE)?.[1] : null;
    if (fnId && fnId !== doc.id) {
      errors.push(`id "${doc.id}" does not match the filename prefix "${fnId}" (${doc._filename})`);
    }
    if (doc.status && !VALID_STATUSES.includes(doc.status)) {
      errors.push(`${doc.id}: status "${doc.status}" invalid (allowed: ${VALID_STATUSES.join(', ')})`);
    }
    if (dependsOn.includes(doc.id)) errors.push(`${doc.id}: self-reference in ${DEPENDS_FIELD}`);
    if (enables.includes(doc.id)) errors.push(`${doc.id}: self-reference in ${ENABLES_FIELD}`);
    for (const dep of dependsOn) {
      if (!idMap.has(dep)) errors.push(`${doc.id} ${DEPENDS_FIELD} "${dep}" that does NOT exist`);
    }
    for (const en of enables) {
      if (!idMap.has(en)) warnings.push(`${doc.id} ${ENABLES_FIELD} "${en}" not yet created. OK if planned.`);
    }
  }

  // Cycles (DFS over the existing backward dependencies).
  const edges = new Map();
  for (const d of docs) edges.set(d.id, new Set((d[DEPENDS_FIELD] || []).filter((x) => idMap.has(x))));
  const reported = new Set();
  function dfs(node, stack) {
    stack.add(node);
    for (const dep of edges.get(node) || []) {
      if (stack.has(dep)) {
        const chain = [...stack, dep].join(' → ');
        if (!reported.has(chain)) {
          errors.push(`dependency cycle: ${chain}`);
          reported.add(chain);
        }
        return true;
      }
      if (dfs(dep, stack)) return true;
    }
    stack.delete(node);
    return false;
  }
  const visited = new Set();
  for (const d of docs) {
    if (!visited.has(d.id)) {
      dfs(d.id, new Set());
      visited.add(d.id);
    }
  }

  return { errors, warnings };
}

// --- I/O: collects and parses the frontmatter (js-yaml loaded dynamically). -------------------
async function collectDocs(docsDir, root) {
  if (!fs.existsSync(docsDir)) {
    console.log(`[validate-docs] ${path.relative(root, docsDir)} does not exist — no documents to validate`);
    return { docs: [], parseErrors: [] };
  }
  const { default: yaml } = await import('js-yaml'); // dynamic: the test doesn't pull it in
  const docs = [];
  const parseErrors = [];
  const rel = (p) => path.relative(root, p);
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
        walk(full);
      } else if (!SKIP_FILE(ent.name)) {
        const m = fs.readFileSync(full, 'utf8').match(/^---\n([\s\S]*?)\n---/);
        if (!m) {
          parseErrors.push(`missing/unparsable frontmatter in ${rel(full)}`);
          continue;
        }
        let fm;
        try {
          fm = yaml.load(m[1]);
        } catch (e) {
          parseErrors.push(`YAML parse error in ${rel(full)}: ${e.message}`);
          continue;
        }
        if (!fm || !fm.id) {
          parseErrors.push(`missing id in the frontmatter of ${rel(full)}`);
          continue;
        }
        docs.push({ ...fm, _filename: ent.name });
      }
    }
  };
  walk(docsDir);
  return { docs, parseErrors };
}

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const ROOT = path.resolve(__dirname, '..');
  const DOCS_DIR = path.join(ROOT, DOCS_ROOT, 'implementation/10-record');

  const { docs, parseErrors } = await collectDocs(DOCS_DIR, ROOT);
  if (docs.length === 0 && parseErrors.length === 0) {
    console.log('[validate-docs] zero documents found — nothing to validate');
    return 0;
  }
  const { errors, warnings } = validateGraph(docs);
  const allErrors = [...parseErrors, ...errors];
  for (const e of allErrors) console.error(`\x1b[31m[validate-docs] ERROR: ${e}\x1b[0m`);
  for (const w of warnings) console.warn(`\x1b[33m[validate-docs] WARN: ${w}\x1b[0m`);

  if (allErrors.length > 0) {
    console.error(`\n\x1b[31m[validate-docs] ${allErrors.length} errors, ${warnings.length} warnings. Push BLOCKED.\x1b[0m`);
    return 1;
  }
  console.log(`\x1b[32m[validate-docs] ${docs.length} valid documents, ${warnings.length} warnings.\x1b[0m`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => process.exit(code)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
