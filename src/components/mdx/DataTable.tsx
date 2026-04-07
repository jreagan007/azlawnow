/**
 * DataTable — Styled data table for MDX content
 * Sunset Editorial light theme
 */

interface DataTableProps {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export function DataTable({ headers, rows, caption }: DataTableProps) {
  return (
    <div
      style={{
        margin: '1.5rem 0',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '0.875rem',
          border: '1px solid #E8DFD0',
          borderRadius: '6px',
          overflow: 'hidden',
        }}
      >
        {caption && (
          <caption
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: '0.75rem',
              color: '#8C8474',
              textAlign: 'left',
              padding: '0.5rem 0',
              captionSide: 'bottom',
            }}
          >
            {caption}
          </caption>
        )}
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                style={{
                  background: '#1A1A1A',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8125rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #E8DFD0',
                    color: '#4A5859',
                    background: rowIndex % 2 === 1 ? '#FAF5ED' : '#FFFFFF',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
