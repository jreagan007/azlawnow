/**
 * Site Configuration
 * Single source of truth for firm info, contact, navigation
 */

export const siteConfig = {
  siteName: 'AZ Law Now',
  legalName: 'AZ Law Now Injury Attorneys',
  siteUrl: 'https://azlawnow.com',
  defaultTitle: 'You Get Answers | AZ Law Now Injury Attorneys',
  defaultDescription: 'Three people work your case. An investigator pulls the facts. An attorney knows Arizona law. A guide walks you through every step. West Valley offices in Buckeye and Maricopa.',
  tagline: 'You Get Answers.',

  phone: '602-654-0202',
  phoneFormatted: '(602) 654-0202',
  phoneE164: '+16026540202',
  email: 'info@azlawnow.com',

  address: {
    street: '530 E. McDowell Rd., Suite 107-160',
    city: 'Buckeye',
    state: 'AZ',
    zip: '85326',
    country: 'US',
  },

  geo: {
    latitude: 33.4373,
    longitude: -112.5838,
  },

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
    { name: 'Car Accidents', url: '/vehicle-crashes/car-accidents/' },
    { name: 'Truck Accidents', url: '/vehicle-crashes/truck-accidents/' },
    { name: 'Motorcycle Accidents', url: '/vehicle-crashes/motorcycle-accidents/' },
    { name: 'Wrongful Death', url: '/other-claims/wrongful-death/' },
    { name: 'School Bus Accidents', url: '/vehicle-crashes/bus-accidents/' },
    { name: 'Elder Abuse', url: '/abuse-negligence/elder-abuse/' },
    { name: 'Nursing Home Abuse', url: '/abuse-negligence/nursing-home-abuse/' },
    { name: 'Pedestrian Accidents', url: '/vehicle-crashes/pedestrian-accidents/' },
    { name: 'Bicycle Accidents', url: '/vehicle-crashes/bicycle-accidents/' },
    { name: 'Slip and Fall', url: '/other-claims/slip-and-fall/' },
    { name: 'Medical Negligence', url: '/abuse-negligence/medical-negligence/' },
    { name: 'Dog Bite', url: '/other-claims/dog-bite/' },
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
    { name: 'Resources', url: '/resources/' },
    { name: 'Legal Guides', url: '/legal-guides/' },
    { name: 'Client Guides', url: '/client-guides/' },
    { name: 'Blog', url: '/blog/' },
  ],
} as const;
