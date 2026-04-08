# AZ Law Now — Claude Code Implementation Brief

## CONTEXT

You are working on the AZ Law Now Astro 5 site (`/Projects/az-law-now/`). This is a personal injury law firm site with a **southwestern editorial identity** — NOT a generic PI firm template. The design system uses warm cream backgrounds (#FAF5ED), dark headers (#1A1A1A), Golden Hour gold (#D4943A), Alert Vermillion (#C23B22), and Cormorant Garamond headings with DM Sans body text.

The site currently has 13 practice area pages as hardcoded `.astro` files and 3 content collections (resources, legal-guides, client-guides). We are restructuring everything into a **topical authority cluster system** with content collections driving the pages.

Read `src/data/site-config.ts`, `src/data/authors.ts`, `src/content.config.ts`, and `src/layouts/PracticeAreaLayout.astro` before starting any work.

---

## TASK 1: Add `practice-areas` and `investigations` collections to content.config.ts

The current `content.config.ts` has 3 collections (resources, legal-guides, client-guides) using a shared `articleSchema`. **Do not modify those existing collections.** Add two new ones:

### practice-areas collection

```typescript
const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const practiceAreaSchema = z.object({
  // Core
  title: z.string(),
  description: z.string(),
  practiceArea: z.string(),

  // Cluster routing
  cluster: z.enum(['vehicle-crashes', 'abuse-negligence', 'other-claims']),
  clusterLabel: z.string(),
  clusterOrder: z.number().default(10),

  // Hero
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  heroImage: z.string().optional(),

  // Author
  author: z.string().default('brandon-millam'),

  // SEO
  ogImage: z.string().optional(),
  schemaType: z.enum(['Article', 'LegalService', 'WebPage']).default('LegalService'),

  // Trust
  stats: z.array(z.object({
    value: z.string(),
    label: z.string(),
    source: z.string().optional(),
  })).optional(),

  // Content enrichment
  keyTakeaway: z.string().optional(),
  faqs: z.array(faqItemSchema).default([]),
  dataSources: z.array(z.string()).default([]),

  // Internal linking
  relatedPracticeAreas: z.array(z.string()).default([]),
  relatedInvestigations: z.array(z.string()).default([]),
  relatedGuides: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),

  // Keywords
  primaryKeyword: z.string().optional(),
  secondaryKeywords: z.array(z.string()).default([]),

  // Publishing
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  draft: z.boolean().default(false),
});

const practiceAreas = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/practice-areas' }),
  schema: practiceAreaSchema,
});
```

### investigations collection

```typescript
const investigationSchema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string().default('brendan-franks'),
  category: z.enum([
    'crash-data', 'safety-analysis', 'abuse-investigation',
    'negligence-report', 'infrastructure', 'policy',
  ]),
  ogImage: z.string(), // REQUIRED — 1200x675 min for Google Discover
  keyTakeaway: z.string(),
  schemaType: z.enum(['NewsArticle', 'Article']).default('NewsArticle'),
  tags: z.array(z.string()).default([]),
  faqs: z.array(faqItemSchema).default([]),
  dataSources: z.array(z.string()).default([]),
  readingTime: z.string().optional(),
  relatedPracticeAreas: z.array(z.string()).default([]),
  relatedInvestigations: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});

const investigations = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/investigations' }),
  schema: investigationSchema,
});
```

Add both to the `collections` export. Keep the `faqItemSchema` shared between them.

---

## TASK 2: Create directory structure

```
src/content/practice-areas/
  abuse-negligence/
    elder-abuse.mdx
    nursing-home-abuse.mdx
    child-abuse.mdx
    daycare-negligence.mdx
    school-abuse.mdx
    medical-negligence.mdx
  vehicle-crashes/
    car-accidents.mdx
    truck-accidents.mdx
    motorcycle-accidents.mdx
    pedestrian-accidents.mdx
    bus-accidents.mdx
    bicycle-accidents.mdx
    rideshare-accidents.mdx
  other-claims/
    slip-and-fall.mdx
    dog-bite.mdx
    wrongful-death.mdx
    premises-liability.mdx

src/content/investigations/
  (empty for now — will be populated later)
```

---

## TASK 3: Convert ALL 13 existing practice area .astro pages to MDX collection entries

Each existing page in `src/pages/` (e.g., `elder-abuse.astro`, `car-accidents.astro`, etc.) needs to be converted to an MDX file in the appropriate cluster subdirectory.

**How to convert each page:**

1. Read the existing .astro page
2. Extract the PracticeAreaLayout props (title, description, canonical, practiceArea, heroTitle, heroSubtitle, faqs)
3. Extract the body content (everything inside the `<PracticeAreaLayout>` tags)
4. Create an MDX file with frontmatter mapped from those props + new cluster fields
5. The body content becomes MDX markdown (convert `<p>` to paragraphs, `<h2>` to `##`, `<strong>` to `**`, etc.)
6. Add MDX component imports at top of body: `import { Callout } from '@/components/mdx/Callout';` etc.
7. Add appropriate Callout components where the content has important warnings or tips

**Cluster assignments:**

| Page | Cluster | clusterOrder |
|------|---------|-------------|
| car-accidents | vehicle-crashes | 1 |
| truck-accidents | vehicle-crashes | 2 |
| motorcycle-accidents | vehicle-crashes | 3 |
| pedestrian-accidents | vehicle-crashes | 4 |
| bus-accidents | vehicle-crashes | 5 |
| bicycle-accidents | vehicle-crashes | 6 |
| rideshare-accidents | vehicle-crashes | 7 |
| elder-abuse | abuse-negligence | 1 |
| nursing-home-abuse | abuse-negligence | 2 |
| medical-negligence | abuse-negligence | 3 |
| child-abuse* | abuse-negligence | 4 |
| daycare-negligence* | abuse-negligence | 5 |
| school-abuse* | abuse-negligence | 6 |
| slip-and-fall | other-claims | 1 |
| wrongful-death | other-claims | 2 |
| dog-bite | other-claims | 3 |
| premises-liability | other-claims | 4 |

*Pages marked with * don't have existing .astro files — create NEW MDX content for these. Use the same editorial tone as the existing pages. Research Arizona-specific statutes:
- child-abuse: ARS 8-201, ARS 13-3623
- daycare-negligence: ADHS licensing requirements, Title 9 Chapter 3
- school-abuse: ARS 15-341, Title 15 Chapter 3, governmental immunity issues

**Frontmatter template for each MDX file:**

```yaml
---
title: "[Full SEO title] | AZ Law Now"
description: "[Meta description with keyword, location, phone number]"
practiceArea: "[Display Name]"
cluster: "[vehicle-crashes|abuse-negligence|other-claims]"
clusterLabel: "[Vehicle Crashes|Abuse & Negligence|Other Claims]"
clusterOrder: [number]
heroTitle: "[H1 headline]"
heroSubtitle: "[1-2 sentence editorial subtitle]"
author: "brandon-millam"
primaryKeyword: "[main target keyword from keyword-universe]"
secondaryKeywords: ["keyword2", "keyword3"]
publishedAt: "2026-04-07"
relatedPracticeAreas: ["slug1", "slug2"]
relatedGuides: ["slug1"]
locations: ["buckeye", "maricopa", "phoenix", "goodyear"]
faqs:
  - question: "..."
    answer: "..."
---
```

**Author assignments:**
- ALL practice area pages: `brandon-millam` (he's the J.D., these are legal authority pages)
- The body content should be written in **third person** (Brandon's voice for legal content)

---

## TASK 4: Create cluster hub pages and dynamic routing

Create 3 cluster directories in `src/pages/` with hub + dynamic route pages:

### Hub page pattern (`src/pages/[cluster]/index.astro`)

Each hub is an **editorial section page** — think newspaper section front, NOT a generic services grid.

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

const allPracticeAreas = await getCollection('practice-areas');
const clusterPages = allPracticeAreas
  .filter(pa => pa.data.cluster === 'abuse-negligence' && !pa.data.draft)
  .sort((a, b) => a.data.clusterOrder - b.data.clusterOrder);
---
```

Design requirements for hub pages:
- Warm cream background (#FAF5ED)
- Vermillion 4px accent bar at top
- Small gold dateline label: "SECTION · LEGAL AUTHORITY"
- Large Cormorant Garamond headline (e.g., "Abuse & Negligence")
- 1-2 paragraph editorial intro
- Grid of practice area cards (gold left border, practiceArea name, heroSubtitle, arrow link)
- Dark CTA band at bottom with "Free Case Review" button using `.btn .btn-primary`
- schema.org CollectionPage markup
- Breadcrumbs: Home > [Cluster Name]

Create for: `abuse-negligence`, `vehicle-crashes`, `other-claims`

### Dynamic route pattern (`src/pages/[cluster]/[...slug].astro`)

```astro
---
import { getCollection, render } from 'astro:content';
import PracticeAreaLayout from '../../layouts/PracticeAreaLayout.astro';

export async function getStaticPaths() {
  const allPracticeAreas = await getCollection('practice-areas');
  return allPracticeAreas
    .filter(pa => pa.data.cluster === 'abuse-negligence' && !pa.data.draft)
    .map(pa => {
      // ID is like "abuse-negligence/elder-abuse" — extract the slug part
      const slug = pa.id.split('/').pop() || pa.id;
      return {
        params: { slug },
        props: { entry: pa },
      };
    });
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const { data } = entry;
---

<PracticeAreaLayout
  title={data.title}
  description={data.description}
  canonical={`/${data.cluster}/${entry.id.split('/').pop()}/`}
  practiceArea={data.practiceArea}
  heroTitle={data.heroTitle}
  heroSubtitle={data.heroSubtitle}
  heroImage={data.heroImage}
  faqs={data.faqs}
>
  <Content />
</PracticeAreaLayout>
```

Create for: `abuse-negligence`, `vehicle-crashes`, `other-claims`

---

## TASK 5: Update PracticeAreaLayout.astro breadcrumbs

The current breadcrumbs are: Home > [Practice Area]. Update to support cluster:

```
Home > Abuse & Negligence > Elder Abuse
Home > Vehicle Crashes > Car Accidents
```

Add optional `clusterLabel` and `cluster` props to PracticeAreaLayout. If provided, insert the cluster as a middle breadcrumb. Don't break existing behavior — make them optional.

---

## TASK 6: Set up redirects from old flat URLs

The old flat URLs (`/elder-abuse/`, `/car-accidents/`, etc.) need to redirect to the new cluster URLs (`/abuse-negligence/elder-abuse/`, `/vehicle-crashes/car-accidents/`, etc.).

**Option A (preferred):** Create small redirect `.astro` pages that replace the old ones:

For each old page (e.g., `src/pages/elder-abuse.astro`), replace the content with:

```astro
---
return Astro.redirect('/abuse-negligence/elder-abuse/', 301);
---
```

**Full redirect map:**

| Old URL | New URL |
|---------|---------|
| /car-accidents/ | /vehicle-crashes/car-accidents/ |
| /truck-accidents/ | /vehicle-crashes/truck-accidents/ |
| /motorcycle-accidents/ | /vehicle-crashes/motorcycle-accidents/ |
| /pedestrian-accidents/ | /vehicle-crashes/pedestrian-accidents/ |
| /bus-accidents/ | /vehicle-crashes/bus-accidents/ |
| /bicycle-accidents/ | /vehicle-crashes/bicycle-accidents/ |
| /rideshare-accidents/ | /vehicle-crashes/rideshare-accidents/ |
| /elder-abuse/ | /abuse-negligence/elder-abuse/ |
| /nursing-home-abuse/ | /abuse-negligence/nursing-home-abuse/ |
| /medical-negligence/ | /abuse-negligence/medical-negligence/ |
| /slip-and-fall/ | /other-claims/slip-and-fall/ |
| /dog-bite/ | /other-claims/dog-bite/ |
| /wrongful-death/ | /other-claims/wrongful-death/ |
| /premises-liability/ | /other-claims/premises-liability/ |

---

## TASK 7: Create investigations route

Create `src/pages/investigations/index.astro` and `src/pages/investigations/[...slug].astro`.

The investigations index should be a **newspaper front page** layout:
- Featured investigation at top (full-width card, large image, bold headline)
- Grid of remaining investigations below
- Category filter pills (crash-data, safety-analysis, abuse-investigation, etc.)
- Each card: ogImage, category badge, date, reading time, title, keyTakeaway
- Author byline with photo on each card
- Use `ArticleLayout.astro` for individual investigation pages (not PracticeAreaLayout)

The individual `[...slug].astro` should render with:
- Reading progress bar at top
- Speakable markup on headline and keyTakeaway (for Google Discover)
- Author byline with headshot
- Data sources badge
- Related investigations at bottom
- Related practice area links
- CTA section at end

---

## TASK 8: Update navigation

Update `src/components/Header.astro` nav items. Change the Practice Areas dropdown to reflect the cluster structure:

```typescript
{
  label: 'Practice Areas',
  href: '/vehicle-crashes/',
  groupedDropdown: [
    {
      heading: 'Vehicle Crashes',
      items: [
        { label: 'Car Accidents', href: '/vehicle-crashes/car-accidents/' },
        { label: 'Truck Accidents', href: '/vehicle-crashes/truck-accidents/' },
        // ... etc
      ],
    },
    {
      heading: 'Abuse & Negligence',
      items: [
        { label: 'Elder Abuse', href: '/abuse-negligence/elder-abuse/' },
        { label: 'Nursing Home Abuse', href: '/abuse-negligence/nursing-home-abuse/' },
        // ... etc (include child-abuse, daycare-negligence, school-abuse)
      ],
    },
    {
      heading: 'Other Claims',
      items: [
        { label: 'Slip and Fall', href: '/other-claims/slip-and-fall/' },
        // ... etc
      ],
    },
  ],
},
```

Add "Investigations" as a new top-level nav item linking to `/investigations/`.

---

## TASK 9: Update Footer.astro practice area links

Mirror the same cluster URL structure in the footer practice area links.

---

## TASK 10: Update homepage links

In `src/pages/index.astro`, update any practice area links to use the new cluster URLs.

---

## TASK 11: Update site-config.ts navigation arrays

Update `mainNavigation` and any other nav arrays in `src/data/site-config.ts` to use the new cluster URLs.

---

## IMPORTANT RULES

1. **Do NOT touch BaseLayout.astro** — the global styles and button system are finalized
2. **Do NOT change the color system** — #1A1A1A, #D4943A, #FAF5ED, #8B4513, #C23B22, #4A5859 are LOCKED
3. **Do NOT change fonts** — Cormorant Garamond (headings), DM Sans (body), JetBrains Mono (code)
4. **Use the global `.btn` system** for all buttons — `.btn .btn-primary`, `.btn .btn-secondary`, etc. No hardcoded button CSS
5. **Three-author system:** Brendan (investigations, first person), Brandon J.D. (legal/practice areas, third person), Stephanie (client guides, second person)
6. **Messaging layers:** L1 "You Get Answers." L5 "Talk to My Team" L7 "You Deserve Answers." — use these in CTAs
7. **All new pages must use MDX** with component imports from `@/components/mdx/`
8. **Run `npm run build` after all changes** to verify no type errors or broken routes
9. **Do NOT generate placeholder images** — image paths in frontmatter can reference files that don't exist yet
10. Reference `src/content/resources/arizona-nursing-home-violations.mdx` as the gold standard for MDX content quality — data-driven, source-cited, editorial tone

## EXECUTION ORDER

Do tasks in this order: 1 → 2 → 3 → 4 → 5 → 6 → 8 → 9 → 10 → 11 → 7 → build

Task 7 (investigations route) is last because we have no investigation MDX files yet — just create the routing pages so they're ready.

## REFERENCE FILES

- `src/data/site-config.ts` — firm data, phone, address, messaging layers
- `src/data/authors.ts` — three-author system with photo paths
- `src/layouts/PracticeAreaLayout.astro` — current practice area layout (keep using it)
- `src/layouts/ArticleLayout.astro` — article layout (use for investigations)
- `src/content/resources/arizona-nursing-home-violations.mdx` — gold standard content example
- `src/utils/schema.ts` — schema.org generation utilities
- Desktop/azlawnow-handoff/content-plan.csv — keyword targets and page priorities
- Desktop/azlawnow-handoff/keyword-universe-az-relevant.csv — full keyword data
