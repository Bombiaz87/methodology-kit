#!/usr/bin/env node
// KIT · [Node-ref] — generator: emits an ADR→status matrix (planning + implementation) as a committed .md, with an "Auto-generated — do not edit by hand" header. Expected behavior: manual run (NOT in a hook), crosses ADRs with a record manifest to give the cross-cutting view "which decision is implemented and where".
//
// scripts/generate-adr-map.mjs
// Auto-generates docs/implementation/30-reference/adr-map.md: each ADR (architectural
// decision) → planning status + implementation status + where it is realized.
//
// In plain language: it produces a table that, at a glance, tells you which architecture
// decisions you've made and how far along you are in realizing them. It regenerates on command,
// not on every commit (so as not to clutter the git history with noise).
//
// Sources:
//   - docs/architecture/decisions/*.md (ADR list + status, from frontmatter/heading)
//   - docs/implementation/MANIFEST.json (records with an `adr: ["NNN", ...]` field)
//
// Usage: `{{PKG_MANAGER}} gen-adr-map`. It is NOT part of any hook.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// --- Tunable constants --------------------------------------------------------
// {{DOCS_ROOT}} — docs root (default 'docs'); change it HERE if different (e.g. 'context').
const DOCS_ROOT = 'docs';
const ADR_DIR = path.join(ROOT, DOCS_ROOT, 'architecture/decisions');
const MANIFEST_FILE = path.join(ROOT, DOCS_ROOT, 'implementation/MANIFEST.json');
const OUTPUT_FILE = path.join(ROOT, DOCS_ROOT, 'implementation/30-reference/adr-map.md');

function logInfo(msg) {
  console.log(`[gen-adr-map] ${msg}`);
}

function listAdrs() {
  if (!fs.existsSync(ADR_DIR)) return [];
  return fs
    .readdirSync(ADR_DIR)
    .filter((f) => /^\d{3}-/.test(f) && f.endsWith('.md'))
    .sort()
    .map((f) => {
      const filepath = path.join(ADR_DIR, f);
      const content = fs.readFileSync(filepath, 'utf8');
      const id = f.match(/^(\d{3})-/)[1];
      const titleMatch = content.match(/^title:\s*"?([^"\n]+?)"?$/m);
      const statusMatch = content.match(/^\*\*Status:\*\*\s*(.+)$/m);
      return {
        id,
        slug: f.replace(/\.md$/, ''),
        title: titleMatch ? titleMatch[1].trim().replace(/"$/, '') : f,
        status: statusMatch ? statusMatch[1].trim() : 'unknown',
      };
    });
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_FILE)) return { records: [] };
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  } catch {
    return { records: [] };
  }
}

// Builds adrId → [{recordId, recordStatus, ...}] from the manifest.
// The expected manifest is { records: [{ id, slug, status, adr: ["NNN", ...] }, ...] }.
function buildAdrMap(manifest) {
  const adrMap = new Map();
  for (const r of manifest.records || []) {
    for (const adr of r.adr || []) {
      if (!adrMap.has(adr)) adrMap.set(adr, []);
      adrMap.get(adr).push({ recordId: r.id, recordSlug: r.slug, recordStatus: r.status });
    }
  }
  return adrMap;
}

function deriveImplStatus(refs) {
  if (!refs || refs.length === 0) return '⚪ pending';
  if (refs.every((r) => r.recordStatus === 'completed')) return '🟢 completed';
  if (refs.some((r) => ['in-progress', 'blocked', 'completed'].includes(r.recordStatus)))
    return '🟡 in progress';
  return '⚪ pending';
}

function generateMarkdown(adrs, adrMap) {
  const rows = adrs.map((adr) => {
    const refs = adrMap.get(adr.id) || [];
    const implStatus = deriveImplStatus(refs);
    const records = refs.map((r) => `${r.recordId} (${r.recordStatus})`).join('<br>') || '—';
    return `| ADR ${adr.id} | [${adr.title}](../../architecture/decisions/${adr.slug}.md) | ${adr.status} | ${implStatus} | ${records} |`;
  });

  return `---
title: "ADR map — decision → status"
---

> **Auto-generated** by \`scripts/generate-adr-map.mjs\` — do not edit by hand.
>
> Cross-cutting view: each ADR → planning status + implementation status + records that realize it.

_Idempotent: no non-deterministic timestamp → the output is a pure function of ADRs + MANIFEST. A clean \`git status\` after \`gen-adr-map\` = the map is aligned. The "when" is in the file's git log._

---

## ADR table

| ADR | Title | Status (planning) | Status (implementation) | Records |
|-----|--------|-------------------|--------------------------|--------|
${rows.join('\n')}

---

## Implementation-status legend

- ⚪ **pending** — no record in progress or completed for this ADR
- 🟡 **in progress** — at least one record in-progress/blocked/completed (but not all)
- 🟢 **completed** — all referenced records are completed

## Notes

- The "planning" status comes from the ADR's **Status:** heading.
- The "implementation" status comes from MANIFEST.json (records with \`adr: ["NNN"]\`).
- To recompute: \`{{PKG_MANAGER}} gen-adr-map\`
`;
}

function main() {
  const adrs = listAdrs();
  if (adrs.length === 0) logInfo('zero ADRs found — minimal output');
  const adrMap = buildAdrMap(loadManifest());
  const md = generateMarkdown(adrs, adrMap);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, md, 'utf8');
  logInfo(`wrote ${path.relative(ROOT, OUTPUT_FILE)}: ${adrs.length} ADRs mapped`);
}

main();
