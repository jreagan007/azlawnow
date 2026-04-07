/**
 * Editorial Team — Three authors, three voices
 */

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
}

export const authors: Record<string, Author> = {
  'brendan-franks': {
    id: 'brendan-franks',
    name: 'Brendan Franks',
    title: 'Editor-in-Chief',
    bio: 'Brendan Franks leads editorial operations at AZ Law Now. He covers West Valley injury data, public safety reporting, and community accountability stories. Before joining the firm, Brendan spent years in local media covering municipal government and public records across Maricopa County.',
    photo: '/images/team/brendan-headshot.png',
    schemaType: 'Person',
    url: '/about/team/brendan-franks/',
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
    url: '/about/team/brandon-millam/',
  },
  'stephanie-ramirez': {
    id: 'stephanie-ramirez',
    name: 'Stephanie Ramirez',
    title: 'Senior Editor, Client Resources',
    bio: 'Stephanie Ramirez manages client-facing resources at AZ Law Now. She writes the guides that walk families through the process after an injury: what to expect, what paperwork matters, how timelines work, and when to ask questions. Stephanie grew up in the West Valley and understands that most families going through this are doing it for the first time.',
    photo: '/images/team/stephanie-headshot.png',
    schemaType: 'Person',
    url: '/about/team/stephanie-ramirez/',
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
