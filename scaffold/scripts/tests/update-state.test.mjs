// KIT · [Node-ref] — test for the pure logic of update-state.mjs (guards-are-tested).
// Covers the regression bug of `$` tokens in the commit message + replace/append/escape.
import test from 'node:test';
import assert from 'node:assert/strict';
import { stampFrontmatter } from '../update-state.mjs';

const fields = {
  sha: 'abc1234',
  subject: 'fix: normal stuff',
  isoCommitDate: '2026-06-22T10:00:00+00:00',
  author: 'Alice Tester',
  nowIso: '2026-06-22T10:00:01.000Z',
};
const SKELETON = ['updated:', 'last_commit:', 'last_commit_message: ""', 'last_commit_at:', 'last_commit_author: ""'].join('\n');

test('stampFrontmatter: stamps the 5 fields when present (replace path)', () => {
  const out = stampFrontmatter(SKELETON, fields);
  assert.match(out, /^last_commit: abc1234$/m);
  assert.match(out, /^last_commit_message: "fix: normal stuff"$/m);
  assert.match(out, /^last_commit_at: 2026-06-22T10:00:00\+00:00$/m);
  assert.match(out, /^last_commit_author: "Alice Tester"$/m);
});

test('stampFrontmatter: $ tokens in the commit message do NOT corrupt the frontmatter (regression)', () => {
  const fm = `${SKELETON}\ntitle: STATE`;
  const out = stampFrontmatter(fm, { ...fields, subject: 'fix $& and $1 done' });
  assert.ok(out.includes('last_commit_message: "fix $& and $1 done"'), 'the value must appear literally');
  assert.match(out, /^title: STATE$/m); // the next field intact, not truncated
  const msgLine = out.split('\n').find((l) => l.startsWith('last_commit_message:'));
  assert.equal((msgLine.match(/"/g) || []).length, 2, 'exactly two quotes: no imbalance');
});

test('stampFrontmatter: a missing field is appended (append path)', () => {
  const out = stampFrontmatter('updated:', fields);
  assert.match(out, /^last_commit_author: "Alice Tester"$/m);
});

test('stampFrontmatter: quotes in the subject are escaped', () => {
  const out = stampFrontmatter('last_commit_message: ""', { ...fields, subject: 'says "hi"' });
  assert.ok(out.includes('last_commit_message: "says \\"hi\\""'));
});
