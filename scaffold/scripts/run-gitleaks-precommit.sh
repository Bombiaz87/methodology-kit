#!/usr/bin/env bash
# KIT · [Node-ref] — pre-commit wrapper against secret leaks: scans staged changes with gitleaks (--redact), set -euo pipefail, actionable message if the binary is missing + --no-verify escape hatch. Expected behavior: hard block before the commit if it finds a secret; never print the value in plaintext.
#
# scripts/run-gitleaks-precommit.sh — pre-commit hook wrapper against secret leaks.
#
# Wired by the hook manager (see the "hooks" section of the scaffold package.json).
#
# In plain language: before every commit it checks that you're not about to accidentally save
# a key/password into the repo. If it finds one, it blocks the commit. If you really need to force it
# (emergency), use `git commit --no-verify` — and note it in the session JOURNAL.
#
# Behavior: hard block everywhere, no bypass env-var.

set -euo pipefail

if ! command -v gitleaks >/dev/null 2>&1; then
  cat >&2 <<'EOF'
✗ gitleaks not installed (pre-commit hook against secret leaks).

To install it, follow your OS's docs (single binary, no runtime dependencies):
  https://github.com/gitleaks/gitleaks#installing

If the install dir is not on your $PATH, add it to your shell profile and reopen the terminal.

If you want to commit anyway (not recommended, loses the anti-leak belt):
  git commit --no-verify
EOF
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# gitleaks v8.21+ API: `git --staged` scans ONLY the staged changes (~100ms-1s).
# --redact never prints the value in plaintext. --config explicit for clarity.
gitleaks git --staged --redact -v --config "$REPO_ROOT/.gitleaks.toml"
