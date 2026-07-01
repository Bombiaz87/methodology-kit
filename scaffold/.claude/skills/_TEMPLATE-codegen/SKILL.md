---
name: TODO-skill-name-codegen
description: TODO one-shot description — what this skill GENERATES (a component, a module, an endpoint, a config file) and WHEN it should be invoked ("when the user asks add X to Y"). Specify the target package/folder and what it updates (barrel/export, smoke test). Output in English.
---

> KIT · [agnostic] — Skeleton for a CODEGEN skill (generates/adds code at a canonical point in the repo with the right conventions). Copy the folder, rename it, fill in the TODOs. The shape is fixed: dedup-check → generate → apply conventions → barrel/export → typecheck/lint → smoke test → report.

# Skill: TODO-skill-name-codegen

> TODO one line: what it generates, in which package/folder, why a skill is needed instead of doing it by hand (guarantees canonical import paths, tokens/conventions, updated barrel).

## When to use me

- TODO: task that requires artifact X not yet present in `{{REPO_PATH}}/<target>`.
- TODO: {{OPERATOR}} explicitly asks "add <X> to <target>".

## Do NOT use me if

- The artifact **already exists** in `<target>` (check with `ls`/grep the barrel) → STOP, report and ask whether to overwrite or extend.
- TODO: the target is a different area with different scope/conventions (route to the right tool/folder).
- TODO: it's a custom artifact that does NOT follow the upstream generator → write it by hand, no MCP/CLI.

## Procedure

### 1. Check for non-duplication
```bash
ls {{REPO_PATH}}/<target>/ | grep -i <name>
```
If it exists → STOP, report to {{OPERATOR}} and ask whether to overwrite or extend.

### 2. Generate the artifact
TODO: preferred command (MCP / generator) + CLI fallback with the repo's **local bin** (never `npx -y` or install on the fly without consent). Example:
```bash
{{REPO_PATH}}/node_modules/.bin/<tool> add <name> --yes
```

### 3. Apply project conventions to the generated file
TODO concrete checklist, e.g.:
- canonical imports (package path, NOT wrong relative aliases)
- no hardcoded values where shared tokens/constants exist
- correct client/server directive (only where needed)
- naming + folder (domain/api/ui layer) consistent with the code conventions

### 4. Update barrel / export
TODO: add the export to the package's entry point so it's importable from outside, e.g.:
```ts
export * from './<name>';
```

### 5. Typecheck + lint
```bash
{{PKG_MANAGER}} --filter <package> check && {{PKG_MANAGER}} lint
```

### 6. Minimal smoke test
TODO: 1 test that instantiates/renders the artifact and asserts the minimal invariant (e.g. mounts without errors + an expected convention). Add it to the package's smoke file.

### 7. Report to {{OPERATOR}}
- "Artifact `<name>` added at `<target>/<name>`"
- "Exported from the entry point, typecheck green"
- "Smoke test in `<file>`, X/X green"

## Common mistakes to avoid

| Mistake | Why it bites |
|---|---|
| Generating in the wrong place | Many generators have a default that is NOT your target. Force the target. |
| Forgetting the barrel/export | The artifact exists but isn't importable from outside. |
| Hardcoded values instead of tokens/constants | Violates the style/config SSOT, breaks themes/variants. |
| Default client/server directive | Check whether it's actually needed. |
| On-the-fly remote install (`npx -y`, `apt`, `pip`) | Never without {{OPERATOR}}'s explicit consent. Use the repo's local bin. |

## References

- TODO: the architecture decision that fixes the design system / generator.
- TODO: the code conventions (import paths, layers, tokens).
