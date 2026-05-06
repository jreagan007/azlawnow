/**
 * AZ Law Now editorial chart tokens.
 *
 * Single source of truth for all chart visuals. Pulls from src/styles/theme.ts
 * Sunset Editorial palette. NEVER invent new colors here.
 */

export const TOKENS = {
  // From src/styles/theme.ts brand
  cream: '#FAF5ED',          // brand.bg (Newsprint) — page + chart bg
  ink: '#1A1A1A',             // brand.black (Headline Black)
  inkSoft: '#2D2D2D',         // neutral.800
  slate: '#4A5859',           // brand.slate (Dusk Slate)
  slateLight: '#8C8474',      // neutral.500
  slateLighter: '#B0A696',    // neutral.400
  vermillion: '#C23B22',      // brand.red (Alert Vermillion) — bomb-stat highlight
  gold: '#D4943A',            // brand.gold (Golden Hour) — secondary highlight
  sienna: '#8B4513',          // brand.sienna (Burnt Sienna) — third-tier
  hairline: '#D4C9B8',        // neutral.300
  hairlineSoft: '#E8DFD0',    // neutral.200
};

// Categorical palette: up to 5 distinguishable in-brand series
export const CATEGORICAL = [
  TOKENS.ink,
  TOKENS.gold,
  TOKENS.slate,
  TOKENS.sienna,
  TOKENS.slateLight,
];

// Sequential: light to dark (counts, density)
export const SEQUENTIAL = [
  TOKENS.hairlineSoft,
  TOKENS.slateLighter,
  TOKENS.slate,
  TOKENS.ink,
];

// Diverging: positive ↔ neutral ↔ negative
export const DIVERGING = {
  positive: TOKENS.gold,
  neutral: TOKENS.hairline,
  negative: TOKENS.vermillion,
};

// Type system
export const FONTS = {
  serif: "Georgia, 'Times New Roman', serif",   // Cormorant fallback chain
  sans: "Inter, Helvetica, Arial, sans-serif",   // DM Sans fallback chain
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",  // JetBrains Mono fallback
};

export const SIZES = {
  // Large stat / hero numerals
  numeralXL: 96,
  numeralL: 56,
  numeralM: 32,
  // Headlines
  h1: 38,
  h2: 32,
  h3: 24,
  // Body
  bodyL: 18,
  bodyM: 15,
  bodyS: 13,
  // Smallest
  caption: 12,
  micro: 11,
};

export const PATHS = {
  logoDarkHz: '/Users/taqticlaw/Projects/azlawnow/public/logos/logo-dark-hz.png',
  logoDark: '/Users/taqticlaw/Projects/azlawnow/public/logos/logo-dark.png',
  logoLightHz: '/Users/taqticlaw/Projects/azlawnow/public/logos/logo-light-hz.png',
  logoLight: '/Users/taqticlaw/Projects/azlawnow/public/logos/logo-light.png',
};
