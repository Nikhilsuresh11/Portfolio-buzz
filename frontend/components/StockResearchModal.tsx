import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, FlaskConical, TrendingUp, DollarSign, BarChart3, AlertCircle } from 'lucide-react'
import { getAuthHeaders } from '../lib/auth'

interface Stock {
    ticker: string
    name: string
    exchange?: string
}

interface ResearchData {
    stock_name: string
    ticker: string
    business_model?: string
    core_focus?: string
    revenue_profit_growth?: string
    profit_margin?: string
    debt_level?: string
    cash_flow?: string
    roe_roce?: string
    pe_pb_ratio?: string
    dividend_history?: string
    price_movement_reason?: string
    competitors?: string
    capex?: string
    investment_pros?: string
    investment_cons?: string
    future_outlook?: string
    analyst_opinion?: string
    recent_news?: string
    legal_patents?: string
    recommendation?: string
    analysis?: string
    format?: string
    generated_at?: string
}

interface StockResearchModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function StockResearchModal({ isOpen, onClose }: StockResearchModalProps) {
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Stock[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
    const [researchData, setResearchData] = useState<ResearchData | null>(null)
    const [researchLoading, setResearchLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
            setQuery('')
            setSearchResults([])
            setSelectedStock(null)
            setResearchData(null)
            setError(null)
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    // Search stocks
    useEffect(() => {
        const searchStocks = async () => {
            if (query.trim().length < 1) {
                setSearchResults([])
                return
            }

            setSearchLoading(true)
            try {
                const res = await fetch(
                    `http://localhost:5000/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=8`,
                    { headers: getAuthHeaders() }
                )
                const data = await res.json()
                if (data.success) {
                    setSearchResults(data.data)
                }
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setSearchLoading(false)
            }
        }

        const debounce = setTimeout(searchStocks, 300)
        return () => clearTimeout(debounce)
    }, [query])

    // Fetch research data
    const fetchResearch = async (stock: Stock) => {
        setSelectedStock(stock)
        setResearchLoading(true)
        setError(null)
        setResearchData(null)

        try {
            const res = await fetch('http://localhost:5000/api/stock-research', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    stock_name: stock.name,
                    ticker_name: stock.ticker
                })
            })

            const data = await res.json()

            if (data.success) {
                setResearchData(data.data)
                setQuery('')
                setSearchResults([])
            } else {
                setError(data.error || 'Failed to fetch research data')
            }
        } catch (error) {
            console.error('Research error:', error)
            setError('Failed to connect to research service')
        } finally {
            setResearchLoading(false)
        }
    }

    const handleStockClick = (stock: Stock) => {
        fetchResearch(stock)
    }

    const handleBack = () => {
        setSelectedStock(null)
        setResearchData(null)
        setError(null)
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="research-modal">
                {/* Header */}
                <div className="modal-header">
                    <div className="header-left">
                        <FlaskConical size={24} className="header-icon" />
                        <div>
                            <h2 className="modal-title">Deep Stock Research</h2>
                            <p className="modal-subtitle">Comprehensive fundamental analysis powered by AI</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content">
                    {!selectedStock ? (
                        // Search View
                        <>
                            <div className="search-container">
                                <Search className="search-icon" size={20} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search for a stock to analyze (e.g., RELIANCE, TCS)..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    className="search-input"
                                />
                            </div>

                            <div className="search-results">
                                {searchLoading ? (
                                    <div className="loading-state">
                                        <Loader2 className="animate-spin" size={24} />
                                        <p>Searching...</p>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="results-list">
                                        {searchResults.map(stock => (
                                            <div
                                                key={stock.ticker}
                                                className="result-item"
                                                onClick={() => handleStockClick(stock)}
                                            >
                                                <div className="stock-info">
                                                    <span className="stock-ticker">{stock.ticker}</span>
                                                    <span className="stock-name">{stock.name}</span>
                                                </div>
                                                <div className="stock-exchange">{stock.exchange || 'NSE'}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : query.length > 0 ? (
                                    <div className="empty-state">
                                        <Search size={48} />
                                        <p>No stocks found for "{query}"</p>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <FlaskConical size={48} />
                                        <p>Search for a stock to get detailed fundamental analysis</p>
                                        <span className="hint">Covers 17+ key metrics for long-term investment</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // Research View
                        <div className="research-view">
                            <div className="research-header">
                                <button onClick={handleBack} className="back-btn">
                                    ← Back to Search
                                </button>
                                <div className="stock-title">
                                    <h3>{selectedStock.ticker}</h3>
                                    <span>{selectedStock.name}</span>
                                </div>
                            </div>

                            {researchLoading ? (
                                <div className="loading-research">
                                    <Loader2 className="animate-spin" size={40} />
                                    <p>Analyzing {selectedStock.ticker}...</p>
                                    <span>This may take 10-30 seconds</span>
                                </div>
                            ) : error ? (
                                <div className="error-state">
                                    <AlertCircle size={48} />
                                    <p>{error}</p>
                                    <button onClick={handleBack} className="retry-btn">Try Another Stock</button>
                                </div>
                            ) : researchData ? (
                                <div className="research-content">
                                    {researchData.format === 'text' ? (
                                        <div className="research-text">
                                            <pre>{researchData.analysis}</pre>
                                        </div>
                                    ) : (
                                        <div className="research-sections">
                                            {researchData.business_model && (
                                                <Section icon={<TrendingUp />} title="Business Model" content={researchData.business_model} />
                                            )}
                                            {researchData.core_focus && (
                                                <Section icon={<BarChart3 />} title="Core Focus & Strengths" content={researchData.core_focus} />
                                            )}
                                            {researchData.revenue_profit_growth && (
                                                <Section icon={<DollarSign />} title="Revenue & Profit Growth" content={researchData.revenue_profit_growth} />
                                            )}
                                            {researchData.pe_pb_ratio && (
                                                <Section title="PE & PB Ratio" content={researchData.pe_pb_ratio} />
                                            )}
                                            {researchData.roe_roce && (
                                                <Section title="ROE & ROCE" content={researchData.roe_roce} />
                                            )}
                                            {researchData.debt_level && (
                                                <Section title="Debt Level (10Y)" content={researchData.debt_level} />
                                            )}
                                            {researchData.cash_flow && (
                                                <Section title="Cash Flow (10Y)" content={researchData.cash_flow} />
                                            )}
                                            {researchData.profit_margin && (
                                                <Section title="Profit Margin (10Y)" content={researchData.profit_margin} />
                                            )}
                                            {researchData.dividend_history && (
                                                <Section title="Dividend History" content={researchData.dividend_history} />
                                            )}
                                            {researchData.price_movement_reason && (
                                                <Section title="Recent Price Movement" content={researchData.price_movement_reason} />
                                            )}
                                            {researchData.competitors && (
                                                <Section title="Competitors Analysis" content={researchData.competitors} />
                                            )}
                                            {researchData.capex && (
                                                <Section title="Capital Expenditure" content={researchData.capex} />
                                            )}
                                            {researchData.investment_pros && (
                                                <Section title="Investment Advantages" content={researchData.investment_pros} positive />
                                            )}
                                            {researchData.investment_cons && (
                                                <Section title="Investment Disadvantages" content={researchData.investment_cons} negative />
                                            )}
                                            {researchData.future_outlook && (
                                                <Section title="Future Outlook" content={researchData.future_outlook} />
                                            )}
                                            {researchData.analyst_opinion && (
                                                <Section title="Analyst Opinion" content={researchData.analyst_opinion} />
                                            )}
                                            {researchData.recent_news && (
                                                <Section title="Recent News" content={researchData.recent_news} />
                                            )}
                                            {researchData.legal_patents && (
                                                <Section title="Legal & Patents" content={researchData.legal_patents} />
                                            )}
                                            {researchData.recommendation && (
                                                <Section title="Recommendation" content={researchData.recommendation} highlight />
                                            )}
                                        </div>
                                    )}

                                    {researchData.generated_at && (
                                        <div className="research-footer">
                                            Generated at {new Date(researchData.generated_at).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    padding: 20px;
                }

                .research-modal {
                    width: 900px;
                    max-width: 95vw;
                    max-height: 90vh;
                    background: #0f172a;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    background: #1e293b;
                }

                .header-left {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .header-icon {
                    color: #3b82f6;
                }

                .modal-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #f8fafc;
                    margin: 0;
                }

                .modal-subtitle {
                    font-size: 13px;
                    color: #94a3b8;
                    margin: 4px 0 0 0;
                }

                .close-btn {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #f8fafc;
                }

                .modal-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }

                .search-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: #1e293b;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 24px;
                }

                .search-icon {
                    color: #94a3b8;
                }

                .search-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #f8fafc;
                    font-size: 15px;
                    outline: none;
                }

                .search-input::placeholder {
                    color: #64748b;
                }

                .search-results {
                    min-height: 300px;
                }

                .results-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .result-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: #1e293b;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .result-item:hover {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: rgba(59, 130, 246, 0.3);
                    transform: translateX(4px);
                }

                .stock-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
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

                .stock-exchange {
                    font-size: 12px;
                    color: #64748b;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 4px 8px;
                    border-radius: 6px;
                }

                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    color: #94a3b8;
                    gap: 12px;
                }

                .empty-state .hint {
                    font-size: 13px;
                    color: #64748b;
                }

                .research-view {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .research-header {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .back-btn {
                    background: transparent;
                    border: none;
                    color: #3b82f6;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    padding: 0;
                    text-align: left;
                }

                .back-btn:hover {
                    text-decoration: underline;
                }

                .stock-title h3 {
                    font-size: 24px;
                    font-weight: 700;
                    color: #f8fafc;
                    margin: 0;
                }

                .stock-title span {
                    color: #94a3b8;
                    font-size: 14px;
                }

                .loading-research {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    gap: 16px;
                    color: #94a3b8;
                }

                .loading-research p {
                    font-size: 16px;
                    font-weight: 500;
                    color: #f8fafc;
                }

                .loading-research span {
                    font-size: 13px;
                    color: #64748b;
                }

                .error-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 60px 20px;
                    gap: 16px;
                    color: #ef4444;
                }

                .retry-btn {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    margin-top: 8px;
                }

                .retry-btn:hover {
                    background: #2563eb;
                }

                .research-content {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .research-sections {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .research-text pre {
                    white-space: pre-wrap;
                    color: #e2e8f0;
                    line-height: 1.6;
                    font-family: inherit;
                }

                .research-footer {
                    text-align: center;
                    padding: 16px;
                    color: #64748b;
                    font-size: 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

// Section Component
function Section({ icon, title, content, positive, negative, highlight }: any) {
    return (
        <div className={`section ${positive ? 'positive' : ''} ${negative ? 'negative' : ''} ${highlight ? 'highlight' : ''}`}>
            <div className="section-header">
                {icon && <span className="section-icon">{icon}</span>}
                <h4>{title}</h4>
            </div>
            <div className="section-content">{content}</div>

            <style jsx>{`
                .section {
                    background: #1e293b;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .section.positive {
                    border-color: rgba(34, 197, 94, 0.2);
                    background: rgba(34, 197, 94, 0.05);
                }

                .section.negative {
                    border-color: rgba(239, 68, 68, 0.2);
                    background: rgba(239, 68, 68, 0.05);
                }

                .section.highlight {
                    border-color: rgba(59, 130, 246, 0.3);
                    background: rgba(59, 130, 246, 0.1);
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .section-icon {
                    color: #3b82f6;
                    display: flex;
                }

                .section-header h4 {
                    font-size: 15px;
                    font-weight: 600;
                    color: #f8fafc;
                    margin: 0;
                }

                .section-content {
                    color: #cbd5e1;
                    font-size: 14px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                }
            `}</style>
        </div>
    )
}
