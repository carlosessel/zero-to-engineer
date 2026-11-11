import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import { rehypeGlossaryLinks } from './src/lib/glossary-links.mjs';

// SITE_URL and SITE_BASE are set by the deploy workflow (see README, "Deploying").
// Locally they are not needed.
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base,
  trailingSlash: 'always',
  integrations: [mdx()],
  markdown: {
    // The unified (remark/rehype) processor is used, instead of Astro's
    // default, because the glossary links are added by a rehype plugin.
    processor: unified({ rehypePlugins: [[rehypeGlossaryLinks, { base }]] }),
    shikiConfig: { theme: 'github-dark-default', wrap: false },
  },
});
