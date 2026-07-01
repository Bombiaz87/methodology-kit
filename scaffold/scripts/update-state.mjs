#!/usr/bin/env node
// KIT · [Node-ref] — post-commit: surgical sed on STATE.md's frontmatter (last_commit*, updated). Expected behavior: after every commit it updates ONLY the pointer fields of the frontmatter, preserving the free-form; idempotent (no dirty tree if only the timestamp changes).
//
// scripts/update-state.mjs
// Updates the YAML frontmatter of {{REPO_PATH}}/docs/implementation/STATE.md with the latest commit's data.
// Wire it as a git post-commit hook (see the "hooks" section of the scaffold package.json).
//
// Operation: surgical sed on the YAML, not a template render. Preserves every manual edit to the free-form.
//
// In plain language: every time you commit, this script stamps into the "living state machine"
// the hash, message and date of the last commit — so the Board always knows where you are,
// without you having to update it by hand.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
// {{DOCS_ROOT}} — root of the docs tree. Default 'docs'; if yours differs (e.g. 'context')
// change it HERE, one single place. A constant (not a text placeholder) so the script stays runnable.
const DOCS_ROOT = 'docs';
const STATE_FILE = path.join(ROOT, DOCS_ROOT, 'implementation/STATE.md');

function logInfo(msg) {
  console.log(`[update-state] ${msg}`);
}

function logWarn(msg) {
  console.warn(`[update-state] WARN: ${msg}`);
}

function gitOrNull(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

// Pure and testable: stamps the pointer fields in the frontmatter, preserving the rest.
// USES a replacement FUNCTION (not a string): so the tokens `$&`/`$1`/`` $` `` in a commit
// message aren't interpreted by String.replace and don't corrupt the frontmatter.
export function stampFrontmatter(frontmatter, { sha, subject, isoCommitDate, author, nowIso }) {
  const quote = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
  const pairs = [
    ['updated', nowIso],
    ['last_commit', sha],
    ['last_commit_message', quote(subject || '')],
    ['last_commit_at', isoCommitDate || nowIso],
    ['last_commit_author', quote(author || '')],
  ];
  let out = frontmatter;
  for (const [key, value] of pairs) {
    const re = new RegExp(`^${key}:.*$`, 'm');
    out = re.test(out) ? out.replace(re, () => `${key}: ${value}`) : `${out}\n${key}: ${value}`;
  }
  return out;
}

function main() {
  // profile:team opt-out — auto-stamping a SHARED, committed STATE.md conflicts across branches.
  // In team, set STATE_AUTOSTAMP=off (or just don't wire the post-commit hook): git already carries
  // the commit metadata, and volatile state lives on the tracker. See handbook/04 + 09.
  if (process.env.STATE_AUTOSTAMP === 'off') {
    logInfo('STATE_AUTOSTAMP=off — skipping Board autostamp (team profile)');
    return;
  }
  if (!fs.existsSync(STATE_FILE)) {
    logWarn(`STATE.md not found at ${STATE_FILE} — skip`);
    return;
  }

  const isGitRepo = gitOrNull('git rev-parse --is-inside-work-tree') === 'true';
  if (!isGitRepo) {
    logWarn('not in a git repo — skip update-state');
    return;
  }

  const sha = gitOrNull('git log -1 --format=%h');
  const subject = gitOrNull('git log -1 --format=%s');
  const isoCommitDate = gitOrNull('git log -1 --format=%cI');
  const author = gitOrNull('git log -1 --format=%an'); // attribution: matters in the team profile
  const nowIso = new Date().toISOString();

  if (!sha) {
    logWarn('no commit found — skip');
    return;
  }

  // (This script does NOT create commits: it only does an in-place sed of the frontmatter, picked up
  // at the next commit. No auto-commit → no loop → no anti-loop guard needed.)
  const content = fs.readFileSync(STATE_FILE, 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    logWarn('frontmatter not found in STATE.md — skip');
    return;
  }

  const [_, frontmatter, body] = fmMatch;

  const final = stampFrontmatter(frontmatter, { sha, subject, isoCommitDate, author, nowIso });
  const newContent = `---\n${final}\n---\n${body}`;

  // Idempotency: if the only delta vs the current file is the `updated:` timestamp,
  // don't rewrite — avoids a dirty tree after every post-commit hook.
  const stripUpdated = (s) => s.replace(/^updated:.*$/m, 'updated: <TS>');
  if (stripUpdated(content) === stripUpdated(newContent)) {
    logInfo('STATE.md unchanged (timestamp only) — skip write');
    return;
  }

  fs.writeFileSync(STATE_FILE, newContent, 'utf8');
  logInfo(`STATE.md updated: last_commit=${sha} subject="${subject}"`);
}

// run only if launched directly, so tests can import stampFrontmatter without side-effects
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
