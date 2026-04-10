/**
 * Content Graph Utilities for AEE Law
 * Handles internal linking, related content, and content relationships
 * IMPORTANT: Excludes references, citations, and footnotes from auto-linking
 */

import internalLinks from '../data/internal-links.json';

interface LinkableTerms {
  terms: Record<string, string>;
  pillars: Record<string, { url: string; children: string[] }>;
  excludeSelectors: string[];
  settings: {
    maxLinksPerTerm: number;
    linkFirstOccurrence: boolean;
    caseSensitive: boolean;
    excludeHeadings: boolean;
    excludeAnchors: boolean;
    excludeTables: boolean;
    minDistanceBetweenLinks: number;
  };
}

const linkData = internalLinks as LinkableTerms;

/**
 * Get the canonical URL for a term (case-insensitive)
 */
export function getTermUrl(term: string): string | null {
  const normalized = term.toLowerCase().trim();
  const terms = linkData.terms;

  // Direct match
  if (terms[normalized]) {
    return terms[normalized];
  }

  // Try with common variations
  const variations = [
    normalized,
    normalized.replace(/-/g, ' '),
    normalized.replace(/ /g, '-'),
    normalized.replace(/'/g, "'"), // Smart quotes
  ];

  for (const variant of variations) {
    if (terms[variant]) {
      return terms[variant];
    }
  }

  return null;
}

/**
 * Get all linkable terms sorted by length (longest first for proper matching)
 * This ensures "construction accident" matches before "accident"
 */
export function getLinkableTerms(): Array<{ term: string; url: string }> {
  return Object.entries(linkData.terms)
    .map(([term, url]) => ({ term, url }))
    .sort((a, b) => b.term.length - a.term.length);
}

/**
 * Get exclude selectors for auto-linking
 * These CSS selectors identify content that should NOT have auto-links applied
 */
export function getExcludeSelectors(): string[] {
  return linkData.excludeSelectors;
}

/**
 * Get linking settings
 */
export function getLinkingSettings() {
  return linkData.settings;
}

/**
 * Check if a text node should be excluded from auto-linking
 * based on parent element selectors
 */
export function shouldExcludeFromLinking(element: Element | null): boolean {
  if (!element) return false;

  const selectors = getExcludeSelectors();

  // Walk up the DOM tree to check for exclusion selectors
  let current: Element | null = element;
  while (current) {
    for (const selector of selectors) {
      try {
        if (current.matches(selector)) {
          return true;
        }
      } catch {
        // Invalid selector, skip
      }
    }
    current = current.parentElement;
  }

  return false;
}

/**
 * Auto-link text content with internal links
 * Respects exclusion rules for references and citations
 *
 * @param html - HTML content to process
 * @param currentPath - Current page path (to avoid self-linking)
 * @returns Processed HTML with links
 */
export function autoLinkContent(html: string, currentPath: string, maxLinks: number = 15): string {
  const terms = getLinkableTerms();
  const settings = getLinkingSettings();
  const linkedTerms = new Set<string>();
  const linkedUrls = new Set<string>();
  let linkCount = 0;

  // Normalize current path for comparison
  const normalizedCurrentPath = currentPath.replace(/^\/+|\/+$/g, '');

  // Process each term
  let result = html;

  for (const { term, url } of terms) {
    // Stop if we've hit the max links cap
    if (linkCount >= maxLinks) break;

    // Skip if this URL is the current page
    const normalizedUrl = url.replace(/^\/+|\/+$/g, '');
    if (normalizedUrl === normalizedCurrentPath) {
      continue;
    }

    // Skip if we've already linked this term (first occurrence only)
    if (settings.linkFirstOccurrence && linkedTerms.has(term.toLowerCase())) {
      continue;
    }

    // Skip if this URL has already been linked (prevent duplicate destinations)
    if (linkedUrls.has(url)) {
      continue;
    }

    // Create regex for the term (word boundaries, case insensitive)
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `(?<!<[^>]*)\\b(${escapedTerm})\\b(?![^<]*>)`,
      settings.caseSensitive ? 'g' : 'gi'
    );

    // Track if we made a replacement
    let replaced = false;

    result = result.replace(regex, (match, captured, offset) => {
      // Enforce max links cap within replace callback too
      if (linkCount >= maxLinks) return match;

      // Check if this match is inside an excluded section
      // Look backwards for exclusion markers
      const before = result.substring(Math.max(0, offset - 500), offset);

      // Check for open exclusion tags without closing
      const excludePatterns = [
        /<div[^>]*class="[^"]*references[^"]*"[^>]*>(?![\s\S]*<\/div>)/i,
        /<div[^>]*class="[^"]*citations[^"]*"[^>]*>(?![\s\S]*<\/div>)/i,
        /<div[^>]*class="[^"]*footnotes[^"]*"[^>]*>(?![\s\S]*<\/div>)/i,
        /<blockquote[^>]*class="[^"]*citation[^"]*"[^>]*>(?![\s\S]*<\/blockquote>)/i,
        /<[^>]*data-no-autolink[^>]*>(?![\s\S]*<\/)/i,
      ];

      for (const pattern of excludePatterns) {
        if (pattern.test(before)) {
          return match; // Don't link, we're inside excluded content
        }
      }

      // Skip if already inside an anchor tag
      if (/<a[^>]*>[^<]*$/.test(before) && !/<\/a>[^<]*$/.test(before)) {
        return match;
      }

      // Skip if inside heading (if configured)
      if (settings.excludeHeadings) {
        if (/<h[1-6][^>]*>[^<]*$/.test(before) && !/<\/h[1-6]>[^<]*$/.test(before)) {
          return match;
        }
      }

      // Skip if inside a table element
      if (/<(?:table|thead|tbody|tr|th|td)[^>]*>[^<]*$/.test(before) &&
          !/<\/(?:table|thead|tbody|tr|th|td)>[^<]*$/.test(before)) {
        return match;
      }

      // Only link first occurrence
      if (settings.linkFirstOccurrence && replaced) {
        return match;
      }

      replaced = true;
      linkedTerms.add(term.toLowerCase());
      linkedUrls.add(url);
      linkCount++;

      return `<a href="${url}" class="internal-link">${captured}</a>`;
    });
  }

  return result;
}

