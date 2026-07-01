#!/usr/bin/env node
// KIT · [Node-ref] — doc-site rebuild daemon: watch on docs/ + debounce + build-into-scratch-then-rename atomic swap + preview server + SIGINT teardown. Expected behavior: change a .md → rebuild ~5-7s, the served dist is never left empty mid-way.
//
// Watcher + preview server for the doc site.
// - Runs the initial `astro build`.
// - Runs `astro preview` as a static HTTP server (port 3004).
// - Watches the project's .md files → triggers a rebuild (debounced 800ms).
//
// In plain language: keeps the site always on and rebuilds it by itself
// every time you touch a document, without ever showing a broken page.
//
// Usage: node scripts/watch-and-serve.mjs

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
// {{REPO_PATH}} = repo root; docs/ is the sibling that hosts the corpus.
const REPO_ROOT = path.resolve(APP_DIR, '../../');
const DOCS_ROOT = path.join(REPO_ROOT, 'docs');

// Dir served live + scratch dir for the atomic build (see runBuild/swapDist).
const DIST = path.join(APP_DIR, 'dist');
const DIST_NEXT = path.join(APP_DIR, 'dist-next');
const DIST_OLD = path.join(APP_DIR, 'dist-old');

const log = (tag, msg) => console.log(`[${tag}] ${msg}`);

// Removes scratch dirs left over from a previous run that died mid-way.
function cleanScratch() {
  for (const d of [DIST_NEXT, DIST_OLD]) {
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {}
  }
}

// Promotes dist-next → dist with two renames (atomic, cost ~0: metadata only,
// no copy). The dist served live stays intact until the new build
// is complete and valid → no "empty dist" window → no transient 404s.
function swapDist() {
  if (fs.existsSync(DIST)) fs.renameSync(DIST, DIST_OLD);
  fs.renameSync(DIST_NEXT, DIST);
  try {
    fs.rmSync(DIST_OLD, { recursive: true, force: true });
  } catch {}
}

let buildInProgress = false;
let pendingBuild = false;
let buildTimer = null;

function runBuild() {
  if (buildInProgress) {
    pendingBuild = true;
    return;
  }
  buildInProgress = true;
  log('build', 'astro build starting...');
  const start = Date.now();
  // Build into a temp dir (--outDir dist-next): the live dist is NEVER
  // emptied mid-way. It's always ONE single build, same load as before.
  try {
    fs.rmSync(DIST_NEXT, { recursive: true, force: true });
  } catch {}
  const proc = spawn('npx', ['astro', 'build', '--outDir', 'dist-next'], {
    cwd: APP_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  proc.stdout.on('data', (d) => process.stdout.write(d));
  proc.stderr.on('data', (d) => process.stderr.write(d));
  proc.on('close', (code) => {
    buildInProgress = false;
    const dur = ((Date.now() - start) / 1000).toFixed(1);
    if (code === 0) {
      try {
        swapDist();
        log('build', `OK in ${dur}s (dist swapped)`);
      } catch (err) {
        log('build', `built OK but SWAP FAILED: ${err.message} — live dist preserved`);
      }
    } else {
      // Build failed/killed: discard the scratch, the live dist stays the good one.
      try {
        fs.rmSync(DIST_NEXT, { recursive: true, force: true });
      } catch {}
      log('build', `FAILED (exit ${code}) — live dist preserved`);
    }
    if (pendingBuild) {
      pendingBuild = false;
      runBuild();
    }
  });
}

function scheduleBuild() {
  if (buildTimer) clearTimeout(buildTimer);
  buildTimer = setTimeout(runBuild, 800);
}

// 1) Initial build — clean scratch from any dead previous runs first.
cleanScratch();
runBuild();

// 2) Start preview server.
log('serve', 'starting astro preview on 127.0.0.1:3004 ...');
const preview = spawn('npx', ['astro', 'preview', '--host', '127.0.0.1', '--port', '3004'], {
  cwd: APP_DIR,
  stdio: 'inherit',
});

preview.on('close', (code) => {
  log('serve', `preview exited with code ${code}`);
  process.exit(code ?? 1);
});

// 3) Watch the project's .md files. ADD here every new top-level docs/ folder
//    (must stay aligned with the content.config.ts patterns — see CLAUDE.md).
const watchPaths = [
  path.join(REPO_ROOT, 'README.md'),
  path.join(DOCS_ROOT, 'architecture'),
  path.join(DOCS_ROOT, 'identity'),
  path.join(DOCS_ROOT, 'implementation'),
];

const watcher = chokidar.watch(watchPaths, {
  ignored: /(^|[\\/])\.|node_modules|dist|\.astro/,
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
});

watcher
  .on('add', (p) => {
    log('watch', `+ ${path.relative(REPO_ROOT, p)}`);
    scheduleBuild();
  })
  .on('change', (p) => {
    log('watch', `~ ${path.relative(REPO_ROOT, p)}`);
    scheduleBuild();
  })
  .on('unlink', (p) => {
    log('watch', `- ${path.relative(REPO_ROOT, p)}`);
    scheduleBuild();
  })
  .on('ready', () => log('watch', 'ready, watching for .md changes'));

process.on('SIGINT', () => {
  log('main', 'shutting down...');
  watcher.close();
  preview.kill('SIGTERM');
  process.exit(0);
});
process.on('SIGTERM', () => {
  watcher.close();
  preview.kill('SIGTERM');
  process.exit(0);
});
