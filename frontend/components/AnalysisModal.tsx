import { useEffect, useState } from 'react'
import RelatedNews from './RelatedNews'
import { getToken } from '../lib/auth'

export default function AnalysisModal({ ticker, open, onClose }: { ticker?: string | null, open: boolean, onClose: () => void }) {
  const [tab, setTab] = useState<'insights' | 'news'>('insights')
  const [analysis, setAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && ticker) {
      document.body.style.overflow = 'hidden'
      fetchAnalysis(ticker)
    } else {
      document.body.style.overflow = ''
      setTab('insights')
      setAnalysis('')
      setError('')
    }
    return () => { document.body.style.overflow = '' }
  }, [open, ticker])

  const fetchAnalysis = async (stockTicker: string) => {
    setLoading(true)
    setError('')
    try {
      const token = getToken()
      const res = await fetch('https://portfolio-buzz.onrender.com/api/ai-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_name: stockTicker.split('.')[0], // Simple heuristic for name
          ticker: stockTicker
        })
      })

      const data = await res.json()
      if (data.success) {
        setAnalysis(data.data.analysis)
      } else {
        setError(data.error || 'Failed to generate insights')
      }
    } catch (err) {
      setError('Failed to connect to analysis service')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onMouseDown={onClose} aria-modal="true" role="dialog">
      <div className="modal" onMouseDown={e => e.stopPropagation()} style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>{ticker} Analysis</h2>
            <p style={subtitleStyle}>AI-powered insights and related news</p>
          </div>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={tabsContainerStyle}>
          <button
            className={`pill ${tab === 'insights' ? 'active' : ''}`}
            onClick={() => setTab('insights')}
            style={tabButtonStyle}
          >
            AI Insights
          </button>
          <button
            className={`pill ${tab === 'news' ? 'active' : ''}`}
            onClick={() => setTab('news')}
            style={tabButtonStyle}
          >
            News
          </button>
        </div>

        {/* Content */}
        <div style={contentWrapperStyle}>
          {tab === 'insights' ? (
            <div style={contentBoxStyle}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <div className="loading-spinner"></div>
                </div>
              ) : error ? (
                <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>
              ) : (
                <pre style={textStyle}>{analysis}</pre>
              )}
            </div>
          ) : (
            <div style={contentBoxStyle}>
              <RelatedNews isModal={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const modalStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid rgba(248, 250, 252, 0.1)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 28,
  paddingBottom: 20,
  borderBottom: '1px solid rgba(248, 250, 252, 0.08)',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 700,
  color: '#f8fafc',
  letterSpacing: '-0.02em',
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  marginTop: 6,
  fontSize: 14,
  color: '#94a3b8',
  fontWeight: 500,
}

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(248, 250, 252, 0.1)',
  borderRadius: 8,
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#cbd5e1',
  transition: 'all 0.2s ease',
}

const tabsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 24,
  padding: 4,
  background: 'rgba(30, 41, 59, 0.5)',
  borderRadius: 12,
  border: '1px solid rgba(248, 250, 252, 0.05)',
}

const tabButtonStyle: React.CSSProperties = {
  fontSize: 14,
  padding: '10px 20px',
  fontWeight: 500,
}

const contentWrapperStyle: React.CSSProperties = {
  minHeight: 400,
}

const contentBoxStyle: React.CSSProperties = {
  padding: 28,
  background: 'rgba(30, 41, 59, 0.4)',
  border: '1px solid rgba(248, 250, 252, 0.08)',
  borderRadius: 12,
  minHeight: 400,
}

const textStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  margin: 0,
  lineHeight: 1.7,
  fontSize: 14,
  color: '#e2e8f0',
  fontWeight: 400,
}
