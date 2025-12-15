import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { getUser, getAuthHeaders } from '../lib/auth'
import { config } from '../config'
import { Search, Loader2, FlaskConical, TrendingUp, DollarSign, BarChart3, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageLoading } from '@/components/ui/message-loading'
import { ArrowLeft } from '@carbon/icons-react'

// Toggle for development
const USE_MOCK = true

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
    const [user, setUser] = useState<any>(null)
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
        // Auth check
        const userData = getUser()
        if (!userData) {
            router.push('/auth/login')
            return
        }
        setUser(userData)
        document.documentElement.setAttribute('data-theme', 'dark')

        // Auto focus search on mount if empty
        setTimeout(() => inputRef.current?.focus(), 100)
        setLoading(false)
    }, [router])

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

    const fetchResearch = async (stock: Stock) => {
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
        <div className="flex min-h-screen bg-black text-white">
            <Sidebar />

            <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
                <div className="p-6 pb-0 z-10">
                    <Header user={user?.name || 'User'} />
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar z-10">
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
                                    <div className="flex flex-col items-center justify-center gap-4 text-gray-400 py-12">
                                        <MessageLoading />
                                        <p>Searching market data...</p>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="flex flex-col gap-2 animate-in fade-in duration-300 mt-2">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-2">Results</div>
                                        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
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
                                    <div className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                        {new Date().toLocaleDateString()}
                                    </div>
                                    <h1 className="text-2xl font-bold text-white tracking-tight">{selectedStock.ticker}</h1>
                                </div>
                            </div>

                            {researchLoading ? (
                                <div className="flex flex-col items-center justify-center gap-8 py-32">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                                        <div className="relative bg-[#111] p-6 rounded-full border border-white/10">
                                            <Loader2 className="animate-spin text-blue-500" size={48} />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-3 max-w-md">
                                        <h3 className="text-2xl font-semibold text-white">Analyzing Fundamentals</h3>
                                        <p className="text-gray-400">Our AI agents are reading financial reports, checking market sentiment, and evaluating growth metrics for <span className="text-blue-400 font-medium">{selectedStock.ticker}</span>...</p>
                                    </div>
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
                                            {/* Top Section: Verdict & Metrics */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                {/* Left: Verdict Card (2/3 width) */}
                                                <div className="lg:col-span-2 flex flex-col gap-6">

                                                    {researchData.recommendation && (
                                                        <div className="p-6 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-black/80 shadow-xl relative overflow-hidden group">
                                                            {/* Decorative bg blur */}
                                                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
                                                            <div className="relative z-10">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <div className="p-1.5 bg-blue-500 rounded-lg text-white shadow-lg shadow-blue-500/20">
                                                                        <FlaskConical size={18} />
                                                                    </div>
                                                                    <h3 className="text-lg font-bold text-white tracking-wide">AI Verdict</h3>
                                                                </div>
                                                                <div className="text-base text-gray-200 leading-relaxed font-light">
                                                                    {researchData.recommendation}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Key Stat Cards Strip */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        <MetricPill label="P/E Ratio" value={researchData.pe_pb_ratio?.split('|')[0]?.replace('P/E:', '').trim()} />
                                                        <MetricPill label="ROE" value={researchData.roe_roce?.split('|')[0]?.replace('ROE:', '').trim()} />
                                                        <MetricPill label="Margins" value={researchData.profit_margin?.split(':')[1]?.trim()} />
                                                        <MetricPill label="Debt/Eq" value={researchData.debt_level?.split(':')[1]?.split('(')[0]?.trim()} />
                                                    </div>
                                                </div>

                                                {/* Right: Future Outlook (1/3 width) */}
                                                <div className="lg:col-span-1">
                                                    {researchData.future_outlook && (
                                                        <Section
                                                            title="Growth Outlook"
                                                            content={researchData.future_outlook}
                                                            icon={<TrendingUp size={18} />}
                                                            className="h-full bg-emerald-950/10 border-emerald-500/10"
                                                            headerColor="text-emerald-400"
                                                            iconColor="text-emerald-400"
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Middle Section: Business & Core Focus */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {researchData.business_model && (
                                                    <Section title="Business Model" content={researchData.business_model} />
                                                )}
                                                {researchData.core_focus && (
                                                    <Section title="Core Strategic Focus" content={researchData.core_focus} icon={<BarChart3 size={18} />} />
                                                )}
                                            </div>

                                            {/* Pros & Cons */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {researchData.investment_pros && (
                                                    <Section
                                                        title="Investment Pros"
                                                        content={researchData.investment_pros}
                                                        icon={<CheckCircle2 size={18} />}
                                                        className="bg-emerald-900/5 border-emerald-500/10"
                                                        headerColor="text-emerald-400"
                                                        iconColor="text-emerald-500"
                                                    />
                                                )}
                                                {researchData.investment_cons && (
                                                    <Section
                                                        title="Risks & Cons"
                                                        content={researchData.investment_cons}
                                                        icon={<XCircle size={18} />}
                                                        className="bg-red-900/5 border-red-500/10"
                                                        headerColor="text-red-400"
                                                        iconColor="text-red-500"
                                                    />
                                                )}
                                            </div>

                                            {/* Financials & Competitors */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {researchData.revenue_profit_growth && (
                                                    <Section title="Financial Growth" content={researchData.revenue_profit_growth} icon={<DollarSign size={18} />} />
                                                )}
                                                {researchData.competitors && <Section title="Competitors" content={researchData.competitors} />}
                                                {researchData.analyst_opinion && <Section title="Analyst Views" content={researchData.analyst_opinion} />}
                                            </div>

                                            {/* Bottom: News & Legal */}
                                            <div className="grid grid-cols-1 gap-6">
                                                {researchData.recent_news && <Section title="Recent Developments" content={researchData.recent_news} />}
                                            </div>
                                        </>
                                    )}

                                    {researchData.generated_at && (
                                        <div className="text-center pt-8 text-gray-700 text-[10px] uppercase tracking-widest">
                                            AI Analysis • Generated {new Date(researchData.generated_at).toLocaleTimeString()}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Background ambient light effects */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
            </main>
        </div>
    )
}

function Section({ icon, title, content, className, headerColor = "text-gray-100", iconColor = "text-blue-400" }: any) {
    if (!content) return null
    return (
        <div className={`
            p-5 rounded-xl border transition-all duration-300 flex flex-col h-full
            bg-[#111] border-white/5 hover:border-white/10 hover:bg-[#151515]
            ${className}
        `}>
            <div className="flex items-center gap-2.5 mb-3">
                {icon && <span className={iconColor}>{icon}</span>}
                <h4 className={`font-semibold text-sm tracking-wide ${headerColor}`}>{title}</h4>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-gray-400 text-sm flex-1 font-light">{content}</div>
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
