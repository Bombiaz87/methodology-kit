// KIT · [Node-ref] — unit-test for the Stop advisory hook: imports the pure buildReminder/shaMatch
// and checks it nags exactly when work moved but wasn't saved, and stays silent otherwise.
// Run: `node --test scripts/tests/hook-handoff-reminder.test.mjs`.
//
// In plain language: the hook that taps you on the shoulder at the end ("did you save?") must fire
// on a dirty tree or a lagging Board, and NOT cry wolf when everything is already in sync.

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildReminder, shaMatch } from '../hook-handoff-reminder.mjs';

describe('hook-handoff-reminder — buildReminder (pure)', () => {
  test('nags on a dirty working tree', () => {
    const m = buildReminder({ dirty: true, headSha: 'abc1234', boardLastCommit: 'abc1234' });
    assert.match(m, /\/handoff/);
    assert.match(m, /Uncommitted/);
  });

  test('nags when the Board last_commit lags HEAD', () => {
    const m = buildReminder({ dirty: false, headSha: 'def5678', boardLastCommit: 'abc1234' });
    assert.match(m, /realign/);
  });

  test('silent when the tree is clean and the Board is in sync', () => {
    assert.equal(
      buildReminder({ dirty: false, headSha: 'abc1234', boardLastCommit: 'abc1234' }),
      '',
    );
  });

  test('tolerates abbreviated vs full sha (no false nag)', () => {
    assert.equal(shaMatch('abc1234', 'abc1234def0'), true);
    assert.equal(
      buildReminder({ dirty: false, headSha: 'abc1234', boardLastCommit: 'abc1234def0' }),
      '',
    );
  });

  test('uses a custom handoff command name', () => {
    assert.match(buildReminder({ dirty: true }, '/save'), /\/save/);
  });
});
