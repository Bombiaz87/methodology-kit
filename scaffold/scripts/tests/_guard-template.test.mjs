// KIT · [Node-ref] — unit-test for the guard skeleton: imports the pure functions (classifyFile/stripComments/checkRepo) and demonstrates "guards-are-tested". Expected behavior: runs with `node --test`; copy it next to your real guard and adapt the cases to your forbidden pattern.
//
// Test of the guard template. Run: `node --test scripts/tests/_guard-template.test.mjs`.
//
// In plain language: a guard is itself code that can be wrong. These tests prove
// that it recognizes both the forbidden uses (it must bite) and the legitimate ones (it must not
// raise false alarms) — the rule "even the guardrails must be tested".
//
// The template's forbidden pattern is `unsafeAccess(` and the channeled form is `withGuard(...)`.
// When you adapt _guard-template.mjs to your real anti-pattern, update these cases too.

import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ALLOWLIST, checkRepo, classifyFile, stripComments } from '../_guard-template.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

describe('guard — classifyFile (unit)', () => {
  test('flags the forbidden pattern called directly in a chain', () => {
    const src = 'const rows = await unsafeAccess().select().from(t);';
    assert.equal(classifyFile(src).violating, true);
  });

  test('flags `const x = unsafeAccess()` if `x` is dereferenced', () => {
    const src = ['const x = unsafeAccess();', 'const rows = await x.select();'].join('\n');
    assert.equal(classifyFile(src).violating, true);
  });

  test('does NOT flag the channeled form `withGuard(unsafeAccess(), …)`', () => {
    const src = 'return withGuard(unsafeAccess(), scope, async (tx) => tx.select());';
    assert.equal(classifyFile(src).violating, false);
  });

  test('does NOT flag an assignment used only channeled (`const x = unsafeAccess()` → withGuard(x,…))', () => {
    const src = [
      'const x = unsafeAccess();',
      'await withGuard(x, scope, async (tx) => tx.select());',
    ].join('\n');
    assert.equal(classifyFile(src).violating, false);
  });

  test('flags a mixed file: assignment then dereferenced even if sometimes channeled', () => {
    const src = [
      'const x = unsafeAccess();',
      'const [row] = await x.select();',
      'await withGuard(x, row.scope, (tx) => tx.update());',
    ].join('\n');
    assert.equal(classifyFile(src).violating, true);
  });
});

describe('guard — stripComments', () => {
  test('the forbidden pattern in a `//` comment is not flagged', () => {
    const src = '// do not use unsafeAccess() here\nconst x = 1;';
    assert.equal(classifyFile(src).violating, false);
  });

  test('the forbidden pattern in a JSDoc block is not flagged', () => {
    const src = ['/**', ' * Avoid `unsafeAccess()`.', ' */', 'const x = 1;'].join('\n');
    assert.equal(classifyFile(src).violating, false);
  });

  test('stripComments preserves the line count', () => {
    const src = 'a\n// b\n/* c\n d */\ne';
    assert.equal(stripComments(src).split('\n').length, src.split('\n').length);
  });
});

describe('guard — checkRepo (integration)', () => {
  test('the repo passes with the current ALLOWLIST — 0 violations, 0 stale entries', () => {
    const { violations, stale } = checkRepo(REPO_ROOT, ALLOWLIST);
    // On the "cold" kit there is no code using the fictional pattern → both empty.
    assert.deepEqual(
      violations.map((v) => v.file),
      [],
      `unexpected violations: ${violations.map((v) => v.file).join(', ')}`,
    );
    assert.deepEqual(
      stale.map((s) => s.file),
      [],
      `stale entries: ${stale.map((s) => s.file).join(', ')}`,
    );
  });

  test('every ALLOWLIST entry has non-empty file + category + reason', () => {
    for (const entry of ALLOWLIST) {
      assert.ok(entry.file, 'entry without file');
      assert.ok(entry.category, `entry ${entry.file} without category`);
      assert.ok(entry.reason, `entry ${entry.file} without reason`);
    }
  });
});
