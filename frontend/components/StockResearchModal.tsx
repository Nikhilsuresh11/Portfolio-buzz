import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, FlaskConical, TrendingUp, DollarSign, BarChart3, AlertCircle, ArrowLeft } from 'lucide-react'
import { getAuthHeaders } from '../lib/auth'
import { config } from '../config'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
                    `${config.API_BASE_URL}/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=8`,
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
            const res = await fetch(`${config.API_BASE_URL}/api/stock-research`, {
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
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200">
            <div className="w-[1000px] max-w-full bg-[#000] rounded-2xl shadow-2xl border border-white/10 flex flex-col h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <FlaskConical size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Deep Stock Research</h2>
                            <p className="text-sm text-gray-400 mt-1">Comprehensive fundamental analysis powered by AI</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10">
                        <X size={20} />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black">
                    {!selectedStock ? (
                        // Search View
                        <div className="flex flex-col gap-8 max-w-2xl mx-auto mt-10">
                            <div className="bg-[#111] rounded-xl border border-white/10 p-4 flex items-center gap-3 shadow-lg">
                                <Search className="text-gray-400" size={20} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search for a stock to analyze (e.g., RELIANCE, TCS)..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-gray-500"
                                />
                            </div>

                            <div className="min-h-[300px]">
                                {searchLoading ? (
                                    <div className="flex flex-col items-center justify-center gap-4 text-gray-400 py-12">
                                        <Loader2 className="animate-spin text-blue-500" size={32} />
                                        <p>Searching...</p>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchResults.map(stock => (
                                            <div
                                                key={stock.ticker}
                                                className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-white/5 cursor-pointer hover:bg-blue-600/10 hover:border-blue-500/30 transition-all group"
                                                onClick={() => handleStockClick(stock)}
                                            >
                                                <div>
                                                    <span className="block font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{stock.ticker}</span>
                                                    <span className="text-sm text-gray-400">{stock.name}</span>
                                                </div>
                                                <Badge variant="secondary" className="bg-black/30 border border-white/10 text-gray-400">
                                                    {stock.exchange || 'NSE'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : query.length > 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-4 text-gray-500 py-12">
                                        <Search size={48} className="opacity-20" />
                                        <p>No stocks found for "{query}"</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-4 text-gray-500 py-12 text-center opacity-60">
                                        <FlaskConical size={64} className="opacity-20 mb-2" />
                                        <p className="text-lg">Search for a stock to get detailed fundamental analysis</p>
                                        <span className="text-sm">Covers 17+ key metrics for long-term investment</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Research View
                        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                            <div className="flex items-center justify-between">
                                <Button variant="ghost" onClick={handleBack} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-2 pl-0">
                                    <ArrowLeft size={16} /> Back to Search
                                </Button>
                                <div className="text-right">
                                    <h3 className="text-3xl font-bold text-white">{selectedStock.ticker}</h3>
                                    <span className="text-gray-400">{selectedStock.name}</span>
                                </div>
                            </div>

                            {researchLoading ? (
                                <div className="flex flex-col items-center justify-center gap-6 py-20">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
                                        <Loader2 className="animate-spin text-blue-500 relative z-10" size={64} />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-xl font-medium text-white">Analyzing {selectedStock.ticker}...</p>
                                        <p className="text-sm text-gray-400">AI is gathering financial data and generating insights. This may take 10-30 seconds.</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center gap-6 py-20 text-red-500">
                                    <AlertCircle size={64} className="opacity-80" />
                                    <p className="text-xl font-medium">{error}</p>
                                    <Button onClick={handleBack} className="bg-red-600 hover:bg-red-700 text-white">Try Another Stock</Button>
                                </div>
                            ) : researchData ? (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                    {researchData.format === 'text' ? (
                                        <div className="bg-[#111] p-8 rounded-2xl border border-white/10 shadow-xl">
                                            <pre className="whitespace-pre-wrap font-mono text-gray-300 leading-relaxed text-sm">{researchData.analysis}</pre>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* We map specific fields to Section components carefully */}

                                            {researchData.business_model && (
                                                <Section icon={<TrendingUp />} title="Business Model" content={researchData.business_model} className="md:col-span-2" />
                                            )}

                                            {researchData.core_focus && (
                                                <Section icon={<BarChart3 />} title="Core Focus & Strengths" content={researchData.core_focus} />
                                            )}

                                            {researchData.revenue_profit_growth && (
                                                <Section icon={<DollarSign />} title="Revenue & Profit Growth" content={researchData.revenue_profit_growth} />
                                            )}

                                            {researchData.future_outlook && (
                                                <Section title="Future Outlook" content={researchData.future_outlook} className="md:col-span-2 bg-blue-900/10 border-blue-500/20" />
                                            )}

                                            {researchData.recommendation && (
                                                <Section title="AI Recommendation" content={researchData.recommendation} highlight className="md:col-span-2 text-lg" />
                                            )}

                                            {/* Financial Metrics Grid */}
                                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {researchData.pe_pb_ratio && <Section title="PE & PB Ratio" content={researchData.pe_pb_ratio} />}
                                                {researchData.roe_roce && <Section title="ROE & ROCE" content={researchData.roe_roce} />}
                                                {researchData.profit_margin && <Section title="Profit Margin (10Y)" content={researchData.profit_margin} />}
                                                {researchData.debt_level && <Section title="Debt Level (10Y)" content={researchData.debt_level} />}
                                                {researchData.cash_flow && <Section title="Cash Flow (10Y)" content={researchData.cash_flow} />}
                                                {researchData.dividend_history && <Section title="Dividend History" content={researchData.dividend_history} />}
                                            </div>

                                            {researchData.investment_pros && (
                                                <Section title="Investment Advantages" content={researchData.investment_pros} positive />
                                            )}
                                            {researchData.investment_cons && (
                                                <Section title="Investment Disadvantages" content={researchData.investment_cons} negative />
                                            )}

                                            {/* Other Sections */}
                                            {researchData.price_movement_reason && <Section title="Recent Price Movement" content={researchData.price_movement_reason} />}
                                            {researchData.competitors && <Section title="Competitors Analysis" content={researchData.competitors} />}
                                            {researchData.capex && <Section title="Capital Expenditure" content={researchData.capex} />}
                                            {researchData.analyst_opinion && <Section title="Analyst Opinion" content={researchData.analyst_opinion} />}
                                            {researchData.recent_news && <Section title="Recent News" content={researchData.recent_news} />}
                                            {researchData.legal_patents && <Section title="Legal & Patents" content={researchData.legal_patents} />}

                                        </div>
                                    )}

                                    {researchData.generated_at && (
                                        <div className="text-center py-6 text-gray-500 text-xs border-t border-white/5">
                                            Generated at {new Date(researchData.generated_at).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Section Component
function Section({ icon, title, content, positive, negative, highlight, className }: any) {
    return (
        <div className={`
            p-6 rounded-2xl border transition-all duration-300
            ${positive ? 'bg-emerald-500/5 border-emerald-500/20' :
                negative ? 'bg-red-500/5 border-red-500/20' :
                    highlight ? 'bg-blue-600/10 border-blue-500/30 shadow-lg shadow-blue-900/20' :
                        'bg-[#111] border-white/5 hover:border-white/10'}
            ${className}
        `}>
            <div className="flex items-center gap-3 mb-3">
                {icon && <span className="text-blue-400">{icon}</span>}
                <h4 className={`font-semibold text-gray-100 ${highlight ? 'text-lg text-blue-200' : 'text-base'}`}>{title}</h4>
            </div>
            <div className={`whitespace-pre-wrap leading-relaxed ${highlight ? 'text-gray-200' : 'text-gray-400 text-sm'}`}>{content}</div>
        </div>
    )
}
