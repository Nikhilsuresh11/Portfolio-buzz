import React, { useState, useEffect } from 'react'
import { X, Plus, Check, TrendingUp, ArrowRight } from 'lucide-react'
import { getToken } from '../lib/auth'

interface Stock {
  ticker: string
  name: string
  exchange?: string
  sector?: string
}

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  onAddStock: (ticker: string) => void
  watchlist: Stock[]
}

export default function WelcomeModal({ isOpen, onClose, onAddStock, watchlist }: WelcomeModalProps) {
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [addedStocks, setAddedStocks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      fetchTrendingStocks()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const fetchTrendingStocks = async () => {
    try {
      const token = getToken()
      const headers: HeadersInit = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('https://portfolio-buzz.onrender.com/api/search/default?limit=6', {
        headers
      })

      const data = await res.json()
      if (data.success) {
        setTrendingStocks(data.data)
      }
    } catch (error) {
      console.error('Error fetching trending stocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = (ticker: string) => {
    onAddStock(ticker)
    setAddedStocks(prev => new Set(prev).add(ticker))
  }

  const isStockInWatchlist = (ticker: string) => {
    return watchlist.some(s => s.ticker === ticker) || addedStocks.has(ticker)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="welcome-modal">
        <div className="modal-content">
          <div className="modal-header">
            <div className="icon-wrapper">
              <TrendingUp size={32} color="#3b82f6" />
            </div>
            <h2>Welcome to Portfolio Buzz</h2>
            <p>Start by adding some popular stocks to your watchlist to track their performance and news.</p>
          </div>

          <div className="stocks-grid">
            {loading ? (
              <div className="loading-state">Loading suggestions...</div>
            ) : (
              trendingStocks.map(stock => {
                const added = isStockInWatchlist(stock.ticker)
                return (
                  <div key={stock.ticker} className={`stock-card ${added ? 'added' : ''}`}>
                    <div className="stock-info">
                      <span className="ticker">{stock.ticker}</span>
                      <span className="name">{stock.name}</span>
                    </div>
                    <button
                      className={`action-btn ${added ? 'added' : ''}`}
                      onClick={() => !added && handleAdd(stock.ticker)}
                      disabled={added}
                    >
                      {added ? <Check size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                )
              })
            )}
          </div>

          <div className="modal-footer">
            <button className="continue-btn" onClick={onClose}>
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          animation: fadeIn 0.3s ease;
        }

        .welcome-modal {
          width: 500px;
          max-width: 90vw;
          background: linear-gradient(145deg, #1e293b, #0f172a);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
          animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-content {
          padding: 40px;
        }

        .modal-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .icon-wrapper {
          width: 64px;
          height: 64px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
        }

        h2 {
          font-size: 24px;
          font-weight: 700;
          color: #f8fafc;
          margin: 0 0 12px;
        }

        p {
          color: #94a3b8;
          font-size: 15px;
          line-height: 1.5;
          margin: 0;
        }

        .stocks-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }

        .stock-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
        }

        .stock-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .stock-card.added {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .stock-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .ticker {
          font-weight: 600;
          color: #f8fafc;
          font-size: 14px;
        }

        .name {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .action-btn:hover {
          background: #2563eb;
          transform: scale(1.05);
        }

        .action-btn.added {
          background: #10b981;
          cursor: default;
          transform: none;
        }

        .modal-footer {
          display: flex;
          justify-content: center;
        }

        .continue-btn {
          background: white;
          color: #0f172a;
          border: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .continue-btn:hover {
          background: #f1f5f9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
        }

        .loading-state {
          grid-column: span 2;
          text-align: center;
          padding: 20px;
          color: #64748b;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
