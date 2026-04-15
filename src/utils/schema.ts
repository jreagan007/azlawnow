/**
 * Schema.org JSON-LD generators for AZ Law Now
 * Structured data for rich search results
 */

import { siteConfig } from '../data/site-config';
import { authors, getAuthorSameAs } from '../data/authors';

// Resolve siteUrl at runtime (Astro SITE env or fallback)
function getSiteUrl(): string {
  try {
    return (import.meta.env.SITE || siteConfig.siteUrl).replace(/\/$/, '');
  } catch {
    return siteConfig.siteUrl.replace(/\/$/, '');
  }
}

// ============================================
// CONSTANTS
// ============================================

// Statewide coverage across Maricopa, Pima, Pinal, Coconino, Yavapai, Mohave,
// Yuma, and Cochise counties. Schema areaServed reflects actual intake reach
// (phones + video intake + home visits) rather than just the West Valley HQ.
const ARIZONA_CITIES = [
  // Phoenix metro — West Valley
  'Phoenix',
  'Buckeye',
  'Maricopa',
  'Goodyear',
  'Avondale',
  'Surprise',
  'Peoria',
  'Glendale',
  'Tolleson',
  'Litchfield Park',
  // Phoenix metro — East Valley
  'Mesa',
  'Chandler',
  'Gilbert',
  'Scottsdale',
  'Tempe',
  'Queen Creek',
  'Apache Junction',
  // Tucson metro
  'Tucson',
  'Marana',
  'Oro Valley',
  'Sahuarita',
  'Vail',
  // Northern / other
  'Flagstaff',
  'Sedona',
  'Prescott',
  'Prescott Valley',
  'Yuma',
  'Lake Havasu City',
  'Bullhead City',
  'Kingman',
  'Sierra Vista',
  'Casa Grande',
];

const PRACTICE_AREAS = [
  'Car Accidents',
  'Truck Accidents',
  'Motorcycle Accidents',
  'Wrongful Death',
  'School Bus Accidents',
  'Elder Abuse',
  'Nursing Home Abuse',
  'Pedestrian Accidents',
  'Bicycle Accidents',
  'Slip and Fall',
  'Medical Negligence',
  'Dog Bite',
];

// ============================================
// CORE SITE-WIDE SCHEMAS
// ============================================

/**
 * WebSite schema — required for Google sitelinks searchbox
 * Include on every page via BaseLayout
 */
export function getWebSiteSchema() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: siteConfig.siteName,
    alternateName: siteConfig.legalName,
    url: siteUrl,
    description: siteConfig.defaultDescription,
    publisher: {
      '@type': 'LegalService',
      '@id': `${siteUrl}/#organization`,
    },
    inLanguage: 'en-US',
  };
}

/**
 * Organization/LegalService schema — comprehensive business info
 * Include on every page via BaseLayout
 */
