/**
 * Sunset Editorial Design Tokens
 * AZ Law Now — LOCKED palette
 */

export const colors = {
  brand: {
    black: '#1A1A1A',      // Headline Black — headlines, nav, dark BG
    gold: '#D4943A',       // Golden Hour — primary accent, CTAs, buttons
    goldHover: '#C2842E',  // Golden Hour hover
    bg: '#FAF5ED',         // Newsprint — page background, cards
    sienna: '#8B4513',     // Burnt Sienna — secondary warm accent
    red: '#C23B22',        // Alert Vermillion — urgent, hover, accent bars, logo underline
    redHover: '#A83220',   // Alert Vermillion hover
    slate: '#4A5859',      // Dusk Slate — body text, secondary text
  },
  neutral: {
    50: '#FAF5ED',
    100: '#F5EDE0',
    200: '#E8DFD0',
    300: '#D4C9B8',
    400: '#B0A696',
    500: '#8C8474',
    600: '#6B6458',
    700: '#4A5859',
    800: '#2D2D2D',
    900: '#1A1A1A',
  },
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

export const typography = {
  heading: '"Cormorant Garamond", Georgia, serif',
  body: '"DM Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;

export const spacing = {
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;
