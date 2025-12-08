import React from 'react'
import { Wand2, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

interface Props {
  rows: Array<{
    ticker: string;
    name: string;
    price?: number;
    change?: number;
    changePercent?: number;
    currency?: string;
    shares?: number;
    volume?: number;
    high?: number;
    low?: number;
    open?: number;
    prev_close?: number;
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

const formatVolume = (num?: number) => {
  if (!num) return '-'
  if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(1) + "B"
  if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(1) + "M"
  if (num >= 1.0e+3) return (num / 1.0e+3).toFixed(1) + "K"
  return num.toString()
}

const getRandomColor = (ticker: string) => {
  const colors = [
    'linear-gradient(135deg, #3b82f6, #2563eb)', // Blue
    'linear-gradient(135deg, #8b5cf6, #7c3aed)', // Purple
    'linear-gradient(135deg, #ec4899, #db2777)', // Pink
    'linear-gradient(135deg, #10b981, #059669)', // Emerald
    'linear-gradient(135deg, #f59e0b, #d97706)', // Amber
  ]
  const index = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

export default function StockTable({ rows, onSelect, onAnalyze, onRemove, selectedTicker }: Props) {
  return (
    <div className="card" style={cardStyle}>
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '30%' }}>Company</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Change</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Volume</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Day Range</th>
              <th style={{ ...thStyle, textAlign: 'right', width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const dayChange = r.change || 0
              const dayPct = r.changePercent || 0
              const isSelected = selectedTicker === r.ticker
              const isPositive = dayChange >= 0
              const tickerPrefix = r.ticker.substring(0, 2).toUpperCase()

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
                  {/* Company Column */}
                  <td style={tdCompanyStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: getRandomColor(r.ticker),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: 'white',
                        fontSize: 14,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        {tickerPrefix}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14 }}>{r.ticker}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>{r.name}</div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td style={{ ...tdNumberStyle, fontWeight: 700, fontSize: 15 }}>
                    {getCurrencySymbol(r.currency)}{(r.price || 0).toFixed(2)}
                  </td>

                  {/* Change */}
                  <td style={{ ...tdNumberStyle }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: isPositive ? '#22c55e' : '#ef4444',
                      fontWeight: 600,
                      background: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 13
                    }}>
                      {isPositive ? <ArrowUp size={14} strokeWidth={3} /> : <ArrowDown size={14} strokeWidth={3} />}
                      {Math.abs(dayPct).toFixed(2)}%
                    </div>
                  </td>

                  {/* Volume */}
                  <td style={tdNumberStyle}>
                    {formatVolume(r.volume)}
                  </td>

                  {/* Day Range */}
                  <td style={tdNumberStyle}>
                    {r.low && r.high ? (
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>
                        {r.low.toFixed(1)} - {r.high.toFixed(1)}
                      </span>
                    ) : '-'}
                  </td>

                  {/* Actions */}
                  <td style={tdActionsStyle}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="action-btn analyze-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAnalyze(r.ticker)
                        }}
                        title="AI Insights"
                        style={iconBtnStyle}
                      >
                        <Wand2 size={16} strokeWidth={2} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemove(r.ticker)
                        }}
                        title="Remove"
                        style={iconBtnStyle}
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
        .action-btn:hover {
            color: #f8fafc !important;
            background: rgba(255, 255, 255, 0.1) !important;
        }
        .analyze-btn:hover {
            color: #3b82f6 !important;
            background: rgba(59, 130, 246, 0.1) !important;
        }
        .delete-btn:hover {
            color: #ef4444 !important;
            background: rgba(239, 68, 68, 0.1) !important;
        }
      `}</style>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  overflow: 'hidden',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.05)',
  background: '#0f172a', // Darker background for table
}

const tableWrapperStyle: React.CSSProperties = {
  overflowX: 'auto',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const thStyle: React.CSSProperties = {
  padding: '16px 24px',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
  background: '#0f172a',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
}

const trStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  transition: 'background-color 0.15s ease',
}

const tdCompanyStyle: React.CSSProperties = {
  padding: '20px 24px',
}

const tdNumberStyle: React.CSSProperties = {
  padding: '20px 24px',
  fontSize: 14,
  color: '#e2e8f0',
  textAlign: 'right',
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
}

const tdActionsStyle: React.CSSProperties = {
  padding: '20px 24px',
  textAlign: 'right',
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#64748b',
  border: 'none',
  padding: '8px',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
