import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, FlaskConical, TrendingUp, DollarSign, BarChart3, AlertCircle, ArrowLeft, PieChart, Scale, Target, Users, Newspaper, Info } from 'lucide-react'
import { buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { useAuth } from '../lib/auth-context'
import { config } from '../config'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WatchlistLoader } from '@/components/ui/watchlist-loader'

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
    const { userEmail } = useAuth()
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
                const url = buildPublicApiUrl(`search/autocomplete?q=${encodeURIComponent(query)}&limit=8`);
                const res = await fetch(url, { headers: getApiHeaders() })
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
            const url = buildPublicApiUrl('stock-research');
            const res = await fetch(url, {
                method: 'POST',
                headers: getApiHeaders(),
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
                        <div className="flex flex-col gap-6 max-w-2xl mx-auto mt-10">
                            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-xl border border-zinc-800/50 p-4 flex items-center gap-3 shadow-lg">
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
                                                className="flex items-center justify-between p-4 bg-zinc-900/20 rounded-xl border border-zinc-800/30 cursor-pointer hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group"
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
                                <div className="flex-1 flex items-center justify-center min-h-[500px]">
                                    <WatchlistLoader />
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
                                        <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-800 shadow-xl font-mono text-zinc-300 leading-relaxed text-sm">
                                            <pre className="whitespace-pre-wrap">{researchData.analysis}</pre>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Top Section: Verdict */}
                                            {researchData.recommendation && (
                                                <div className="w-full p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl shadow-xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
                                                    <div className="relative z-10 flex gap-5 items-start">
                                                        <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 shrink-0">
                                                            <FlaskConical size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-2">AI Investment Verdict</h3>
                                                            <p className="text-lg text-zinc-200 leading-relaxed font-light">
                                                                {researchData.recommendation?.replace(/\[\d+\]/g, '')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pros & Cons Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                                                {researchData.investment_pros && (
                                                    <Section
                                                        title="Investment Pros"
                                                        content={researchData.investment_pros}
                                                        icon={<TrendingUp size={16} />}
                                                        headerColor="text-emerald-400"
                                                    />
                                                )}
                                                {researchData.investment_cons && (
                                                    <Section
                                                        title="Risks & Cons"
                                                        content={researchData.investment_cons}
                                                        icon={<AlertCircle size={16} />}
                                                        headerColor="text-red-400"
                                                    />
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                                                {researchData.business_model && (
                                                    <Section title="Business Model" content={researchData.business_model} icon={<BarChart3 size={16} />} />
                                                )}
                                                {researchData.future_outlook && (
                                                    <Section
                                                        title="Growth Outlook"
                                                        content={researchData.future_outlook}
                                                        icon={<TrendingUp size={16} />}
                                                    />
                                                )}
                                                {researchData.pe_pb_ratio && (
                                                    <Section
                                                        title="Valuation Analysis"
                                                        content={researchData.pe_pb_ratio}
                                                        icon={<DollarSign size={16} />}
                                                    />
                                                )}
                                                {researchData.roe_roce && (
                                                    <Section
                                                        title="Efficiency & Returns"
                                                        content={researchData.roe_roce}
                                                        icon={<BarChart3 size={16} />}
                                                    />
                                                )}
                                                {researchData.revenue_profit_growth && (
                                                    <Section title="Financial Growth" content={researchData.revenue_profit_growth} icon={<TrendingUp size={16} />} />
                                                )}
                                                {researchData.competitors && <Section title="Competitors" content={researchData.competitors} icon={<Users size={16} />} />}
                                            </div>

                                            {/* Bottom: Side-by-side Analyst Views and Recent Developments */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                                                {researchData.analyst_opinion && (
                                                    <Section title="Analyst Views" content={researchData.analyst_opinion} icon={<Info size={16} />} />
                                                )}
                                                {researchData.recent_news && (
                                                    <Section title="Recent Developments" content={researchData.recent_news} icon={<Newspaper size={16} />} />
                                                )}
                                            </div>
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
function Section({ icon, title, content, className, headerColor = "text-zinc-100", iconColor = "text-blue-400" }: any) {
    if (!content) return null
    return (
        <div className={`
            p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full
            bg-zinc-900/40 border-zinc-800/60 backdrop-blur-2xl hover:bg-zinc-900/60 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 group/card
            ${className}
        `}>
            <div className="flex items-center gap-3 mb-4">
                {icon && <span className={`${iconColor} transition-transform duration-300 group-hover/card:scale-110`}>{icon}</span>}
                <h4 className={`font-bold text-lg tracking-tight ${headerColor}`}>{title}</h4>
            </div>
            <div className="whitespace-pre-line leading-relaxed text-zinc-400 text-[14px] flex-1 font-normal opacity-90">
                {content?.replace(/\[\d+\]/g, '')}
            </div>
        </div>
    )
}
