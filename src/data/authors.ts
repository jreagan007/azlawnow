/**
 * Editorial Team — Three authors, three voices
 *
 * sameAs URLs feed the Person schema on every article and /about/.
 *
 * External profile research (2026-04-14, Perplexity sonar-pro):
 *   - Brandon Millam: Avvo hit for "Brandon D. Millam, Bar #034696" was
 *     confirmed to be a DIFFERENT attorney at Doyle Hernandez Millam
 *     (civil litigation / insurance defense in Phoenix). Not our Brandon.
 *     AZ State Bar profile NOT FOUND for AZ Law Now's Brandon Millam.
 *   - Brendan Franks: LinkedIn / Muck Rack / X profiles NOT FOUND.
 *   - Stephanie Ramirez: LinkedIn profile NOT FOUND.
 *
 * Schema still emits Person — these are real humans. When a profile URL
 * can be verified, drop it into the socialLinks object and the
 * getAuthorSchema helper will fold it into sameAs automatically.
 */

export interface AuthorSocialLinks {
  linkedin?: string;
  avvo?: string;
  bar?: string;
  justia?: string;
  superLawyers?: string;
  muckRack?: string;
  twitter?: string;
}

export interface Author {
  id: string;
  name: string;
  title: string;
  credential?: string;
  bio: string;
  photo: string;
  schemaType: 'Person';
  hasCredential?: boolean;
  url: string;
  socialLinks?: AuthorSocialLinks;
}

export const authors: Record<string, Author> = {
  'brendan-franks': {
    id: 'brendan-franks',
    name: 'Brendan Franks',
    title: 'Editor-in-Chief',
    bio: 'Brendan Franks leads editorial operations at AZ Law Now. He covers West Valley injury data, public safety reporting, and community accountability stories. Before joining the firm, Brendan spent years in local media covering municipal government and public records across Maricopa County.',
    photo: '/images/team/brendan-headshot.png',
    schemaType: 'Person',
    url: '/about/#brendan-franks',
    socialLinks: {
      // TODO: LinkedIn — Perplexity returned NOT FOUND on 2026-04-14.
      // TODO: Muck Rack — Perplexity returned NOT FOUND on 2026-04-14.
      // TODO: X/Twitter — Perplexity returned NOT FOUND on 2026-04-14.
    },
  },
  'brandon-millam': {
    id: 'brandon-millam',
    name: 'Brandon Millam, J.D.',
    title: 'Legal Editor',
    credential: 'J.D.',
    bio: 'Brandon Millam is the managing attorney at AZ Law Now and serves as legal editor across all published content. He reviews every legal guide and resource for accuracy before publication. Brandon practices personal injury law in Buckeye and Goodyear, focusing on motor vehicle crashes, school bus negligence, elder abuse, and medical malpractice cases across the West Valley.',
    photo: '/images/team/brandon-headshot.png',
    schemaType: 'Person',
    hasCredential: true,
    url: '/about/#brandon-millam',
    socialLinks: {
      // TODO: Arizona State Bar profile — Perplexity could not verify a
      // member number for AZ Law Now's Brandon Millam on 2026-04-14. The
      // Avvo/Bar hit for "Brandon D. Millam #034696" is a different
      // attorney at Doyle Hernandez Millam (insurance defense, Phoenix).
      // Jared: pull Brandon's AZ Bar # directly and add azbar.org URL.
      // TODO: Avvo — NOT FOUND for this Brandon Millam.
      // TODO: Justia — NOT FOUND.
      // TODO: Super Lawyers — NOT FOUND.
      // TODO: LinkedIn — NOT FOUND.
    },
  },
  'stephanie-ramirez': {
    id: 'stephanie-ramirez',
    name: 'Stephanie Ramirez',
    title: 'Senior Editor, Client Resources',
    bio: 'Stephanie Ramirez manages client-facing resources at AZ Law Now. She writes the guides that walk families through the process after an injury: what to expect, what paperwork matters, how timelines work, and when to ask questions. Stephanie grew up in the West Valley and understands that most families going through this are doing it for the first time.',
    photo: '/images/team/stephanie-headshot.png',
    schemaType: 'Person',
    url: '/about/#stephanie-ramirez',
    socialLinks: {
      // TODO: LinkedIn — Perplexity returned NOT FOUND on 2026-04-14.
    },
  },
};

/** Resolve author from content category */
export function getAuthorForCategory(category: string): Author {
  switch (category) {
    case 'investigation':
    case 'resources':
    case 'data':
      return authors['brendan-franks'];
    case 'legal-guide':
    case 'legal':
    case 'practice-area':
      return authors['brandon-millam'];
    case 'client-guide':
    case 'process':
    case 'checklist':
      return authors['stephanie-ramirez'];
    default:
      return authors['brendan-franks'];
  }
}

/**
 * Flatten an author's socialLinks object into a sameAs array for
 * Person schema output. Filters out undefined/empty values so the
 * schema stays valid when profiles haven't been verified yet.
 */
export function getAuthorSameAs(author: Author): string[] {
  if (!author.socialLinks) return [];
  return Object.values(author.socialLinks).filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );
}
