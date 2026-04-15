/**
 * Google News Sitemap
 * Docs: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../data/site-config';

const NEWS_WINDOW_HOURS = 168;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toDate(value: string | Date | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export const GET: APIRoute = async () => {
  const insights = await getCollection('investigations', ({ data }) => !data.draft);

  const siteUrl = siteConfig.siteUrl.replace(/\/$/, '');
  const now = Date.now();
  const windowMs = NEWS_WINDOW_HOURS * 60 * 60 * 1000;

  const recent = insights
    .map((entry) => ({ entry, published: toDate(entry.data.publishedAt) }))
    .filter(({ published }) => published !== null && now - published.getTime() <= windowMs);

  const urls = recent
    .map(({ entry, published }) => {
      const slug = entry.id.replace(/\.mdx$/, '');
      const loc = `${siteUrl}/investigations/${slug}/`;
      const pubDate = (published as Date).toISOString();
      const title = escapeXml(entry.data.title);
      return `  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>AZ Law Now</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900',
    },
  });
};
