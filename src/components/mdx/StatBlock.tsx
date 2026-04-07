/**
 * StatBlock — Standalone stat highlight for inline MDX use
 * Sunset Editorial light theme
 */

type Trend = 'up' | 'down' | 'stable';

interface StatBlockProps {
  stat: string;
  label: string;
  source?: string;
  sourceUrl?: string;
  trend?: Trend;
}

const trendArrows: Record<Trend, { symbol: string; color: string }> = {
  up: { symbol: '\u2191', color: '#22C55E' },
  down: { symbol: '\u2193', color: '#C23B22' },
  stable: { symbol: '\u2192', color: '#8C8474' },
};

export function StatBlock({ stat, label, source, sourceUrl, trend }: StatBlockProps) {
  const trendData = trend ? trendArrows[trend] : null;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8DFD0',
        borderRadius: '6px',
        padding: '1.5rem',
        margin: '1.5rem 0',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#D4943A',
            lineHeight: 1,
          }}
        >
          {stat}
        </span>
        {trendData && (
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: trendData.color,
              lineHeight: 1,
            }}
          >
            {trendData.symbol}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.875rem',
          color: '#4A5859',
          marginTop: '0.5rem',
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
      {source && (
        <div
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '0.6875rem',
            color: '#8C8474',
            marginTop: '0.5rem',
          }}
        >
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#D4943A', textDecoration: 'none' }}
            >
              {source}
            </a>
          ) : (
            source
          )}
        </div>
      )}
    </div>
  );
}

export default StatBlock;
