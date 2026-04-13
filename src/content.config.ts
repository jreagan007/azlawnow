/**
 * Content Collections Config — AZ Law Now
 * Astro 5 content layer with Zod schemas
 *
 * Three editorial voices, each with their own collection:
 *   insights      — Brendan Franks (data journalism, On Record)
 *   legal-guides  — Brandon Millam, J.D. (statute explainers, Answered)
 *   client-guides — Stephanie Ramirez (process guides, Guided)
 *
 * Plus practice-areas (separate, not editorial).
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

const legalGuides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/legal-guides' }),
  schema: articleSchema,
});

const clientGuides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/client-guides' }),
  schema: articleSchema,
});

/* ── Shared sub-schemas ───────────────────────────── */

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

/* ── Practice Areas ──────────────────────────────── */

const practiceAreaSchema = z.object({
  title: z.string(),
  description: z.string(),
  practiceArea: z.string(),
  cluster: z.enum(['vehicle-crashes', 'abuse-negligence', 'other-claims']),
  clusterLabel: z.string(),
  clusterOrder: z.number().default(10),
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  heroImage: z.string().optional(),
  author: z.string().default('brandon-millam'),
  ogImage: z.string().optional(),
  schemaType: z.string().default('LegalService'),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  keyTakeaway: z.string().optional(),
  faqs: z.array(faqItemSchema).default([]),
  dataSources: z.array(z.string()).default([]),
  relatedPracticeAreas: z.array(z.string()).default([]),
  relatedInvestigations: z.array(z.string()).default([]),
  relatedGuides: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  primaryKeyword: z.string().optional(),
  secondaryKeywords: z.array(z.string()).default([]),
  perplexityQuestions: z.array(z.string()).default([]),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  draft: z.boolean().default(false),
});

const practiceAreas = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/practice-areas' }),
  schema: practiceAreaSchema,
});

/* ── Insights (Brendan's data journalism) ────────── */

const insightSchema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string().default('brendan-franks'),
  category: z.enum([
    'crash-data',
    'safety-analysis',
    'abuse-investigation',
    'negligence-report',
    'infrastructure',
    'policy',
  ]),
  image: z.string().optional(),
  ogImage: z.string(),
  keyTakeaway: z.string().optional(),
  schemaType: z.string().default('NewsArticle'),
  tags: z.array(z.string()).default([]),
  faqs: z.array(faqItemSchema).default([]),
  dataSources: z.array(z.string()).default([]),
  readingTime: z.string().optional(),
  relatedPracticeAreas: z.array(z.string()).default([]),
  relatedInsights: z.array(z.string()).default([]),
  relatedGuides: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});

const insights = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/insights' }),
  schema: insightSchema,
});

/* ── Glossary (60-80 Arizona legal terms) ────────── */

const glossarySchema = z.object({
  term: z.string(),
  category: z.enum([
    'liability',
    'damages',
    'procedure',
    'insurance',
    'arizona-statute',
    'practice-specific',
  ]),
  definition: z.string(),
  arizonaContext: z.string().optional(),
  alsoKnownAs: z.array(z.string()).default([]),
  relatedTerms: z.array(z.string()).default([]),
  relatedPracticeAreas: z.array(z.string()).default([]),
  arsReference: z.string().optional(),
  arsUrl: z.string().optional(),
});

const glossary = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/glossary' }),
  schema: glossarySchema,
});

/* ── Export all collections ───────────────────────── */

export const collections = {
  insights,
  'legal-guides': legalGuides,
  'client-guides': clientGuides,
  'practice-areas': practiceAreas,
  glossary,
};
