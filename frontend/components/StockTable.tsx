export default function StockTable({ rows, onAnalyze, onRemove }: Props) {
  return (
    <div className="card" style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Holdings</h2>
          <p style={subtitleStyle}>{rows.length} positions</p>
        </div>
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Symbol</th>
              <th style={thStyle}>Name</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Shares</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Value</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>1 Day $</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>1 Day %</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const val = r.shares * r.price
              const dayChange = -26.00
              const dayPct = -1.24
              return (
                <tr key={r.ticker} style={trStyle}>
                  <td style={tdSymbolStyle}>{r.ticker}</td>
                  <td style={tdNameStyle}>{r.name}</td>
                  <td style={tdNumberStyle}>{r.shares}</td>
                  <td style={tdNumberStyle}>${r.price.toFixed(2)}</td>
                  <td style={tdNumberStyle}>${val.toFixed(2)}</td>
                  <td style={{ ...tdNumberStyle, color: dayChange < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {dayChange.toFixed(2)}
                  </td>
                  <td style={{ ...tdNumberStyle, color: dayPct < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {dayPct.toFixed(2)}%
                  </td>
                  <td style={tdActionsStyle}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button
                        className="analyze-btn"
                        aria-label={`analyze-${r.ticker}`}
                        title="Analyze"
                        onClick={() => onAnalyze(r.ticker)}
                        style={iconBtnStyle}
                        dangerouslySetInnerHTML={{ __html: wandSvg }}
                      />
                      <button
                        aria-label={`delete-${r.ticker}`}
                        title="Remove"
                        onClick={() => onRemove(r.ticker)}
                        style={deleteBtnStyle}
                        dangerouslySetInnerHTML={{ __html: deleteSvg }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: 0,
  overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  padding: '24px 28px',
  borderBottom: '1px solid rgba(248, 250, 252, 0.08)',
  background: 'rgba(30, 41, 59, 0.3)',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
  color: '#f8fafc',
  letterSpacing: '-0.01em',
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  marginTop: 4,
  fontSize: 13,
  color: '#64748b',
  fontWeight: 500,
}

const tableWrapperStyle: React.CSSProperties = {
  overflowX: 'auto',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const thStyle: React.CSSProperties = {
  padding: '16px 20px',
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
  borderBottom: '1px solid rgba(248, 250, 252, 0.08)',
}

const trStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(248, 250, 252, 0.05)',
  transition: 'background-color 0.15s ease',
}

const tdSymbolStyle: React.CSSProperties = {
  padding: '18px 20px',
  fontSize: 14,
  fontWeight: 700,
  color: '#f8fafc',
  fontFamily: 'ui-monospace, monospace',
}

const tdNameStyle: React.CSSProperties = {
  padding: '18px 20px',
  fontSize: 14,
  color: '#cbd5e1',
  fontWeight: 500,
}

const tdNumberStyle: React.CSSProperties = {
  padding: '18px 20px',
  fontSize: 14,
  color: '#e2e8f0',
  textAlign: 'right',
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
}

const tdActionsStyle: React.CSSProperties = {
  padding: '18px 20px',
  textAlign: 'right',
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  padding: '8px 10px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
}

const deleteBtnStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  padding: '8px 10px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
}

const wandSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const deleteSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

interface Props {
  rows: Array<{ ticker: string; name: string; shares: number; price: number }>
  onAnalyze: (ticker: string) => void
  onRemove: (ticker: string) => void
}