/**
 * Get pillar information for a URL
 */
export function getPillarForUrl(url: string): string | null {
  const normalizedUrl = url.replace(/^\/+|\/+$/g, '');

  for (const [pillarName, pillar] of Object.entries(linkData.pillars)) {
    const pillarPath = pillar.url.replace(/^\/+|\/+$/g, '');
    if (normalizedUrl.startsWith(pillarPath) || pillar.children.some(
      child => child.replace(/^\/+|\/+$/g, '') === normalizedUrl
    )) {
      return pillarName;
    }
  }

  return null;
}

/**
 * Get sibling pages (same pillar)
 */
export function getSiblingPages(url: string): string[] {
  const normalizedUrl = `/${url.replace(/^\/+|\/+$/g, '')}/`;

  for (const pillar of Object.values(linkData.pillars)) {
    if (pillar.children.includes(normalizedUrl)) {
      return pillar.children.filter(child => child !== normalizedUrl);
    }
  }

  return [];
}

/**
 * Get related pages based on pillar membership
 */
export function getRelatedPages(url: string, limit = 3): string[] {
  const siblings = getSiblingPages(url);
  return siblings.slice(0, limit);
}

/**
 * Build breadcrumb trail for a path
 */
export function getBreadcrumbs(path: string): Array<{ label: string; url: string }> {
  const parts = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; url: string }> = [
    { label: 'Home', url: '/' }
  ];

  let currentPath = '';
  for (const part of parts) {
    currentPath += `/${part}`;
    breadcrumbs.push({
      label: formatPathAsTitle(part),
      url: `${currentPath}/`
    });
  }

  return breadcrumbs;
}

/**
 * Format a URL path segment as a readable title
 */
function formatPathAsTitle(segment: string): string {
  // AZ-specific mappings
  const specialCases: Record<string, string> = {
    'car-accidents': 'Car Accidents',
    'truck-accidents': 'Truck Accidents',
    'motorcycle-accidents': 'Motorcycle Accidents',
    'pedestrian-accidents': 'Pedestrian Accidents',
    'bicycle-accidents': 'Bicycle Accidents',
    'rideshare-accidents': 'Rideshare Accidents',
    'bus-accidents': 'Bus Accidents',
    'wrongful-death': 'Wrongful Death',
    'slip-and-fall': 'Slip and Fall',
    'dog-bite': 'Dog Bite',
    'premises-liability': 'Premises Liability',
    'elder-abuse': 'Elder Abuse',
    'nursing-home-abuse': 'Nursing Home Abuse',
    'child-abuse': 'Child Abuse',
    'school-abuse': 'School Abuse',
    'daycare-negligence': 'Daycare Negligence',
    'medical-negligence': 'Medical Negligence',
    'vehicle-crashes': 'Vehicle Crashes',
    'abuse-negligence': 'Abuse & Negligence',
    'other-claims': 'Other Claims',
    'free-case-review': 'Free Case Review',
    'legal-guides': 'Legal Guides',
    'client-guides': 'Client Guides',
    'case-results': 'Case Results',
  };

  if (specialCases[segment]) {
    return specialCases[segment];
  }

  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get contextual navigation for sidebar
 */
export function getContextualNav(currentPath: string): {
  pillarName: string | null;
  parentPage: { label: string; url: string } | null;
  siblingPages: Array<{ label: string; url: string }>;
} {
  const pillarName = getPillarForUrl(currentPath);
  const siblings = getSiblingPages(currentPath);

  let parentPage = null;
  if (pillarName && linkData.pillars[pillarName]) {
    parentPage = {
      label: formatPathAsTitle(pillarName),
      url: linkData.pillars[pillarName].url
    };
  }

  return {
    pillarName,
    parentPage,
    siblingPages: siblings.map(url => ({
      label: formatPathAsTitle(url.replace(/^\/|\/$/g, '').split('/').pop() || ''),
      url
    }))
  };
}

/**
 * Get all practice area URLs
 */
export function getPracticeAreaUrls(): string[] {
  return linkData.pillars['practice-areas']?.children || [];
}

/**
 * Get all borough URLs
 */
export function getBoroughUrls(): string[] {
  return linkData.pillars['boroughs']?.children || [];
}

/**
 * Generate internal link suggestions for content
 * Returns terms found in content that could be linked
 */
export function suggestInternalLinks(
  content: string,
  currentPath: string
): Array<{ term: string; url: string; count: number }> {
  const terms = getLinkableTerms();
  const suggestions: Array<{ term: string; url: string; count: number }> = [];
  const normalizedCurrentPath = currentPath.replace(/^\/+|\/+$/g, '');

  for (const { term, url } of terms) {
    const normalizedUrl = url.replace(/^\/+|\/+$/g, '');
    if (normalizedUrl === normalizedCurrentPath) continue;

    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = content.match(regex);

    if (matches && matches.length > 0) {
      suggestions.push({ term, url, count: matches.length });
    }
  }

  return suggestions.sort((a, b) => b.count - a.count);
}
