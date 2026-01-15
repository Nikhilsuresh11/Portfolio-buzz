import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { useAuth } from '../lib/auth-context'
import { buildApiUrl, buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { Search, Loader2, FlaskConical, TrendingUp, DollarSign, BarChart3, AlertCircle, CheckCircle2, XCircle, PieChart, Scale, Target, Users, Newspaper, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WatchlistLoader } from '@/components/ui/watchlist-loader'
import { ArrowLeft } from '@carbon/icons-react'

// Toggle for development
const USE_MOCK = false

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

const MOCK_DATA: ResearchData = {
    stock_name: "Reliance Industries",
    ticker: "RELIANCE",
    format: "json",
    recommendation: "STRONG BUY. The company is pivoting effectively towards future-ready businesses (Green Energy, 5G/6G, Retail) while maintaining cash cow stability from O2C. Valuation is attractive at 22x FY25E EPS compared to historical average.",
    future_outlook: "Highly Positive. 5G rollout monetization, rapid retail footprint expansion, and New Energy giga-factories coming online by 2025 will drive next leg of growth. Earnings expected to compound at 15-18% over next 3 years.",
    business_model: "Diversified conglomerate operating an integrated ecosystem. Oil-to-Chemicals (O2C) provides steady cash flows which fund high-growth Digital Services (Jio) and Retail segments.",
    core_focus: "Aggressive transition to Green Energy (Solar/Hydrogen), extending 5G leadership to AirFiber/Enterprise, and omnichannel Retail dominance.",
    revenue_profit_growth: "Revenue: ₹9.8 Trillion (+2.6% YoY)\nEBITDA: ₹1.7 Trillion (+16% YoY)\nNet Profit: ₹79,020 Cr (+10% YoY)",
    profit_margin: "Net Margin: 8.5% (Expanding)",
    debt_level: "Net Debt/EBITDA: 0.65x (Healthy)",
    cash_flow: "Operating Cash Flow: ₹1.4 Trillion (Robust)",
    roe_roce: "ROE: 13.5% | ROCE: 14.2%",
    pe_pb_ratio: "P/E: 26.4x | P/B: 2.1x",
    dividend_history: "Dividend Yield: 0.3% (Reinvents profits)",
    price_movement_reason: "Recent upside driven by details on New Energy listing unlocking value and tariff hikes in Telecom sector.",
    competitors: "Digital: Airtel, TCS\nRetail: D-Mart, Tata Trent\nEnergy: Adani Green, IOCL",
    investment_pros: "1. Market leader in Telecom & Retail\n2. Robust O2C cash flows acting as buffer\n3. Visionary management with execution track record\n4. New Energy could be a massive value creator",
    investment_cons: "1. Massive capex of ₹75,000 Cr/year drags free cash flow\n2. O2C highly cyclical and linked to oil prices\n3. Conglomerate discount in valuation",
    analyst_opinion: "Consensus: BUY (28 Analysts), HOLD (4), SELL (2). Avg Target: ₹3,250 (+12% upside).",
    recent_news: "- Jio Financial Services demerger complete\n- Secured $2B credit line for 5G expansion\n- Acquired Metro Cash & Carry India",
    generated_at: new Date().toISOString()
}

export default function ResearchPage() {
    const router = useRouter()
    const { userEmail, isLoading: isAuthLoading } = useAuth()
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Stock[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
    const [researchData, setResearchData] = useState<ResearchData | null>(null)
    const [researchLoading, setResearchLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isAuthLoading && !userEmail) {
            router.push('/')
            return
        }
        document.documentElement.setAttribute('data-theme', 'dark')

        // Auto focus search on mount if empty
        setTimeout(() => inputRef.current?.focus(), 100)
        setLoading(false)
    }, [router, isAuthLoading, userEmail])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                // If in search view with query, clear query
                if (!selectedStock && query) {
                    setQuery('')
                    setSearchResults([])
                }
                // If viewing stock details, go back to search
                if (selectedStock) {
                    handleBack()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [query, selectedStock])

    // Search stocks
    useEffect(() => {
        const searchStocks = async () => {
            if (query.trim().length < 1) {
                setSearchResults([])
                return
            }

            setSearchLoading(true)
            try {
                // Search is public
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

    const fetchResearch = async (stock: Stock) => {
        if (!userEmail) return;

        setSelectedStock(stock)
        setResearchLoading(true)
        setError(null)
        setResearchData(null)

        if (USE_MOCK) {
            setTimeout(() => {
                setResearchData({ ...MOCK_DATA, ticker: stock.ticker, stock_name: stock.name })
                setResearchLoading(false)
                setQuery('')
                setSearchResults([])
            }, 1000)
            return
        }

        try {
            const url = buildPublicApiUrl('stock-research'); // Stock research is public
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
            if (!USE_MOCK) setResearchLoading(false)
        }
    }

    const handleStockClick = (stock: Stock) => {
        fetchResearch(stock)
    }

    const handleBack = () => {
        setSelectedStock(null)
        setResearchData(null)
        setError(null)
        setTimeout(() => inputRef.current?.focus(), 100)
    }



    return (
        <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar z-10 max-w-[1600px] mx-auto w-full">
                {/* Unified Header */}
                <div className="mb-10 flex items-start justify-between">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-1.5 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                                Deep Research
                            </h1>
                            <p className="text-zinc-400 text-sm">Comprehensive AI-powered fundamental analysis and financial deep dives</p>
                        </div>
                    </div>
                </div>
                {!selectedStock ? (
                    // Search View
                    <div className="flex flex-col gap-10 max-w-3xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-2xl mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                                <FlaskConical size={48} className="text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                                Deep Stock Research
                            </h1>
                            <p className="text-l text-gray-400 max-w-xl mx-auto">
                                Get comprehensive fundamental analysis, financial metrics, and AI-powered investment insights instantly.
                            </p>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative bg-[#0a0a0a] rounded-xl border border-white/10 p-4 flex items-center gap-4 shadow-2xl">
                                <Search className="text-gray-400" size={20} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search ticker or company name (e.g., RELIANCE)..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-white text-l placeholder:text-gray-600"
                                />
                                {query && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-500 hover:text-white"
                                        onClick={() => setQuery('')}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="min-h-[200px]">
                            {searchLoading ? (
                                <div className="flex flex-col items-center justify-center gap-4 text-zinc-500 py-12">
                                    <Loader2 className="animate-spin" size={32} />
                                    <p className="text-sm font-medium">Searching market data...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="flex flex-col gap-2 animate-in fade-in duration-300 mt-2">
                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">Results</div>
                                    <div className="bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl rounded-xl overflow-hidden divide-y divide-zinc-800/50">
                                        {searchResults.map(stock => (
                                            <div
                                                key={stock.ticker}
                                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors group"
                                                onClick={() => handleStockClick(stock)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                                                        {stock.ticker.substring(0, 2)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">{stock.ticker}</span>
                                                        <span className="text-xs text-gray-500 line-clamp-1">{stock.name}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] py-0 h-5 border-white/10 text-gray-500">
                                                    {stock.exchange || 'NSE'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : query.length > 0 ? (
                                <div className="flex flex-col items-center justify-center gap-4 text-gray-500 py-12">
                                    <Search size={40} className="opacity-20" />
                                    <p>No stocks found matching "{query}"</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
                                    {[
                                        { t: 'RELIANCE', n: 'Reliance Industries' },
                                        { t: 'TCS', n: 'Tata Consultancy Services' },
                                        { t: 'INFY', n: 'Infosys Limited' }
                                    ].map(s => (
                                        <div key={s.t} onClick={() => { setQuery(s.t) }} className="p-4 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 hover:scale-105 transition-all">
                                            <div className="font-bold text-white">{s.t}</div>
                                            <div className="text-xs text-gray-400">{s.n}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Research View
                    <div className="max-w-7xl mx-auto animate-in scale-[0.98] fade-in duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 gap-2 bg-black/40 backdrop-blur-sm h-9 px-4 text-xs uppercase tracking-wider"
                            >
                                <ArrowLeft size={14} /> Back
                            </Button>
                            <div className="text-right flex items-center gap-3">
                                <h1 className="text-l font-bold text-white tracking-tight">{selectedStock.ticker}</h1>
                            </div>
                        </div>

                        {researchLoading ? (
                            <div className="flex-1 flex items-center justify-center min-h-screen">
                                <WatchlistLoader />
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center gap-6 py-20 text-red-500 bg-red-500/5 rounded-3xl border border-red-500/10">
                                <AlertCircle size={64} className="opacity-80" />
                                <p className="text-xl font-medium">{error}</p>
                                <Button onClick={handleBack} className="bg-red-600 hover:bg-red-700 text-white border-none">Try Another Stock</Button>
                            </div>
                        ) : researchData ? (
                            <div className="space-y-6 pb-20">
                                {researchData.format === 'text' ? (
                                    <div className="bg-[#111] p-8 rounded-3xl border border-white/10 shadow-2xl">
                                        <pre className="whitespace-pre-wrap font-mono text-gray-300 leading-relaxed text-sm">{researchData.analysis}</pre>
                                    </div>
                                ) : (
                                    <>
                                        {/* Top Section: Verdict */}
                                        <div className="w-full mb-8">
                                            {researchData.recommendation && (
                                                <div className="w-full p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                                                    <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-start">
                                                        <div className="flex-shrink-0">
                                                            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 shadow-lg inline-flex">
                                                                <FlaskConical size={28} />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-3">AI Investment Verdict</h3>
                                                            <div className="text-lg text-zinc-200 leading-relaxed font-light whitespace-pre-line">
                                                                {researchData.recommendation?.replace(/\[\d+\]/g, '')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pros & Cons Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            {researchData.investment_pros && (
                                                <Section
                                                    title="Investment Pros"
                                                    content={researchData.investment_pros}
                                                    icon={<CheckCircle2 size={16} />}
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

                                        {/* Other Results Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
                                            {researchData.profit_margin && (
                                                <Section title="Profit Margins" content={researchData.profit_margin} icon={<PieChart size={18} />} />
                                            )}
                                            {researchData.debt_level && (
                                                <Section title="Debt Profile" content={researchData.debt_level} icon={<Scale size={18} />} />
                                            )}
                                            {researchData.core_focus && (
                                                <Section title="Core Strategic Focus" content={researchData.core_focus} icon={<Target size={18} />} />
                                            )}
                                            {researchData.competitors && (
                                                <Section title="Competitors" content={researchData.competitors} icon={<Users size={18} />} />
                                            )}
                                        </div>

                                        {/* Bottom: Side-by-side Analyst Views and Recent Developments */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {researchData.analyst_opinion && (
                                                <Section title="Analyst Views" content={researchData.analyst_opinion} icon={<Info size={18} />} />
                                            )}
                                            {researchData.recent_news && (
                                                <Section title="Recent Developments" content={researchData.recent_news} icon={<Newspaper size={18} />} />
                                            )}
                                        </div>
                                    </>
                                )}

                                {researchData.generated_at && (
                                    <div className="text-center pt-8 text-zinc-600 text-[10px] uppercase tracking-widest font-medium">
                                        AI Analysis • Generated {new Date(researchData.generated_at).toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Background ambient light effects */}
        </div>
    )
}

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

function MetricPill({ label, value }: { label: string, value?: string }) {
    if (!value) return null
    return (
        <div className="bg-[#111] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-white/5 transition-colors">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</span>
            <span className="text-sm font-bold text-white">{value}</span>
        </div>
    )
}
