/**
 * Content Collections Config — AZ Law Now
 * Astro 5 content layer with Zod schemas
 *
 * Collections:
 *   resources     — Brendan's data investigations (NewsArticle schema)
 *   legal-guides  — Brandon's statute explainers (Article schema)
 *   client-guides — Stephanie's process guides (Article schema)
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string(),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  image: z.string().optional(),
  ogImage: z.string().optional(),
  readingTime: z.string().optional(),
  schemaType: z.enum(['Article', 'NewsArticle']).default('Article'),
});

const resources = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/resources' }),
  schema: articleSchema,
});

const legalGuides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/legal-guides' }),
  schema: articleSchema,
});

const clientGuides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/client-guides' }),
  schema: articleSchema,
});

export const collections = {
  resources,
  'legal-guides': legalGuides,
  'client-guides': clientGuides,
};
