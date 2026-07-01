> KIT · [Node-ref] — scope-guide of the doc-site. The site is ONLY a renderer of docs/; describes the 3 things to touch when you add a top-level folder and the Host-behind-proxy gotcha. Adapt it to {{PROJECT}}/{{STACK}}.

# `docs-site/` — online doc site (Astro + Starlight)

URL: **https://docs.{{DOMAIN_PROD}}** (dev: **https://docs.{{DOMAIN_DEV}}**).

Renderer for the `{{REPO_PATH}}/docs/` documentation. Auto-rebuild via chokidar file
watcher: change a `.md` → rebuild in ~5-7s.

> **Golden rule: this site is ONLY a renderer of `docs/`.** It doesn't duplicate, copy,
> or symlink the documents: it reads them where they live (`base: '../../docs/'`). Don't write
> content in here — content lives in `docs/`. This is only about how it's *displayed*.

## Targeted commands

```bash
{{PKG_MANAGER}} --filter docs-site dev
{{PKG_MANAGER}} --filter docs-site build
{{PKG_MANAGER}} --filter docs-site check
```

**CI gotcha:** `check` runs `astro check`, which requires `@astrojs/check` to be
**explicitly** installed (it's in `devDependencies`). Without it, an interactive prompt starts that **blocks
CI** waiting for input. Keep it in dependencies, don't leave it on-demand.

## Operations

- **Process manager**: {{PROCESS_MANAGER}} (port 3004)
- **Watcher**: `scripts/watch-and-serve.mjs` (chokidar) — rebuilds on changes in `docs/`
- **Manual rebuild**: `{{PKG_MANAGER}} --filter docs-site build`

## Non-obvious configuration

All the docs live under `{{REPO_PATH}}/docs/` (folders: `architecture/`,
`implementation/`, `identity/`, …). This app is just the renderer.

- `src/content.config.ts`: **glob loader** with `base: '../../docs/'`. Custom `generateId`
  maps `{folder}/README.md` → `{folder}`.
- `astro.config.mjs`: `DOCS_ROOT = '../../docs/'`. The `dirToSidebarItems()` function reads
  the filesystem at startup and generates the sidebar (so it auto-updates). It extracts the
  numeric prefix from the filename and prepends it only if it's not already in the title.
- `defaultLocale: 'root'`: no `/en/` prefix in the URLs.

### Gotcha — Host behind reverse-proxy

Astro `preview`/`dev` **reject non-whitelisted Hosts**. If the site is behind a
reverse-proxy (nginx/caddy/…), either the proxy rewrites the Host to `127.0.0.1`
(`proxy_set_header Host 127.0.0.1`), **or** add the public domain to
`vite.preview.allowedHosts` / `vite.server.allowedHosts` (already set up in
`astro.config.mjs` with the tokens `docs.{{DOMAIN_PROD}}` / `docs.{{DOMAIN_DEV}}`).
Symptom if missing: "host not allowed" error / blank page served only from localhost.

## Adding a new top-level docs folder

E.g. `docs/identity/`. **3 points to keep aligned** (if you forget one, the folder
won't show up or won't trigger the rebuild):

1. **Pattern** in `content.config.ts` → add `'identity/**/*.{md,mdx}'`.
2. **Sidebar entry** in `astro.config.mjs` (`sidebar:`), typically via `dirToSidebarItems`.
3. **`watchPaths`** in `scripts/watch-and-serve.mjs` → add `path.join(DOCS_ROOT, 'identity')`.

## CI / exclusions

If you add a top-level folder that should **not** end up on the online site (e.g. a
work/research file without frontmatter), exclude it in the `content.config.ts` pattern with `!`
(e.g. `'!implementation/**/research/**'`). In plain language: whatever you don't exclude here
ends up online and in the search index.
