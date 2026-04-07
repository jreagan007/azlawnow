/**
 * Content Collections Config — AZ Law Now
 * Astro 5 content layer with Zod schemas
 *
 * Collections:
 *   practice-areas  — Topical authority cluster pages (vehicle-crashes, abuse-negligence, other-claims)
 *   investigations   — Data-led journalism for Google Discover (Brendan byline)
 *   legal-guides     — Statutory breakdowns and legal analysis (Brandon J.D. byline)
 *   client-guides    — Action plans and process walkthroughs (Stephanie byline)
 *   resources        — Reference data, stats, tools
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ========================================
   SHARED SUB-SCHEMAS
   ======================================== */

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const statItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  source: z.string().optional(),
});

const relatedLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

/* ========================================
   PRACTICE AREAS — Topical Authority Clusters
   ======================================== */

const practiceAreaSchema = z.object({
  // Core
  title: z.string(),
  description: z.string(),
  practiceArea: z.string(),

  // Cluster routing
  cluster: z.enum(['vehicle-crashes', 'abuse-negligence', 'other-claims']),
  clusterLabel: z.string(), // "Vehicle Crashes", "Abuse & Negligence", "Other Claims"
  clusterOrder: z.number().default(10), // Sort order within cluster

  // Hero
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  heroImage: z.string().optional(),

  // Author (defaults to brandon-millam for practice areas)
  author: z.string().default('brandon-millam'),

  // SEO & Schema
  ogImage: z.string().optional(),
  schemaType: z.enum(['Article', 'LegalService', 'WebPage']).default('LegalService'),
  canonicalOverride: z.string().optional(),

  // Trust elements
  stats: z.array(statItemSchema).optional(),
  showTrustBar: z.boolean().default(true),

  // Content enrichment
  keyTakeaway: z.string().optional(),
  faqs: z.array(faqItemSchema).default([]),
  dataSources: z.array(z.string()).default([]),

  // Internal linking
  relatedPracticeAreas: z.array(z.string()).default([]),
  relatedInvestigations: z.array(z.string()).default([]),
  relatedGuides: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]), // Relevant geo-clusters

  // Content plan metadata
  primaryKeyword: z.string().optional(),
  secondaryKeywords: z.array(z.string()).default([]),
  searchVolume: z.number().optional(),

  // Publishing
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  draft: z.boolean().default(false),
});

/* ========================================
   INVESTIGATIONS — Data-Led Journalism (Discover)
   ======================================== */

const investigationSchema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string().default('brendan-franks'),

  // Category for filtering
  category: z.enum([
    'crash-data',
    'safety-analysis',
    'abuse-investigation',
    'negligence-report',
    'infrastructure',
    'policy',
  ]),

  // Discover optimization
  ogImage: z.string(), // REQUIRED for Discover — 1200x675 min
  keyTakeaway: z.string(), // 1-2 sentences for cards + speakable
  schemaType: z.enum(['NewsArticle', 'Article']).default('NewsArticle'),

  // Content enrichment
  tags: z.array(z.string()).default([]),
  faqs: z.array(faqItemSchema).default([]),
  dataSources: z.array(z.string()).default([]),
  readingTime: z.string().optional(),

  // Internal linking
  relatedPracticeAreas: z.array(z.string()).default([]),
  relatedInvestigations: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),

  // Publishing
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});

/* ========================================
   ARTICLES (shared schema for guides + resources)
   ======================================== */

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
  // Linking
  relatedPracticeAreas: z.array(z.string()).default([]),
  faqs: z.array(faqItemSchema).default([]),
  keyTakeaway: z.string().optional(),
});

/* ========================================
   COLLECTION DEFINITIONS
   ======================================== */

const practiceAreas = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/practice-areas' }),
  schema: practiceAreaSchema,
});

const investigations = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/investigations' }),
  schema: investigationSchema,
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
  'practice-areas': practiceAreas,
  investigations,
  resources,
  'legal-guides': legalGuides,
  'client-guides': clientGuides,
};
