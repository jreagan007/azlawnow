/**
 * Callout — Info/warning/tip/important boxes for MDX content
 * Sunset Editorial light theme
 */

import type { ReactNode } from 'react';

type CalloutType = 'info' | 'warning' | 'tip' | 'important';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const icons: Record<CalloutType, () => React.JSX.Element> = {
  info: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" stroke="#D4943A" strokeWidth="1.5" />
      <path d="M10 9v5" stroke="#D4943A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6.5" r="0.75" fill="#D4943A" />
    </svg>
  ),
  warning: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L1 18h18L10 2z" stroke="#C23B22" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8v4" stroke="#C23B22" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.75" fill="#C23B22" />
    </svg>
  ),
  tip: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 1a7 7 0 014 12.7V16a1 1 0 01-1 1H7a1 1 0 01-1-1v-2.3A7 7 0 0110 1z" stroke="#22C55E" strokeWidth="1.5" />
      <path d="M8 19h4" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  important: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" stroke="#1A1A1A" strokeWidth="1.5" />
      <path d="M10 6v5" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14" r="0.75" fill="#1A1A1A" />
    </svg>
  ),
};

const borderColors: Record<CalloutType, string> = {
  info: '#D4943A',
  warning: '#C23B22',
  tip: '#22C55E',
  important: '#1A1A1A',
};

const bgColors: Record<CalloutType, string> = {
  info: '#FFF8F0',
  warning: '#FFF5F5',
  tip: '#F0FFF4',
  important: '#F5F5F5',
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const Icon = icons[type];

  return (
    <div
      style={{
        borderLeft: `4px solid ${borderColors[type]}`,
        background: bgColors[type],
        padding: '1.5rem',
        margin: '1.5rem 0',
        borderRadius: '0 6px 6px 0',
      }}
    >
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <Icon />
          <strong
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '1rem',
              fontWeight: 700,
              color: '#1A1A1A',
            }}
          >
            {title}
          </strong>
        </div>
      )}
      <div
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.9375rem',
          color: '#4A5859',
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default Callout;