export function getOrganizationSchema() {
  const siteUrl = getSiteUrl();
  const sameAsLinks = Object.values(siteConfig.social).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${siteUrl}/#organization`,
    name: siteConfig.legalName,
    alternateName: siteConfig.siteName,
    legalName: siteConfig.legalName,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      '@id': `${siteUrl}/#logo`,
      url: `${siteUrl}${siteConfig.logo}`,
      contentUrl: `${siteUrl}${siteConfig.logo}`,
      caption: siteConfig.siteName,
      inLanguage: 'en-US',
    },
    description: siteConfig.defaultDescription,
    slogan: siteConfig.tagline,
    telephone: siteConfig.phoneE164,
    email: siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      '@id': `${siteUrl}/#address`,
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.zip,
      addressCountry: siteConfig.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: siteConfig.geo.latitude,
      longitude: siteConfig.geo.longitude,
    },
    location: siteConfig.offices.map((office) => ({
      '@type': 'Place',
      '@id': `${siteUrl}/#office-${office.id}`,
      name: office.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: office.street,
        addressLocality: office.city,
        addressRegion: office.state,
        postalCode: office.zip,
        addressCountry: office.country,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: office.geo.latitude,
        longitude: office.geo.longitude,
      },
      telephone: office.phoneE164,
      hasMap: office.googlePlaceId
        ? `https://www.google.com/maps/place/?q=place_id:${office.googlePlaceId}`
        : undefined,
    })),
    areaServed: [
      ...ARIZONA_CITIES.map((city) => ({
        '@type': 'City',
        name: `${city}, Arizona`,
        containedInPlace: {
          '@type': 'State',
          name: 'Arizona',
        },
      })),
      { '@type': 'State', name: 'Arizona' },
    ],
    priceRange: 'Contingency representation',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Contingency Fee',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        '@id': `${siteUrl}/#contact`,
        telephone: siteConfig.phoneE164,
        contactType: 'customer service',
        areaServed: 'US',
        availableLanguage: ['English', 'Spanish'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '08:00',
          closes: '18:00',
        },
      },
    ],
    ...(sameAsLinks.length > 0 && { sameAs: sameAsLinks }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Personal Injury Legal Services',
      itemListElement: PRACTICE_AREAS.map((area, index) => ({
        '@type': 'OfferCatalog',
        '@id': `${siteUrl}/#service-${index}`,
        name: area,
        itemListElement: {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: `${area} Attorney`,
            description: `${area.toLowerCase()} legal representation across Arizona.`,
            provider: {
              '@type': 'LegalService',
              '@id': `${siteUrl}/#organization`,
            },
          },
        },
      })),
    },
    knowsAbout: PRACTICE_AREAS,
    knowsLanguage: ['en', 'es'],
  };
}

/**
 * SiteNavigationElement schema — helps search engines understand site structure
 * Include on every page via BaseLayout
 */
export function getSiteNavigationSchema() {
  const siteUrl = getSiteUrl();
  const allNavItems = [
    ...siteConfig.mainNavigation,
    ...siteConfig.locationPages,
    ...siteConfig.companyNav,
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    '@id': `${siteUrl}/#navigation`,
    name: 'Main Navigation',
    hasPart: allNavItems.map((item) => ({
      '@type': 'SiteNavigationElement',
      name: item.name,
      url: `${siteUrl}${item.url}`,
    })),
  };
}

/**
 * Get all site-wide schemas as an array (for BaseLayout)
 */
export function getSiteWideSchemas() {
  return [
    getWebSiteSchema(),
    getOrganizationSchema(),
    getSiteNavigationSchema(),
  ];
}

// ============================================
// PAGE-SPECIFIC SCHEMAS
// ============================================

/**
 * WebPage schema — base for all pages
 */
export function getWebPageSchema(props: {
  name: string;
  description: string;
  url: string;
  type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' | 'FAQPage';
}) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': props.type || 'WebPage',
    name: props.name,
    description: props.description,
    url: props.url.startsWith('http') ? props.url : `${siteUrl}${props.url}`,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: siteConfig.siteName,
      url: siteUrl,
    },
    about: {
      '@type': 'LegalService',
      '@id': `${siteUrl}/#organization`,
    },
    inLanguage: 'en-US',
  };
}

/**
 * AboutPage schema
 */
export function getAboutPageSchema() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About AZ Law Now',
    description: 'Arizona personal injury attorneys serving clients statewide, from Phoenix and Tucson to Flagstaff, Yuma, and every county in between. Contingency representation. Confidential intake.',
    url: `${siteUrl}/about/`,
    mainEntity: {
      '@type': 'LegalService',
      '@id': `${siteUrl}/#organization`,
    },
  };
}

/**
 * ContactPage schema
 */
export function getContactPageSchema() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact AZ Law Now',
    description: 'Contact AZ Law Now. Confidential intake by phone or form. Call (602) 654-0202.',
    url: `${siteUrl}/contact/`,
    mainEntity: {
      '@type': 'LegalService',
      '@id': `${siteUrl}/#organization`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: siteConfig.phoneE164,
        contactType: 'customer service',
        areaServed: 'US',
        availableLanguage: ['English', 'Spanish'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '08:00',
          closes: '18:00',
        },
      },
    },
  };
}

