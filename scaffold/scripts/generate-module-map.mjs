#!/usr/bin/env node
// KIT · [Node-ref] — generator: emits the "module geography" as a committed .md (per app/package: responsibility, entry file, weight, local context, cited ADRs). Expected behavior: an orientation first-read for an agent landing cold; manual run (NOT in a hook), modules change rarely.
//
// scripts/generate-module-map.mjs
// Auto-generates docs/implementation/30-reference/module-map.md: a code-level index of
// "where what lives". For each module in the repo → responsibility, entry file to
// start reading from, weight (n. sources), local context (CLAUDE.md), cited ADRs.
//
// In plain language: a map of the code for whoever arrives from scratch (human or agent),
// so they grasp the project's geography without groping around. It regenerates on command.
//
// Sources: the modules' package.json + presence of a local CLAUDE.md + ADRs cited in the description.
//
// Usage: `{{PKG_MANAGER}} gen-module-map`. It is NOT part of any hook.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// --- Tunable constants --------------------------------------------------------
// {{DOCS_ROOT}} — docs root (default 'docs'); change it HERE if different (e.g. 'context').
const DOCS_ROOT = 'docs';
const OUTPUT_FILE = path.join(ROOT, DOCS_ROOT, 'implementation/30-reference/module-map.md');
// Workspace folders to scan. For a single-package repo, use ['.'].
const WORKSPACE_DIRS = ['apps', 'packages'];
// Candidate entry files, in priority order. Adapt to your {{STACK}}.
const ENTRY_CANDIDATES = [
  'src/index.ts',
  'src/index.tsx',
  'src/main.ts',
  'src/server.ts',
  'src/app', // app router (directory)
];

function logInfo(msg) {
  console.log(`[gen-module-map] ${msg}`);
}

function detectEntry(modDir) {
  for (const cand of ENTRY_CANDIDATES) {
    const full = path.join(modDir, cand);
    if (fs.existsSync(full)) {
      return fs.statSync(full).isDirectory() ? `${cand}/` : cand;
    }
  }
  return '—';
}

// Counts the sources under src/ as a proxy for the module's "weight". Adapt the extensions to your {{STACK}}.
function countSources(modDir) {
  const srcDir = path.join(modDir, 'src');
  if (!fs.existsSync(srcDir)) return 0;
  let count = 0;
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (/\.(ts|tsx|js|jsx)$/.test(ent.name)) count++;
    }
  };
  walk(srcDir);
  return count;
}

// Extracts "ADR NNN" and "mini-ADR NN/NNNN" references from the description (dedup, order of appearance).
function extractAdrs(text) {
  const refs = [];
  const seen = new Set();
  const re = /\b(?:mini-ADR\s+\d{2}\/\d{4}|ADR\s+\d{3})\b/gi;
  for (const m of text.matchAll(re)) {
    const norm = m[0].replace(/\s+/g, ' ');
    const key = norm.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      refs.push(norm);
    }
  }
  return refs;
}

function readPackage(modDir) {
  const pjPath = path.join(modDir, 'package.json');
  if (!fs.existsSync(pjPath)) return null;
  let pj;
  try {
    pj = JSON.parse(fs.readFileSync(pjPath, 'utf8'));
  } catch {
    return null;
  }
  const description = (pj.description || '').replace(/\s+/g, ' ').trim();
  return {
    dir: path.relative(ROOT, modDir),
    name: pj.name || '?',
    description,
    entry: detectEntry(modDir),
    sources: countSources(modDir),
    hasContextMd: fs.existsSync(path.join(modDir, 'CLAUDE.md')),
    adrs: extractAdrs(description),
  };
}

function collectModules() {
  const mods = [];
  for (const ws of WORKSPACE_DIRS) {
    const wsDir = path.join(ROOT, ws);
    if (!fs.existsSync(wsDir)) continue;
    // Single-package repo: the package.json is at the workspace root.
    const rootPkg = readPackage(wsDir);
    if (rootPkg) {
      mods.push({ ...rootPkg, workspace: ws });
      continue;
    }
    for (const ent of fs.readdirSync(wsDir, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const mod = readPackage(path.join(wsDir, ent.name));
      if (mod) mods.push({ ...mod, workspace: ws });
    }
  }
  // Sort by descending weight, with a STABLE tiebreak on the name → deterministic output
  // (independent of readdir order): regenerating produces no spurious diffs on equal-weight ties.
  return mods.sort((a, b) => b.sources - a.sources || a.dir.localeCompare(b.dir));
}

function renderTable(mods) {
  const lines = [
    '| Module | Pkg | Files | Entry | Ctx | ADR | Responsibility |',
    '|--------|-----|-----:|-------|:---:|-----|----------------|',
  ];
  for (const m of mods) {
    const ctx = m.hasContextMd ? '📖' : '—';
    const adr = m.adrs.length ? m.adrs.join(', ') : '—';
    const resp = m.description || '_(no description in package.json)_';
    lines.push(`| \`${m.dir}\` | \`${m.name}\` | ${m.sources} | \`${m.entry}\` | ${ctx} | ${adr} | ${resp} |`);
  }
  return lines.join('\n');
}

function main() {
  const all = collectModules();
  const apps = all.filter((m) => m.workspace === 'apps');
  const packages = all.filter((m) => m.workspace !== 'apps');
  const withCtx = all.filter((m) => m.hasContextMd).map((m) => m.dir);

  const out = `---
title: "Module map — the code geography"
---

> **Auto-generated** by \`scripts/generate-module-map.mjs\` (\`{{PKG_MANAGER}} gen-module-map\`). Do not edit by hand.
>
> A code-level orientation index: each module → responsibility, entry file to
> start reading from, weight (n. sources under \`src/\`), local context, governing ADRs.

_Idempotent: no non-deterministic timestamp → the output is a pure function of the module tree. A clean \`git status\` after \`gen-module-map\` = the map is aligned. The "when" is in the file's git log._

**Legend**: **Files** = n. sources under \`src/\` (weight proxy). **Ctx** 📖 = a local \`CLAUDE.md\`
exists with deeper context, read it before working in the area. **Entry** = file/dir to start reading from.

---

## Apps (${apps.length}) — executable surfaces

${renderTable(apps)}

## Packages (${packages.length}) — shared libraries

${renderTable(packages)}

---

## Reading notes

- **Where to start**: the **Entry** column points to the module's entry point.
- **Deep context**: modules with 📖 have a local \`CLAUDE.md\` — ${withCtx.length} out of ${all.length}: ${withCtx.map((d) => `\`${d}\``).join(', ') || '—'}.
- **Decisions**: the **ADR** column lists the ADRs/mini-ADRs cited in the package description.
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, out, 'utf8');
  logInfo(`wrote ${path.relative(ROOT, OUTPUT_FILE)} — ${all.length} modules (${apps.length} app, ${packages.length} package)`);
}

main();
