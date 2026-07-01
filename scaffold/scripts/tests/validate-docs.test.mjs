// KIT · [Node-ref] — test for the validate-docs guard (guards-are-tested, handbook/08 §8).
// Run: node --test scripts/tests/validate-docs.test.mjs  (or `{{PKG_MANAGER}} test:guards`).
// Zero-dep: uses only validateGraph (pure) with already-parsed documents → no js-yaml, no FS.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateGraph } from '../validate-docs.mjs';

test('valid graph → no errors', () => {
  const docs = [
    { id: '01-01', status: 'completed', enables: ['01-02'], _filename: '01-01-base.md' },
    { id: '01-02', status: 'pending', depends_on: ['01-01'], _filename: '01-02-next.md' },
  ];
  assert.deepEqual(validateGraph(docs).errors, []);
});

test('duplicate id → error', () => {
  const docs = [
    { id: '01-01', _filename: '01-01-a.md' },
    { id: '01-01', _filename: '01-01-b.md' },
  ];
  assert.ok(validateGraph(docs).errors.some((e) => /duplicate/.test(e)));
});

test('id ≠ filename prefix → error', () => {
  const docs = [{ id: '09-09', _filename: '01-01-a.md' }];
  assert.ok(validateGraph(docs).errors.some((e) => /does not match/.test(e)));
});

test('status out of enum → error', () => {
  const docs = [{ id: '01-01', status: 'bananas', _filename: '01-01-a.md' }];
  assert.ok(validateGraph(docs).errors.some((e) => /status/.test(e)));
});

test('self-reference → error', () => {
  const docs = [{ id: '01-01', depends_on: ['01-01'], _filename: '01-01-a.md' }];
  assert.ok(validateGraph(docs).errors.some((e) => /self-reference/.test(e)));
});

test('depends_on to a nonexistent id → error', () => {
  const docs = [{ id: '01-02', depends_on: ['99-99'], _filename: '01-02-b.md' }];
  assert.ok(validateGraph(docs).errors.some((e) => /99-99.*does NOT exist/.test(e)));
});

test('enables forward (not yet created) → warning, not error', () => {
  const docs = [{ id: '01-01', enables: ['02-99'], _filename: '01-01-a.md' }];
  const { errors, warnings } = validateGraph(docs);
  assert.deepEqual(errors, []);
  assert.ok(warnings.some((w) => /02-99/.test(w)));
});

test('dependency cycle → error', () => {
  const docs = [
    { id: '01-01', depends_on: ['01-02'], _filename: '01-01-a.md' },
    { id: '01-02', depends_on: ['01-01'], _filename: '01-02-b.md' },
  ];
  assert.ok(validateGraph(docs).errors.some((e) => /cycle/.test(e)));
});
