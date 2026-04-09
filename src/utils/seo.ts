/**
 * SEO Configuration for AZ Law Now
 * Arizona Personal Injury Attorneys — West Valley
 */

import { siteConfig } from '../data/site-config';

// Re-export siteConfig for convenience
export { siteConfig };

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article' | 'profile';
    locale?: string;
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    site?: string;
    creator?: string;
  };
}

/**
 * Generate page title with site name
 * Appends " | AZ Law Now" unless the title already contains branding
 */
export function generateTitle(pageTitle?: string): string {
  if (!pageTitle) return siteConfig.defaultTitle;

  const hasBranding =
    pageTitle.includes('AZ Law Now') ||
    pageTitle.includes('AZ Law Now Injury Attorneys');
  if (hasBranding) return pageTitle;

  return `${pageTitle} | AZ Law Now`;
}

/**
 * Generate canonical URL from a path
 */
export function generateCanonical(path: string): string {
  const siteUrl = (import.meta.env.SITE || siteConfig.siteUrl).replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${cleanPath}`;
}

/**
 * Generate meta tags object for pages
 */
export function generateMetaTags(props: {
  title?: string;
  description?: string;
  canonical?: string;
}): { title: string; description: string; canonical: string } {
  return {
    title: props.title || siteConfig.defaultTitle,
    description: props.description || siteConfig.defaultDescription,
    canonical: props.canonical || '/',
  };
}

/**
 * Generate OG image URL based on page path
 * Images stored in /og/ with slug as filename
 */
export function generateOGImageUrl(path: string): string {
  const siteUrl = (import.meta.env.SITE || siteConfig.siteUrl).replace(/\/$/, '');
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const slug = cleanPath ? cleanPath.replace(/\//g, '-') : 'index';
  return `${siteUrl}/og/${slug}.webp`;
}
