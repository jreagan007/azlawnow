/**
 * KeyFacts — Summary box at top of articles
 * Sunset Editorial light theme
 */

import type { ReactNode } from 'react';

type Variant = 'default' | 'warning' | 'success';

interface KeyFactsProps {
  children: ReactNode;
}

interface FactProps {
  children: ReactNode;
  variant?: Variant;
}

const checkColors: Record<Variant, string> = {
  default: '#D4943A',
  warning: '#C23B22',
  success: '#22C55E',
};

export function KeyFacts({ children }: KeyFactsProps) {
  return (
    <div
      className="key-facts no-autolink"
      style={{
        background: '#FFFFFF',
        borderTop: '3px solid #D4943A',
        borderRadius: '0 0 6px 6px',
        padding: '1.5rem',
        margin: '1.5rem 0',
        boxShadow: '0 2px 8px rgba(26, 26, 26, 0.06)',
      }}
    >
      <div
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#D4943A',
          marginBottom: '1rem',
        }}
      >
        Key Facts
      </div>
      <div>{children}</div>
    </div>
  );
}

export function Fact({ children, variant = 'default' }: FactProps) {
  const checkColor = checkColors[variant];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.5rem 0',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, marginTop: '2px' }}
      >
        <path
          d="M4 9l3.5 3.5L14 5"
          stroke={checkColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.9375rem',
          color: '#4A5859',
          lineHeight: 1.6,
        }}
      >
        {children}
      </span>
    </div>
  );
}

export default KeyFacts;
