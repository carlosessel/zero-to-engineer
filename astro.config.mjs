import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// SITE_URL and SITE_BASE are set by the deploy workflow (see README, "Deploying").
// Locally they are not needed.
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'always',
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'github-dark-default', wrap: false },
  },
});
