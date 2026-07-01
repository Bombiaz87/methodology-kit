// KIT · [Node-ref] — test for the check-state-size guard (guards-are-tested, handbook/08 §8).
// Run: node --test scripts/tests/check-state-size.test.mjs  (or `{{PKG_MANAGER}} test:guards`).
// Zero-dep: imports only the guard's pure functions, no js-yaml, no filesystem.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARCHIVE_MARKER,
  LIMITS,
  checkStateContent,
  countListItems,
  extractFrontmatter,
  getScalar,
} from '../check-state-size.mjs';

const FM_OK = `---
title: STATE
focus: "current work, short"
next_actions:
  - "action 1"
  - "action 2"
inline_decisions: []
---
# Body
`;

test('extractFrontmatter returns the block / null if absent', () => {
  assert.ok(extractFrontmatter(FM_OK).includes('focus:'));
  assert.equal(extractFrontmatter('no frontmatter here'), null);
  // banner above the frontmatter → does NOT start with --- → null (the bug we want to catch)
  assert.equal(extractFrontmatter(`> KIT banner\n\n---\ntitle: X\n---\n`), null);
});

test('getScalar reads scalars, strips quotes and comments', () => {
  const fm = extractFrontmatter(FM_OK);
  assert.equal(getScalar(fm, 'focus'), 'current work, short');
  assert.equal(getScalar(fm, 'title'), 'STATE');
  assert.equal(getScalar(fm, 'nonexistent'), null);
});

test('getScalar: empty quoted string followed by a comment → ""', () => {
  assert.equal(getScalar('focus: ""        # placeholder\n', 'focus'), '');
});

test('getScalar: does NOT cut a # inside a quoted string', () => {
  assert.equal(getScalar('focus: "tag #1 important"   # comment\n', 'focus'), 'tag #1 important');
});

test('countListItems: block array', () => {
  assert.equal(countListItems(extractFrontmatter(FM_OK), 'next_actions'), 2);
});

test('countListItems: inline array and empty list', () => {
  assert.equal(countListItems('a: [x, y, z]\n', 'a'), 3);
  assert.equal(countListItems('a: []\n', 'a'), 0);
  assert.equal(countListItems('a:           # empty\n  - ""\n', 'a'), 0);
});

test('countListItems: stops at the next top-level key', () => {
  const fm = 'next_actions:\n  - "one"\npending_commands: []\n';
  assert.equal(countListItems(fm, 'next_actions'), 1);
});

test('checkStateContent: OK state → no errors', () => {
  assert.deepEqual(checkStateContent(FM_OK), []);
});

test('checkStateContent: missing frontmatter → 1 error', () => {
  const errs = checkStateContent('no frontmatter');
  assert.equal(errs.length, 1);
  assert.match(errs[0], /frontmatter/);
});

test('checkStateContent: too many next_actions → error', () => {
  const items = Array.from({ length: 10 }, (_, i) => `  - "a${i}"`).join('\n');
  const content = `---\nfocus: ""\nnext_actions:\n${items}\n---\n`;
  const errs = checkStateContent(content);
  assert.ok(errs.some((e) => /next_actions/.test(e)));
});

test('checkStateContent: archive marker in focus → error', () => {
  const content = `---\nfocus: "old ${ARCHIVE_MARKER} stuff"\n---\n`;
  assert.ok(checkStateContent(content).some((e) => e.includes(ARCHIVE_MARKER)));
});

test('checkStateContent: file over the KB limit → error', () => {
  const big = `---\nfocus: ""\n---\n${'x'.repeat((LIMITS.maxFileKb + 10) * 1024)}`;
  assert.ok(checkStateContent(big).some((e) => /KB/.test(e)));
});
