// KIT · [Node-ref] — test for the check-coherence guard (guards-are-tested, handbook/08 §8).
// Run: node --test scripts/tests/check-coherence.test.mjs  (or `{{PKG_MANAGER}} test:guards`).
// Zero-dep: imports only the pure functions; no filesystem, no js-yaml.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  analyzeDirection,
  assessBoardStaleness,
  extractLocalLinks,
  extractMarkers,
  findDanglingRefs,
  parseDirection,
  parseStateForBoard,
} from '../check-coherence.mjs';

const SAMPLE = `# Direction

<!-- north-star:updated 2026-01-01 -->

## §2 PDR log

### PDR-001 — Acquisition pivot · state: propagating · 2026-02-01

**What changes** something.

**Propagation**
- [x] updated ADR 007
- [ ] updated CLAUDE.md
- [ ] updated memory

**References** various.

### PDR-002 — Product model · state: propagated · 2026-03-01

**Propagation**
- [x] all done
- [ ] except this one

### PDR-003 malformed without the right format

### PDR-004 — Weird state · state: bananas · 2026-04-01
`;

test('parseDirection: extracts PDRs, counts checkboxes, reads the north-star marker', () => {
  const p = parseDirection(SAMPLE);
  assert.equal(p.northStarDate, '2026-01-01');
  // PDR-001, 002, 004 are well-formed (004 has an invalid state but a valid header); 003 is malformed
  assert.deepEqual(p.pdrs.map((x) => x.id), ['PDR-001', 'PDR-002', 'PDR-004']);
  const p1 = p.pdrs.find((x) => x.id === 'PDR-001');
  assert.equal(p1.open, 2);
  assert.equal(p1.done, 1);
});

test('parseDirection: malformed header and invalid state caught (no side-effects)', () => {
  const p = parseDirection(SAMPLE);
  assert.equal(p.malformed.length, 1);
  assert.match(p.malformed[0].text, /PDR-003/);
  assert.equal(p.invalidStates.length, 1);
  assert.equal(p.invalidStates[0].id, 'PDR-004');
  assert.equal(p.invalidStates[0].state, 'bananas');
});

test('analyzeDirection: structural errors (malformed + invalid state + propagated-with-open-boxes)', () => {
  const { errors, warnings } = analyzeDirection(parseDirection(SAMPLE), []);
  assert.ok(errors.some((e) => /malformed/.test(e)));
  assert.ok(errors.some((e) => /invalid/.test(e)));
  assert.ok(errors.some((e) => /PDR-002.*propagated/.test(e))); // propagated with 1 open box
  // warning: PDR-001 nagging with open boxes + stale north-star
  assert.ok(warnings.some((w) => /PDR-001/.test(w)));
  assert.ok(warnings.some((w) => /north-star/.test(w)));
});

test('analyzeDirection: ADR banner to a non-existent PDR = error', () => {
  const parsed = { pdrs: [], northStarDate: '2026-01-01', malformed: [], invalidStates: [] };
  const { errors } = analyzeDirection(parsed, [{ pdrId: 'PDR-099', file: 'decisions/007.md' }]);
  assert.ok(errors.some((e) => /PDR-099.*does not exist/.test(e)));
});

test('analyzeDirection: ADR banner to an abandoned PDR = error', () => {
  const parsed = {
    pdrs: [{ id: 'PDR-005', title: 'x', state: 'abandoned', date: '2026-01-01', line: 1, open: 0, done: 0 }],
    northStarDate: '2026-02-01',
    malformed: [],
    invalidStates: [],
  };
  const { errors } = analyzeDirection(parsed, [{ pdrId: 'PDR-005', file: 'decisions/009.md' }]);
  assert.ok(errors.some((e) => /abandoned/.test(e)));
});

test('parseDirection: examples inside a ``` fence are NOT read as entries', () => {
  const fenced = [
    '## §2',
    '```markdown',
    '### PDR-999 — fenced example · state: idea · YYYY-MM-DD',
    '- [ ] example box',
    '```',
    '### PDR-001 — Real entry · state: decided · 2026-01-01',
    '**Propagation**',
    '- [ ] a real one',
  ].join('\n');
  const p = parseDirection(fenced);
  assert.deepEqual(p.pdrs.map((x) => x.id), ['PDR-001']); // fenced PDR-999 ignored
  assert.equal(p.malformed.length, 0); // the fenced example (date YYYY-MM-DD) is NOT malformed
  assert.equal(p.pdrs[0].open, 1); // only the real entry's box counted
});

test('analyzeDirection: coherent log = zero errors', () => {
  const parsed = {
    pdrs: [{ id: 'PDR-001', title: 'ok', state: 'propagated', date: '2026-01-01', line: 1, open: 0, done: 3 }],
    northStarDate: '2026-02-01',
    malformed: [],
    invalidStates: [],
  };
  const { errors } = analyzeDirection(parsed, []);
  assert.deepEqual(errors, []);
});

// === [coherence] new checks (F1 link/ref · F5 marker · F8 Board) ===========

test('extractMarkers: captures real markers, skips the ellipsis placeholders', () => {
  assert.equal(extractMarkers('[TO-CLARIFY: how to handle X?]')[0].note, 'how to handle X?');
  assert.equal(extractMarkers('<!-- ASSUMED: always holds -->')[0].kind, 'ASSUMED');
  assert.equal(extractMarkers('example `[TO-CLARIFY: …]` in the docs').length, 0);
  assert.equal(extractMarkers('no TBD nor TODO here').length, 0);
});

test('extractLocalLinks: only local links, filters http/mailto/anchor/placeholder', () => {
  const t = '[a](./x.md) [b](https://y) [c](mailto:z) [d](#s) [e](../f.md#h) [g]({{X}}.md)';
  assert.deepEqual(extractLocalLinks(t), ['./x.md', '../f.md']);
});

test('findDanglingRefs: flags non-existent ADR/PDR, not the known ones, not mini-ADR NN/NNNN', () => {
  const adr = new Set(['003']);
  const pdr = new Set(['001']);
  assert.deepEqual(findDanglingRefs('ADR 099 and PDR-042', adr, pdr), [
    { kind: 'ADR', id: '099' },
    { kind: 'PDR', id: '042' },
  ]);
  assert.deepEqual(findDanglingRefs('ADR 003 and PDR-001 and mini-ADR 05/0002', adr, pdr), []);
});

test('assessBoardStaleness: warns on staleness and on blockers; quiet if fresh/empty', () => {
  const now = Date.parse('2026-06-19T00:00:00Z');
  const old = Date.parse('2026-06-01T00:00:00Z');
  assert.equal(assessBoardStaleness({ inVoloCount: 2, lastHandoffMs: old, hasBlockers: false }, now, 14).length, 1);
  assert.equal(assessBoardStaleness({ inVoloCount: 0, lastHandoffMs: old, hasBlockers: false }, now, 14).length, 0);
  assert.equal(assessBoardStaleness({ inVoloCount: 0, lastHandoffMs: null, hasBlockers: true }, now, 14).length, 1);
});

test('parseStateForBoard: does NOT truncate on "Z", counts "In flight" even as the last section', () => {
  const md = [
    '---',
    'blockers: []',
    'last_session_handoff_at: 2026-06-17T15:35:00.000Z',
    '---',
    '### 🔵 In flight',
    '- migration to Zeta',
    '- audit of 2026-06-19T12:00:00.000Z',
  ].join('\n');
  const r = parseStateForBoard(md);
  assert.equal(r.inVoloCount, 2);
  assert.equal(r.hasBlockers, false);
  assert.ok(r.lastHandoffMs > 0);
});
