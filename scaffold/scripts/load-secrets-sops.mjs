#!/usr/bin/env node
// KIT · [Node-ref] — decrypts secrets/{env}.enc.yaml via sops and prints in heredoc format for CI; skips "_"-prefixed keys and the "sops" envelope key. Expected behavior: feeds a CI workflow's env from an encrypted-in-repo secrets file, without ever exposing the values in the logs.
//
// scripts/load-secrets-sops.mjs
// Decrypts secrets/{env}.enc.yaml via sops and prints env-style to stdout, in a
// heredoc format compatible with the GitHub Actions env file ($GITHUB_ENV):
//   KEY<<EOF
//   value
//   EOF
//
// In plain language: the secrets (keys, tokens) live in the repo, encrypted. In CI this
// script decrypts them on the fly and passes them to the job, without them ever ending up
// in plaintext in the logs.
//
// CI usage:
//   SOPS_AGE_KEY_FILE=$AGE_KEY_FILE node scripts/load-secrets-sops.mjs dev
//   # then parsed in the workflow + add-mask + appended to $GITHUB_ENV
//
// Local usage (sanity check):
//   SOPS_AGE_KEY_FILE=<age-key> node scripts/load-secrets-sops.mjs dev > /tmp/secrets.env
//
// Conventions: keys starting with `_` (e.g. `_placeholder`) are skipped
// (non-runtime comments/placeholders); the `sops` envelope key is never emitted.

import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';

// --- Tunable constants --------------------------------------------------------
const ENVIRONMENTS = ['dev', 'staging', 'prod'];
const HEREDOC_DELIM = 'SOPS_EOF'; // heredoc delimiter; must not appear in values

const env = process.argv[2] ?? 'dev';

if (!ENVIRONMENTS.includes(env)) {
  console.error(`Usage: node scripts/load-secrets-sops.mjs <${ENVIRONMENTS.join('|')}>`);
  process.exit(1);
}

if (!process.env.SOPS_AGE_KEY_FILE) {
  console.error('SOPS_AGE_KEY_FILE not set. See secrets/README.md.');
  process.exit(1);
}

const result = spawnSync('sops', ['-d', `secrets/${env}.enc.yaml`], { encoding: 'utf-8' });
if (result.status !== 0) {
  console.error(`sops decrypt failed: ${result.stderr}`);
  process.exit(result.status ?? 1);
}

const data = yaml.load(result.stdout);
if (!data || typeof data !== 'object') {
  console.error('Decrypted output is not a YAML object.');
  process.exit(1);
}

for (const [key, value] of Object.entries(data)) {
  if (key.startsWith('_')) continue; // skip placeholder/comment keys
  if (key === 'sops') continue; // safety: the sops envelope must never be emitted
  // Heredoc format to support multiline values + special characters.
  process.stdout.write(`${key}<<${HEREDOC_DELIM}\n${value}\n${HEREDOC_DELIM}\n`);
}