/**
 * Review/Testimonial page with AggregateRating
 */
export function getReviewPageSchema(
  reviews: Array<{ name: string; text: string; rating: number }>,
  aggregate?: { total: number; average: number }
) {
  const siteUrl = getSiteUrl();
  const avgRating = aggregate?.average ?? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const totalCount = aggregate?.total ?? reviews.length;

  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${siteUrl}/#organization`,
    name: siteConfig.legalName,
    image: `${siteUrl}${siteConfig.logo}`,
    url: siteUrl,
    telephone: siteConfig.phoneE164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.zip,
      addressCountry: siteConfig.address.country,
    },
    priceRange: 'Contingency representation',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: parseFloat(avgRating.toFixed(1)),
      reviewCount: totalCount,
      ratingCount: totalCount,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 10).map((r) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.name,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.text,
    })),
  };
}

/**
 * Results/Case Results schema
 */
export function getResultsPageSchema(results: Array<{ amount: string; type: string; desc: string }>) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Case Results',
    description: 'Notable verdicts and settlements recovered by AZ Law Now for injured clients across Arizona.',
    url: `${siteUrl}/case-results/`,
    numberOfItems: results.length,
    itemListElement: results.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${r.amount} - ${r.type}`,
      description: r.desc,
    })),
  };
}

/**
 * Team listing page schema
 *
 * As of April 2026 the standalone /about/team/ page was consolidated into
 * /about/ (editorial identity model). Each author is rendered as an anchor
 * section on /about/, and the AboutPage schema on that page already emits a
 * Person entity per editor. This helper is kept for backward compatibility —
 * it now points every Person entry at the corresponding /about/#slug anchor
 * so any caller still invoking it stays internally consistent.
 */
export function getTeamPageSchema(attorneys: Array<{ name: string; title: string; slug: string }>) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Our Team',
    description: 'Meet the editors at AZ Law Now.',
    url: `${siteUrl}/about/`,
    numberOfItems: attorneys.length,
    itemListElement: attorneys.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Person',
        '@id': `${siteUrl}/about/#${a.slug}`,
        name: a.name,
        jobTitle: a.title,
        url: `${siteUrl}/about/#${a.slug}`,
        worksFor: {
          '@type': 'LegalService',
          '@id': `${siteUrl}/#organization`,
          name: siteConfig.legalName,
        },
      },
    })),
  };
}

/**
 * LocalBusiness schema for West Valley city pages
 * Location pages use root URLs: /buckeye/, /goodyear/
 */
export function getLocalBusinessSchema(city: string, slug: string) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: `AZ Law Now - ${city} Personal Injury Attorneys`,
    description: `Personal injury attorneys serving ${city}, Arizona. Car accidents, truck accidents, wrongful death. Contingency representation. Confidential intake.`,
    url: `${siteUrl}/${slug}/`,
    telephone: siteConfig.phoneE164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.zip,
      addressCountry: 'US',
    },
    areaServed: [
      {
        '@type': 'City',
        name: `${city}, Arizona`,
      },
      { '@type': 'State', name: 'Arizona' },
    ],
    parentOrganization: {
      '@type': 'LegalService',
      '@id': `${siteUrl}/#organization`,
    },
    priceRange: 'Contingency representation',
  };
}

// ============================================
// CONTENT SCHEMAS
// ============================================

/**
 * Article schema for blog posts and resources
 * Supports both 'Article' and 'NewsArticle' types via schemaType param
 */
export interface ArticleData {
  title: string;
  slug: string;
  description: string;
  image?: string;
  author?: string;
  authorName?: string;
  authorSlug?: string;
  authorTitle?: string;
  authorImage?: string;
  datePublished?: string;
  publishedAt?: string;
  dateModified?: string;
  updatedAt?: string;
  wordCount?: number;
  basePath?: string;
  schemaType?: 'Article' | 'NewsArticle';
}

