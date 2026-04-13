/**
 * Site Configuration
 * Single source of truth for firm info, contact, navigation
 */

export const siteConfig = {
  siteName: 'AZ Law Now',
  legalName: 'AZ Law Now Injury Attorneys',
  siteUrl: 'https://azlawnow.com',
  defaultTitle: 'You Get Answers | AZ Law Now. Buckeye, Maricopa, Phoenix.',
  defaultDescription: 'Crash data. Nursing home citations. School safety investigations. Three editors pull the facts, explain the law, and walk you through it. West Valley and Phoenix.',
  tagline: 'You Get Answers.',

  phone: '602-654-0202',
  phoneFormatted: '(602) 654-0202',
  phoneE164: '+16026540202',
  email: 'info@azlawnow.com',

  // Primary office (legacy single-address field for backward compat)
  address: {
    street: '715 E. Monroe Avenue',
    city: 'Buckeye',
    state: 'AZ',
    zip: '85326',
    country: 'US',
  },

  geo: {
    latitude: 33.3702914,
    longitude: -112.5801643,
  },

  googlePlaceId: 'ChIJh-Cdb4E1K4cRtAyu8aMUr1Q',

  // Multi-office structure (use this for Contact page, Footer, LocalBusiness schema)
  offices: [
    {
      id: 'buckeye',
      name: 'Buckeye HQ',
      street: '715 E. Monroe Avenue',
      city: 'Buckeye',
      state: 'AZ',
      zip: '85326',
      country: 'US',
      phone: '602-654-0202',
      phoneFormatted: '(602) 654-0202',
      phoneE164: '+16026540202',
      geo: { latitude: 33.3702914, longitude: -112.5801643 },
      googlePlaceId: 'ChIJh-Cdb4E1K4cRtAyu8aMUr1Q',
      hours: 'Mo-Fr 08:00-18:00',
      isPrimary: true,
    },
    {
      id: 'maricopa',
      name: 'Maricopa Office',
      street: '21300 N. John Wayne Pkwy, Suite 109-B',
      city: 'Maricopa',
      state: 'AZ',
      zip: '85139',
      country: 'US',
      phone: '602-654-0202',
      phoneFormatted: '(602) 654-0202',
      phoneE164: '+16026540202',
      geo: { latitude: 33.0736004, longitude: -112.0445217 },
      hours: 'Mo-Fr 08:00-18:00',
      isPrimary: false,
    },
  ] as const,

  hours: 'Mo-Fr 08:00-18:00',
  logo: '/logos/logo-light-hz.png',

  recoveredAmount: '$3.07 Million',
  taglineNav: 'Your Answers. One Call Away.',

  social: {
    facebook: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    googleBusiness: '',
  },

  // L-system messaging (from copy-and-messaging.md)
  messaging: {
    l1Promise: 'You Get Answers.',
    l2Identity: 'The firm that does the work before the case.',
    l4NavTrust: 'Your Answers. One Call Away.',
    l5PhoneCta: 'Talk to My Team',
    l7FormHeadline: 'You Deserve Answers.',
    l7FormSubhead: 'Tell us what happened. We\'ll tell you what\'s next.',
    l8Primary: 'Get My Free Consultation',
    l8Secondary: 'Talk to My Team',
    l8Tertiary: 'See What\'s Next',
    l8Soft: 'Read',
  },

  mainNavigation: [
    { name: 'Car Accidents', url: '/car-accidents/' },
    { name: 'Truck Accidents', url: '/truck-accidents/' },
    { name: 'Motorcycle Accidents', url: '/motorcycle-accidents/' },
    { name: 'Wrongful Death', url: '/wrongful-death/' },
    { name: 'School Bus Accidents', url: '/bus-accidents/' },
    { name: 'Elder Abuse', url: '/elder-abuse/' },
    { name: 'Nursing Home Abuse', url: '/nursing-home-abuse/' },
    { name: 'Pedestrian Accidents', url: '/pedestrian-accidents/' },
    { name: 'Bicycle Accidents', url: '/bicycle-accidents/' },
    { name: 'Slip and Fall', url: '/slip-and-fall/' },
    { name: 'Medical Negligence', url: '/medical-negligence/' },
    { name: 'Dog Bite', url: '/dog-bite/' },
  ],

  locationPages: [
    { name: 'Buckeye', url: '/buckeye/' },
    { name: 'Maricopa', url: '/maricopa/' },
    { name: 'Goodyear', url: '/goodyear/' },
    { name: 'Avondale', url: '/avondale/' },
    { name: 'Phoenix', url: '/phoenix/' },
    { name: 'Mesa', url: '/mesa/' },
    { name: 'Chandler', url: '/chandler/' },
    { name: 'Tempe', url: '/tempe/' },
    { name: 'Scottsdale', url: '/scottsdale/' },
    { name: 'Casa Grande', url: '/casa-grande/' },
  ],

  companyNav: [
    { name: 'About', url: '/about/' },
    { name: 'Our Team', url: '/about/team/' },
    { name: 'Case Results', url: '/case-results/' },
    { name: 'Reviews', url: '/reviews/' },
    { name: 'Contact', url: '/contact/' },
    { name: 'FAQ', url: '/faq/' },
  ],

  contentNav: [
    { name: 'Insights', url: '/insights/' },
    { name: 'Legal Guides', url: '/legal-guides/' },
    { name: 'Client Guides', url: '/client-guides/' },
  ],
} as const;
