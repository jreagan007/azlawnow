/**
 * Sources — References section wrapper
 * Sunset Editorial light theme
 * React version for MDX compatibility
 */

import type { ReactNode } from 'react';

interface SourcesProps {
  children: ReactNode;
}

export function Sources({ children }: SourcesProps) {
  return (
    <div className="mdx-sources">
      <div className="mdx-sources-heading">References</div>
      <ol className="mdx-sources-list">
        {children}
      </ol>
    </div>
  );
}

interface SourceProps {
  title: string;
  org?: string;
  url?: string;
  date?: string;
  accessed?: string;
}

export function Source({ title, org, url, date, accessed }: SourceProps) {
  const isInternal = url?.includes('azlawnow.com');
  const showUrl = url && !isInternal;

  return (
    <li className="mdx-source-item">
      {org && <span className="mdx-source-org">{org}. </span>}
      {date && <span className="mdx-source-date">({date}). </span>}
      <span className="mdx-source-title">
        {showUrl ? (
          <a href={url} target="_blank" rel="noopener noreferrer">{title}</a>
        ) : (
          title
        )}
      </span>
      {accessed && <span className="mdx-source-accessed">. Accessed {accessed}</span>}
      <span>.</span>
    </li>
  );
}
