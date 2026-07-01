// KIT · [Node-ref] — unit + integration test for the harness config-drift sentinel.
// Run: `node --test scripts/tests/check-harness-refs.test.mjs`.
//
// In plain language: this guard looks for "dead links" inside the .claude control files. These cases
// prove (a) it recognizes only real, high-confidence path refs and ignores placeholders/globs, (b)
// the shipped scaffold has none, and (c) it actually BITES when a reference points at a missing file.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkHarnessRefs, extractPathRefs } from '../check-harness-refs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCAFFOLD_ROOT = resolve(__dirname, '..', '..');

describe('check-harness-refs — extractPathRefs (pure)', () => {
  test('captures anchored, extension-bearing paths', () => {
    const refs = extractPathRefs('run `node scripts/hook-session-brief.mjs` then read docs/implementation/STATE.md');
    assert.ok(refs.includes('scripts/hook-session-brief.mjs'));
    assert.ok(refs.includes('docs/implementation/STATE.md'));
  });

  test('captures a path inside a JSON command string', () => {
    const refs = extractPathRefs('{ "command": "node scripts/update-state.mjs" }');
    assert.deepEqual(refs, ['scripts/update-state.mjs']);
  });

  test('strips a leading ./', () => {
    assert.deepEqual(extractPathRefs('see ./scripts/foo.mjs'), ['scripts/foo.mjs']);
  });

  test('SKIPS placeholders, globs, angle-brackets and .. climbs', () => {
    const text = [
      'Edit({{REPO_PATH}}/**/migrations/**)',
      'node scripts/tests/**/*.test.mjs',
      'scripts/<guard-name>.mjs',
      '../reference/foo.md',
    ].join('\n');
    assert.deepEqual(extractPathRefs(text), []);
  });

  test('ignores bare filenames without an anchor dir (too ambiguous)', () => {
    assert.deepEqual(extractPathRefs('the file `check-harness-refs.mjs` lives here'), []);
  });

  test('ignores unknown extensions / dirs', () => {
    assert.deepEqual(extractPathRefs('lib/thing.py and docs/architecture/decisions/'), []);
  });
});

describe('check-harness-refs — checkHarnessRefs (integration)', () => {
  test('the shipped scaffold has zero dead references', () => {
    const { dead, sources } = checkHarnessRefs(SCAFFOLD_ROOT);
    assert.ok(sources > 0, 'expected to scan at least one harness file');
    assert.deepEqual(
      dead.map((d) => `${d.source} → ${d.ref}`),
      [],
      `unexpected dead references: ${dead.map((d) => `${d.source} → ${d.ref}`).join(', ')}`,
    );
  });

  test('BITES: detects a hook command that points at a missing script', () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), 'harness-refs-'));
    try {
      fs.mkdirSync(join(tmp, '.claude'), { recursive: true });
      fs.mkdirSync(join(tmp, 'scripts'), { recursive: true });
      fs.writeFileSync(join(tmp, 'scripts', 'real.mjs'), '// exists');
      fs.writeFileSync(
        join(tmp, '.claude', 'settings.json'),
        JSON.stringify({
          hooks: {
            Stop: [{ hooks: [{ type: 'command', command: 'node scripts/ghost.mjs' }] }],
            SessionStart: [{ hooks: [{ type: 'command', command: 'node scripts/real.mjs' }] }],
          },
        }),
      );
      const { dead } = checkHarnessRefs(tmp);
      assert.deepEqual(
        dead.map((d) => d.ref),
        ['scripts/ghost.mjs'],
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
