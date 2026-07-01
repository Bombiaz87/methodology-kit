// KIT · [Node-ref] — Astro+Starlight config as a pure renderer of the docs/ tree. Expected behavior: sidebar generated at build-time by walking docs/ (no copy/symlink), locale-root without prefix, accordion JS, host whitelist for preview behind a proxy.

// @ts-check

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The site is only a renderer: the docs live in ../../docs/ (NOT copied inside here).
const DOCS_ROOT = path.resolve(__dirname, '../../docs/');

/**
 * Lists the .md files of a folder and produces {label, link} items ordered by file name.
 * If the filename has a numeric prefix (e.g. "01-", "002-") and the title doesn't
 * already contain it, it prepends it to the label to preserve the numbering.
 *
 * In plain language: it reads the filesystem at startup and builds by itself the
 * sidebar entries for that folder. Add a .md and it appears on its own.
 *
 * @param {string} relPath   path relative to DOCS_ROOT (e.g. 'architecture/decisions')
 * @param {string} urlPrefix URL prefix of the section (e.g. '/architecture/decisions/')
 * @param {string[]} [exclude] filenames to skip
 */
function dirToSidebarItems(relPath, urlPrefix, exclude = []) {
  const absPath = path.join(DOCS_ROOT, relPath);
  if (!fs.existsSync(absPath)) return [];
  return fs
    .readdirSync(absPath)
    .filter((f) => f.endsWith('.md') && f !== 'README.md' && !exclude.includes(f))
    .sort()
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      const fullPath = path.join(absPath, f);
      const content = fs.readFileSync(fullPath, 'utf8');
      const titleMatch = content.match(/^title:\s*"?([^"\n]+?)"?$/m);
      const title = titleMatch ? titleMatch[1].trim().replace(/"$/, '') : slug;

      // Extracts the numeric prefix from the filename (01-, 002-, etc.)
      const numMatch = f.match(/^(\d+)[-_]/);
      const num = numMatch ? numMatch[1] : null;
      // If the title already contains that number don't duplicate it (e.g. titles "ADR 001 —").
      const label = num && !title.includes(num) ? `${num} · ${title}` : title;

      return { label, link: `${urlPrefix}${slug}/` };
    });
}

export default defineConfig({
  // {{DOMAIN_PROD}} = public domain of the doc-site (or {{DOMAIN_DEV}} in dev).
  site: 'https://docs.{{DOMAIN_PROD}}',
  outDir: './dist',
  server: { host: '127.0.0.1', port: 3004 },
  vite: {
    // Astro preview/dev reject non-whitelisted Hosts: needed when the site is
    // behind a reverse-proxy that rewrites the Host (see CLAUDE.md → proxy gotcha).
    preview: {
      allowedHosts: ['docs.{{DOMAIN_PROD}}', 'docs.{{DOMAIN_DEV}}', 'localhost', '127.0.0.1'],
    },
    server: {
      allowedHosts: ['docs.{{DOMAIN_PROD}}', 'docs.{{DOMAIN_DEV}}', 'localhost', '127.0.0.1'],
    },
  },
  integrations: [
    starlight({
      title: '{{PROJECT}}',
      description: 'Product, architecture and process documentation for {{PROJECT}}',
      // Logo: replace with your assets (Starlight renders the logo as an <img>, so
      // you need light/dark variants; replacesTitle hides the text if the logo
      // already contains the name). Placeholder: remove the block if you have no logo.
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: true,
      },
      favicon: '/favicon.svg',
      // locale-root: no /en/ prefix in the URLs.
      defaultLocale: 'root',
      locales: { root: { label: 'English', lang: 'en' } },
      head: [
        {
          // Accordion JS: opening a sidebar group closes its siblings at the
          // same level. Pure progressive-enhancement, no dependencies.
          tag: 'script',
          content: `
            function bindSidebarAccordion() {
              document.querySelectorAll('details').forEach(function(d) {
                if (d.dataset.accordionBound) return;
                d.dataset.accordionBound = '1';
                d.addEventListener('toggle', function() {
                  if (!d.open) return;
                  var li = d.closest('li');
                  if (!li || !li.parentElement) return;
                  li.parentElement.querySelectorAll(':scope > li > details').forEach(function(o) {
                    if (o !== d && o.open) o.open = false;
                  });
                });
              });
            }
            document.addEventListener('astro:page-load', bindSidebarAccordion);
            document.addEventListener('DOMContentLoaded', bindSidebarAccordion);
          `,
        },
      ],
      // ── Sidebar ─────────────────────────────────────────────────────────────
      // A mix of explicit entries (fixed links) + dirToSidebarItems() (auto from the FS).
      // Generalize the groups over YOUR top-level docs/ folders.
      sidebar: [
        {
          label: 'Architecture',
          collapsed: true,
          items: [
            { label: 'Overview & roadmap', link: '/architecture/' },
            { label: 'Code conventions', link: '/architecture/code-conventions/' },
            {
              label: 'Decisions (ADR)',
              collapsed: true,
              items: dirToSidebarItems('architecture/decisions', '/architecture/decisions/'),
            },
          ],
        },
        {
          label: 'Implementation',
          collapsed: false,
          items: [
            { label: 'Overview', link: '/implementation/' },
            { label: 'Quick start', link: '/implementation/00-quick-start/' },
            { label: 'STATE (live)', link: '/implementation/STATE/' },
            { label: 'JOURNAL', link: '/implementation/JOURNAL/' },
            { label: 'Status dashboard', link: '/' },
            {
              label: 'Discipline (workflow)',
              collapsed: true,
              items: dirToSidebarItems(
                'implementation/20-discipline',
                '/implementation/20-discipline/',
              ),
            },
            {
              label: 'Reference',
              collapsed: true,
              items: dirToSidebarItems(
                'implementation/30-reference',
                '/implementation/30-reference/',
              ),
            },
          ],
        },
        {
          label: 'Identity',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/identity/' },
            ...dirToSidebarItems('identity', '/identity/'),
          ],
        },
        // Add here other top-level groups of YOUR docs/ with the same pattern.
      ],
      customCss: ['./src/styles/custom.css'],
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
    }),
  ],
});
