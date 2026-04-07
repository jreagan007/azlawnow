/**
 * FAQ — Collapsible Q&A component for MDX content
 * Uses <details>/<summary> for no-JS compatibility
 * Sunset Editorial light theme
 */

import type { ReactNode } from 'react';

interface FAQProps {
  children: ReactNode;
}

interface QuestionProps {
  q: string;
  children: ReactNode;
}

export function FAQ({ children }: FAQProps) {
  return (
    <div
      style={{
        margin: '1.5rem 0',
      }}
    >
      {children}
    </div>
  );
}

export function Question({ q, children }: QuestionProps) {
  return (
    <details
      style={{
        borderBottom: '1px solid #E8DFD0',
      }}
    >
      <summary
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 0',
          cursor: 'pointer',
          listStyle: 'none',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '1rem',
          fontWeight: 600,
          color: '#1A1A1A',
          lineHeight: 1.4,
        }}
      >
        <span style={{ flex: 1, paddingRight: '1rem' }}>{q}</span>
        <svg
          className="faq-arrow"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            color: '#D4943A',
          }}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div
        style={{
          padding: '0 0 1rem 0',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.9375rem',
          color: '#4A5859',
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
      <style>{`
        details summary::-webkit-details-marker { display: none; }
        details[open] .faq-arrow { transform: rotate(180deg); }
      `}</style>
    </details>
  );
}

export default FAQ;
