import React from 'react'
import { Wand2, Trash2 } from 'lucide-react'

interface Props {
  rows: Array<{
    ticker: string;
    name: string;
    price?: number;
    change?: number;
    changePercent?: number;
    currency?: string;
    shares?: number;
  }>
  onSelect: (ticker: string) => void
  onAnalyze: (ticker: string) => void
  onRemove: (ticker: string) => void
  selectedTicker?: string | null
}

const getCurrencySymbol = (currency?: string) => {
  if (currency === 'INR') return '₹'
  if (currency === 'EUR') return '€'
  if (currency === 'GBP') return '£'
  return '$'
}

export default function StockTable({ rows, onSelect, onAnalyze, onRemove, selectedTicker }: Props) {
  return (
    <div className="card" style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Watchlist</h2>
          <p style={subtitleStyle}>{rows.length} stocks</p>
        </div>
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Symbol</th>
              <th style={thStyle}>Name</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Change</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>% Change</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const dayChange = r.change || 0
              const dayPct = r.changePercent || 0
              const isSelected = selectedTicker === r.ticker

              return (
                <tr
                  key={r.ticker}
                  style={{
                    ...trStyle,
                    background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                  }}
                  onClick={() => onSelect(r.ticker)}
                  className="stock-row"
                >
                  <td style={tdSymbolStyle}>{r.ticker}</td>
                  <td style={tdNameStyle}>{r.name}</td>
                  <td style={tdNumberStyle}>{getCurrencySymbol(r.currency)}{(r.price || 0).toFixed(2)}</td>
                  <td style={{ ...tdNumberStyle, color: dayChange < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {dayChange > 0 ? '+' : ''}{dayChange.toFixed(2)}
                  </td>
                  <td style={{ ...tdNumberStyle, color: dayPct < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {dayPct > 0 ? '+' : ''}{dayPct.toFixed(2)}%
                  </td>
                  <td style={tdActionsStyle}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button
                        className="analyze-btn"
                        aria-label={`analyze-${r.ticker}`}
                        title="AI Insights & News"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAnalyze(r.ticker)
                        }}
                        style={iconBtnStyle}
                      >
                        <Wand2 size={16} strokeWidth={2} />
                      </button>
                      <button
                        aria-label={`delete-${r.ticker}`}
                        title="Remove from watchlist"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemove(r.ticker)
                        }}
                        style={deleteBtnStyle}
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Your watchlist is empty. Click the search icon to add stocks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <style jsx>{`
        .stock-row:hover {
          background: rgba(255, 255, 255, 0.03) !important;
          cursor: pointer;
        }
        .analyze-btn:hover {
          background: rgba(59, 130, 246, 0.1) !important;
          color: #3b82f6 !important;
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
      `}</style>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: 0,
  overflow: 'hidden',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.05)',
  background: 'rgba(30, 41, 59, 0.2)',
  backdropFilter: 'blur(10px)',
}

const headerStyle: React.CSSProperties = {
  padding: '24px 28px',
  borderBottom: '1px solid rgba(248, 250, 252, 0.08)',
  background: 'rgba(15, 23, 42, 0.3)',
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
  color: '#94a3b8',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '8px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const deleteBtnStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  padding: '8px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}
