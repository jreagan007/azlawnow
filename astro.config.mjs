// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { writeFileSync, readFileSync, unlinkSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Build lastmod map from content frontmatter dates + git commit dates
/** @param {string} siteUrl */
function buildLastmodMap(siteUrl) {
  /** @type {Record<string, Date>} */
  const map = {};

  const contentDirs = [
    { dir: './src/content/resources', prefix: '/resources/' },
    { dir: './src/content/legal-guides', prefix: '/legal-guides/' },
    { dir: './src/content/client-guides', prefix: '/client-guides/' },
    { dir: './src/content/insights', prefix: '/insights/' },
  ];

  for (const { dir, prefix } of contentDirs) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.mdx')) continue;
      const content = readFileSync(join(dir, file), 'utf-8');
      const updatedMatch = content.match(/updatedAt:\s*["']?(\d{4}-\d{2}-\d{2})["']?/);
      const publishedMatch = content.match(/publishedAt:\s*["']?(\d{4}-\d{2}-\d{2})["']?/);
      const dateStr = updatedMatch?.[1] || publishedMatch?.[1];
      if (dateStr) {
        const slug = file.replace('.mdx', '');
        map[`${siteUrl}${prefix}${slug}/`] = new Date(dateStr);
      }
    }
  }

  // Git-based dates for Astro pages
  try {
    const pagesDir = './src/pages';
    /** @param {string} dir @param {string} urlPrefix */
    function walkPages(dir, urlPrefix = '') {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walkPages(fullPath, `${urlPrefix}/${entry}`);
        } else if (entry.endsWith('.astro')) {
          const urlPath = entry === 'index.astro'
            ? `${urlPrefix}/`
            : `${urlPrefix}/${entry.replace('.astro', '')}/`;
          const fullUrl = `${siteUrl}${urlPath || '/'}`;
          if (map[fullUrl]) continue;
          try {
            const gitDate = execSync(
              `git log -1 --format=%aI -- "${fullPath}"`,
              { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
            ).trim();
            if (gitDate) {
              map[fullUrl] = new Date(gitDate);
            }
          } catch { /* skip */ }
        }
      }
    }
    walkPages(pagesDir);
  } catch { /* skip */ }

  return map;
}

// Flatten sitemap index into single sitemap.xml
function flattenSitemap() {
  return {
    name: 'flatten-sitemap',
    hooks: {
      'astro:build:done': (/** @type {{ dir: URL }} */ { dir }) => {
        const sitemap0 = new URL('sitemap-0.xml', dir);
        const sitemapIndex = new URL('sitemap-index.xml', dir);
        const sitemapFinal = new URL('sitemap.xml', dir);

        if (existsSync(sitemap0)) {
          const content = readFileSync(sitemap0, 'utf-8');
          writeFileSync(sitemapFinal, content);
          unlinkSync(sitemap0);
        }
        if (existsSync(sitemapIndex)) {
          unlinkSync(sitemapIndex);
        }
      },
    },
  };
}

// Hardcoded canonical — Netlify's process.env.URL resolves to the netlify.app
// subdomain unless the primary domain is configured. Always emit canonical
// azlawnow.com URLs in sitemap + meta tags regardless of build environment.
const siteUrl = 'https://azlawnow.com';
const lastmodMap = buildLastmodMap(siteUrl);

export default defineConfig({
  site: siteUrl,

  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => {
        const excluded = ['/admin/', '/thank-you/', '/free-case-review/'];
        return !excluded.some(e => page.includes(e));
      },
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        const lastmod = lastmodMap[item.url];
        if (lastmod) {
          item.lastmod = lastmod;
        }
        return item;
      },
    }),
    flattenSitemap(),
  ],

  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },

  output: 'static',

  build: {
    assets: '_assets',
    inlineStylesheets: 'auto',
  },

  vite: {
    resolve: {
      alias: { '@': resolve(fileURLToPath(import.meta.url), '../src') },
    },
    ssr: {
      noExternal: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
    },
    optimizeDeps: {
      include: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
    },
  },
});
