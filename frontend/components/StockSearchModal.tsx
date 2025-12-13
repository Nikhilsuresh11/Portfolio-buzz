import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Plus, Check, Loader2 } from 'lucide-react'
import { getToken } from '../lib/auth'
import { config } from '../config'

interface Stock {
    ticker: string
    name: string
    exchange?: string
    sector?: string
    price?: number
    change?: number
    changePercent?: number
}

interface StockSearchModalProps {
    isOpen: boolean
    onClose: () => void
    onAddStock: (ticker: string) => void
    watchlist: Stock[]
}

export default function StockSearchModal({ isOpen, onClose, onAddStock, watchlist }: StockSearchModalProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Stock[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
            setQuery('')
            setResults([])
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    useEffect(() => {
        const searchStocks = async () => {
            if (query.trim().length < 1) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const token = getToken()
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                const res = await fetch(`${config.API_BASE_URL}/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=10`, {
                    headers
                })

                const data = await res.json()
                if (data.success) {
                    setResults(data.data)
                }
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(searchStocks, 300)
        return () => clearTimeout(debounce)
    }, [query])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (selectedIndex >= 0 && results[selectedIndex]) {
                handleAdd(results[selectedIndex].ticker)
            }
        } else if (e.key === 'Escape') {
            onClose()
        }
    }

    const handleAdd = (ticker: string) => {
        onAddStock(ticker)
        // Don't close immediately to allow adding multiple
    }

    const isStockInWatchlist = (ticker: string) => {
        return watchlist.some(s => s.ticker === ticker)
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div
                className="search-modal"
                ref={modalRef}
                onClick={e => e.stopPropagation()}
            >
                <div className="search-header">
                    <Search className="search-icon" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search stocks (e.g. RELIANCE, TCS)..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="search-input"
                    />
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="search-results">
                    {loading ? (
                        <div className="search-loading">
                            <Loader2 className="animate-spin" size={24} />
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="results-list">
                            {results.map((stock, index) => {
                                const inWatchlist = isStockInWatchlist(stock.ticker)
                                return (
                                    <li
                                        key={stock.ticker}
                                        className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
                                        onClick={() => !inWatchlist && handleAdd(stock.ticker)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div className="stock-info">
                                            <span className="stock-ticker">{stock.ticker}</span>
                                            <span className="stock-name">{stock.name}</span>
                                        </div>
                                        <div className="stock-meta">
                                            <span className="stock-exchange">{stock.exchange || 'NSE'}</span>
                                            {inWatchlist ? (
                                                <span className="in-watchlist">
                                                    <Check size={16} /> Added
                                                </span>
                                            ) : (
                                                <button
                                                    className="add-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleAdd(stock.ticker)
                                                    }}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : query.length > 0 ? (
                        <div className="no-results">
                            No stocks found for "{query}"
                        </div>
                    ) : (
                        <div className="search-placeholder">
                            Type to search for Indian stocks
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 100px;
          z-index: 100;
          animation: fadeIn 0.2s ease;
        }

        .search-modal {
          width: 600px;
          max-width: 90vw;
          background: #1e293b;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .search-header {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: #0f172a;
        }

        .search-icon {
          color: #94a3b8;
          margin-right: 12px;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #f8fafc;
          font-size: 16px;
          outline: none;
        }

        .search-input::placeholder {
          color: #64748b;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }

        .search-results {
          max-height: 400px;
          overflow-y: auto;
          background: #1e293b;
        }

        .results-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .result-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          cursor: pointer;
          transition: background 0.1s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .result-item:last-child {
          border-bottom: none;
        }

        .result-item:hover, .result-item.selected {
          background: rgba(59, 130, 246, 0.1);
        }

        .stock-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stock-ticker {
          font-weight: 600;
          color: #f8fafc;
          font-size: 15px;
        }

        .stock-name {
          color: #94a3b8;
          font-size: 13px;
        }

        .stock-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stock-exchange {
          font-size: 12px;
          color: #64748b;
          background: rgba(0, 0, 0, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .add-btn {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-btn:hover {
          background: #3b82f6;
          color: white;
        }

        .in-watchlist {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #10b981;
          font-weight: 500;
        }

        .search-loading, .no-results, .search-placeholder {
          padding: 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    )
}