export function getArticleSchema(article: ArticleData) {
  const siteUrl = getSiteUrl();
  const basePath = article.basePath || '/investigations/';
  const articleUrl = `${siteUrl}${basePath}${article.slug}/`;
  const schemaType = article.schemaType || 'Article';
  // Author pages are consolidated as anchors on /about/ (the team page was
  // merged into the main about page in April 2026). Use the anchor URL so
  // crawlers land on the same Person entity referenced in the AboutPage schema.
  const authorUrl = article.authorSlug
    ? `${siteUrl}/about/#${article.authorSlug}`
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': `${articleUrl}#article`,
    headline: article.title,
    url: articleUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    ...(article.image && {
      image: {
        '@type': 'ImageObject',
        url: article.image.startsWith('http')
          ? article.image
          : `${siteUrl}${article.image}`,
        width: 1200,
        height: 630,
      },
    }),
    description: article.description,
    author: (() => {
      const authorRecord = article.authorSlug ? authors[article.authorSlug] : undefined;
      const sameAs = authorRecord ? getAuthorSameAs(authorRecord) : [];
      return {
        '@type': 'Person',
        ...(authorUrl && { '@id': `${authorUrl}#author` }),
        name: article.authorName || article.author || 'AZ Law Now',
        ...(authorUrl && { url: authorUrl }),
        ...(article.authorImage && {
          image: `${siteUrl}${article.authorImage}`,
        }),
        ...(article.authorTitle && { jobTitle: article.authorTitle }),
        worksFor: {
          '@type': 'LegalService',
          '@id': `${siteUrl}/#organization`,
          name: siteConfig.legalName,
        },
        ...(sameAs.length > 0 && { sameAs }),
      };
    })(),
    publisher: {
      '@type': 'LegalService',
      '@id': `${siteUrl}/#organization`,
      name: siteConfig.legalName,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}${siteConfig.logo}`,
      },
    },
    datePublished: article.publishedAt || article.datePublished,
    dateModified: article.updatedAt || article.dateModified || article.publishedAt || article.datePublished,
    ...(article.wordCount && { wordCount: article.wordCount }),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: [
        '[data-speakable="headline"]',
        '[data-speakable="summary"]',
        '[data-speakable="takeaway"]',
        '[data-speakable="answer"]',
      ],
    },
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    copyrightHolder: {
      '@type': 'LegalService',
      '@id': `${siteUrl}/#organization`,
    },
  };
}

// ============================================
// SERVICE / PRACTICE AREA SCHEMAS
// ============================================

/**
 * Generate service schema for a practice area page
 * Practice area pages use ROOT urls: /car-accidents/, /wrongful-death/
 */
export function generateServiceSchema(practiceArea: string, featuredImage?: string, canonicalUrl?: string) {
  const siteUrl = getSiteUrl();
  const slug = practiceArea.toLowerCase().replace(/\s+/g, '-');
  const pageUrl = canonicalUrl
    ? (canonicalUrl.startsWith('http') ? canonicalUrl : `${siteUrl}${canonicalUrl}`)
    : `${siteUrl}/${slug}/`;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${practiceArea} Attorney`,
    url: pageUrl,
    description: `${practiceArea.toLowerCase()} legal representation across Arizona. Contingency representation. Confidential intake.`,
    provider: {
      '@type': 'LegalService',
      '@id': `${siteUrl}/#organization`,
    },
    areaServed: [
      ...ARIZONA_CITIES.map((city) => ({
        '@type': 'City',
        name: `${city}, Arizona`,
      })),
      { '@type': 'State', name: 'Arizona' },
    ],
  };

  if (featuredImage) {
    schema.image = {
      '@type': 'ImageObject',
      url: featuredImage.startsWith('http')
        ? featuredImage
        : `${siteUrl}${featuredImage}`,
      width: 1200,
      height: 675,
    };
  }

  return schema;
}

// ============================================
// UTILITY SCHEMAS
// ============================================

/**
 * FAQ schema
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Breadcrumb schema
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}
