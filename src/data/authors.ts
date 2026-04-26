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
  bar?: string;         // Arizona State Bar member profile URL (attorneys only)
  justia?: string;
  superLawyers?: string;
  muckRack?: string;    // journalists / editors - strong E-E-A-T for newsroom content
  connectively?: string; // Connectively (Cision's HARO successor) expert profile
  helpAReporter?: string; // Legacy HARO profile if still resolves
  twitter?: string;
  nala?: string;        // NALA Certified Paralegal profile
  naap?: string;        // National Association of Paralegal Associations
  personalSite?: string;
}

/**
 * Role describes the Person's real professional function — used by schema.ts
 * to set jobTitle, knowsAbout, and (for attorneys) hasCredential scaffolding.
 */
export type AuthorRole = 'editor' | 'attorney' | 'paralegal';

export interface Author {
  id: string;
  name: string;
  title: string;        // display title (e.g. "Editor-in-Chief", "Legal Editor")
  role: AuthorRole;     // real-world function — drives schema decisions
  credential?: string;  // honorific suffix: "J.D.", "CP" (Certified Paralegal), etc.
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
    role: 'editor',
    bio: 'Brendan Franks leads editorial operations at AZ Law Now. Not an attorney. He covers Arizona injury data, public safety reporting, and community accountability stories, drawing on years in local media covering municipal government and public records across Maricopa County. His investigations anchor the data journalism voice of the site.',
    photo: '/images/team/brendan-headshot.png',
    schemaType: 'Person',
    url: '/about/#brendan-franks',
    socialLinks: {
      // TODO: LinkedIn - add Brendan's personal profile URL.
      // TODO: Muck Rack - strongest E-E-A-T boost for an investigations editor.
      //   Sign up at muckrack.com, claim the byline, list published insights.
      //   Low-cost, high-signal for journalist Person schema.
      // TODO: Connectively (formerly HARO by Cision) expert profile - lets Brendan
      //   field journalist queries on AZ crash data, nursing home abuse, school
      //   restraint reporting. Every fielded query that converts to a citation
      //   = a fresh authoritative backlink pointing at him + AZ Law Now.
      // TODO: X/Twitter - if Brendan has a bylined handle.
      // TODO: Personal site / bylined archive if maintained.
    },
  },
  'brandon-millam': {
    id: 'brandon-millam',
    name: 'Brandon Millam, J.D.',
    title: 'Legal Editor',
    role: 'attorney',
    credential: 'J.D.',
    bio: 'Brandon Millam is the managing attorney at AZ Law Now and serves as legal editor across every legal guide and resource on the site. He reviews all legal content for accuracy before publication. Brandon practices personal injury law across Arizona, focusing on motor vehicle crashes, school bus negligence, elder abuse, and medical malpractice.',
    photo: '/images/team/brandon-headshot.png',
    schemaType: 'Person',
    hasCredential: true,
    url: '/about/#brandon-millam',
    socialLinks: {
      // TODO: Arizona State Bar profile — add Brandon's AZ Bar # + azbar.org
      //   member-directory URL. The Avvo/Bar hit for "Brandon D. Millam #034696"
      //   is a different attorney at Doyle Hernandez Millam (insurance defense).
      //   This is mandatory for attorney Person schema E-E-A-T.
      // TODO: Avvo profile (attorney directory).
      // TODO: Justia profile.
      // TODO: Super Lawyers profile if listed.
      // TODO: LinkedIn.
    },
  },
  'stephanie-ramirez': {
    id: 'stephanie-ramirez',
    name: 'Stephanie Ramirez',
    title: 'Client Resources Editor & Paralegal',
    role: 'paralegal',
    credential: 'Paralegal',
    bio: 'Stephanie Ramirez is a paralegal at AZ Law Now, responsible for client-facing resources and case support. She writes the guides that walk families through the process after an injury: what to expect, what paperwork matters, how timelines work, and when to ask questions. Stephanie grew up in Arizona and understands that most families going through this are doing it for the first time.',
    photo: '/images/team/stephanie-headshot.png',
    schemaType: 'Person',
    url: '/about/#stephanie-ramirez',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/in/stephanie-ramirez-45b748405/',
      // TODO: NALA Certified Paralegal credential (if held), adds E-E-A-T
      //   for paralegal authored content.
      // TODO: NAAP profile if applicable.
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
