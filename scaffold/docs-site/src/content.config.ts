// KIT · [Node-ref] — Astro content collection that loads the .md files DIRECTLY from ../../docs/ (no copy). Expected behavior: glob loader with include/exclude patterns + generateId that collapses {folder}/README.md → /{folder}/.

import { z } from 'astro:content';
import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';

// Patterns of the top-level docs/ folders to include in the site.
// In plain language: the list of what goes into the site. A leading `!` excludes.
// Add here every new top-level folder (see CLAUDE.md → "Adding a folder").
const DOCS_PATTERN = [
  // The root README is NOT included: the home is handled by pages/index.astro (dashboard).
  'architecture/**/*.{md,mdx}',
  'identity/**/*.{md,mdx}',
  'implementation/**/*.{md,mdx}',
  // Example exclusion: work/research files not meant for the online site
  // (no Starlight frontmatter, not part of the living docs). Exclude them in CI too.
  '!implementation/**/research/**',
];

export const collections = {
  docs: defineCollection({
    loader: glob({
      pattern: DOCS_PATTERN,
      // base points OUTSIDE the app: the site reads the docs where they actually live.
      base: '../../docs/',
      generateId: ({ entry }) => {
        // README in a folder → slug '{folder}' (collapses the section home to the folder).
        if (entry.endsWith('/README.md')) {
          return entry.replace(/\/README\.md$/, '');
        }
        return entry.replace(/\.(md|mdx)$/, '');
      },
    }),
    // Extend the Starlight schema with the extra frontmatter fields you use.
    // All optional: they don't break files that don't have them.
    schema: docsSchema({
      extend: z.object({
        // Example of custom fields used by widgets/dashboard. Adapt or empty.
        tags: z.array(z.string()).optional(),
        url: z.string().url().optional(),
      }),
    }),
  }),
};
