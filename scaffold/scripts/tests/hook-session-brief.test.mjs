// KIT · [Node-ref] — unit-test for the SessionStart advisory hook: imports the pure buildBrief and
// checks it injects the Board's focus/blockers and stays silent (fail-open) on unparsable input.
// Run: `node --test scripts/tests/hook-session-brief.test.mjs`.
//
// In plain language: the hook that greets a fresh chat with the Board is itself code that can be
// wrong. These cases prove it surfaces what matters and never breaks on a malformed STATE.md.

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildBrief } from '../hook-session-brief.mjs';

describe('hook-session-brief — buildBrief (pure)', () => {
  const state = [
    '---',
    'focus: "ship the invoice PDF"',
    'blockers: "waiting on the VAT rule"',
    'last_commit: abc1234',
    '---',
    '',
    '# Board',
    '## In flight',
    '- x',
  ].join('\n');

  test('injects focus and blockers from the frontmatter', () => {
    const b = buildBrief(state);
    assert.match(b, /ship the invoice PDF/);
    assert.match(b, /waiting on the VAT rule/);
    assert.match(b, /STATE\.md/);
  });

  test('returns empty string when there is no frontmatter (fail-open)', () => {
    assert.equal(buildBrief('# just a heading, no frontmatter'), '');
  });

  test('still points to the Board when focus/blockers are empty (no empty lines)', () => {
    const bare = ['---', 'focus: ""', '---', 'body'].join('\n');
    const b = buildBrief(bare);
    assert.match(b, /STATE\.md/);
    assert.doesNotMatch(b, /Focus:/);
    assert.doesNotMatch(b, /Blockers:/);
  });

  test('treats an empty YAML list (`blockers: []`) as no blockers', () => {
    const withEmptyList = ['---', 'focus: "do X"', 'blockers: []', '---', 'body'].join('\n');
    const b = buildBrief(withEmptyList);
    assert.match(b, /Focus: do X/);
    assert.doesNotMatch(b, /Blockers:/);
  });

  test('never exceeds maxLines (it lands in every fresh context)', () => {
    const b = buildBrief(state, { maxLines: 2 });
    assert.ok(b.split('\n').length <= 2);
  });
});
