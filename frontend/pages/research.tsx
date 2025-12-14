import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { getUser, getAuthHeaders } from '../lib/auth'
import { config } from '../config'
import { Search, Loader2, FlaskConical, TrendingUp, DollarSign, BarChart3, AlertCircle } from 'lucide-react'
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
    }, [router])

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
                                        <Loader2 className="animate-spin text-blue-500" size={32} />
                                        <p>Searching market data...</p>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="grid gap-3 animate-in fade-in duration-300">
                                        <div className="text-sm font-medium text-gray-500 uppercase tracking-widest pl-2 mb-1">Results</div>
                                        {searchResults.map(stock => (
                                            <div
                                                key={stock.ticker}
                                                className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 hover:border-blue-500/30 transition-all group"
                                                onClick={() => handleStockClick(stock)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/10">
                                                        {stock.ticker.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <span className="block font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{stock.ticker}</span>
                                                        <span className="text-sm text-gray-400">{stock.name}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-black/30 border border-white/10 text-gray-400 group-hover:border-blue-500/30 transition-colors">
                                                    {stock.exchange || 'NSE'}
                                                </Badge>
                                            </div>
                                        ))}
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
                        <div className="max-w-6xl mx-auto animate-in slide-in-from-right-8 duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 gap-2 bg-black/40 backdrop-blur-sm"
                                >
                                    <Search size={16} /> Search Another
                                </Button>
                                <div className="text-right">
                                    <h1 className="text-4xl font-bold text-white tracking-tight">{selectedStock.ticker}</h1>
                                    <p className="text-lg text-gray-400">{selectedStock.name}</p>
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
                                    <div className="flex gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-0"></span>
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-150"></span>
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-300"></span>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center gap-6 py-20 text-red-500 bg-red-500/5 rounded-3xl border border-red-500/10">
                                    <AlertCircle size={64} className="opacity-80" />
                                    <p className="text-xl font-medium">{error}</p>
                                    <Button onClick={handleBack} className="bg-red-600 hover:bg-red-700 text-white border-none">Try Another Stock</Button>
                                </div>
                            ) : researchData ? (
                                <div className="space-y-8 pb-20">
                                    {researchData.format === 'text' ? (
                                        <div className="bg-[#111] p-8 rounded-3xl border border-white/10 shadow-2xl">
                                            <pre className="whitespace-pre-wrap font-mono text-gray-300 leading-relaxed text-sm">{researchData.analysis}</pre>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {/* Key Highlights / Recommendation - Full Width */}
                                            {researchData.recommendation && (
                                                <div className="md:col-span-2 lg:col-span-3 p-8 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-900/10 to-black shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="p-2 bg-blue-500 rounded-lg text-white">
                                                                <FlaskConical size={24} />
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-white">AI Investment Verdict</h3>
                                                        </div>
                                                        <div className="text-lg text-gray-200 leading-relaxed whitespace-pre-wrap">
                                                            {researchData.recommendation}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {researchData.future_outlook && (
                                                <Section title="Future Outlook & Growth" content={researchData.future_outlook} className="md:col-span-2 lg:col-span-2 bg-[#1a1a1a]/50 border-white/10" icon={<TrendingUp />} />
                                            )}

                                            {researchData.business_model && (
                                                <Section title="Business Model" content={researchData.business_model} />
                                            )}

                                            {researchData.core_focus && (
                                                <Section title="Core Focus" content={researchData.core_focus} icon={<BarChart3 />} />
                                            )}

                                            {researchData.revenue_profit_growth && (
                                                <Section title="Financial Growth" content={researchData.revenue_profit_growth} icon={<DollarSign />} />
                                            )}

                                            {/* Financial Metrics Strip */}
                                            <div className="md:col-span-2 lg:col-span-3 p-6 rounded-3xl bg-black border border-white/10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                                <MetricCard title="P/E & P/B" value={researchData.pe_pb_ratio} />
                                                <MetricCard title="ROE & ROCE" value={researchData.roe_roce} />
                                                <MetricCard title="Margins" value={researchData.profit_margin} />
                                                <MetricCard title="Debt" value={researchData.debt_level} />
                                                <MetricCard title="Cash Flow" value={researchData.cash_flow} />
                                                <MetricCard title="Dividends" value={researchData.dividend_history} />
                                            </div>

                                            {researchData.investment_pros && (
                                                <Section title="Pros" content={researchData.investment_pros} positive className="lg:col-span-1.5" />
                                            )}
                                            {researchData.investment_cons && (
                                                <Section title="Cons" content={researchData.investment_cons} negative className="lg:col-span-1.5" />
                                            )}

                                            {/* Detailed Sections */}
                                            {researchData.competitors && <Section title="Competitors" content={researchData.competitors} />}
                                            {researchData.price_movement_reason && <Section title="Price Action" content={researchData.price_movement_reason} />}
                                            {researchData.capex && <Section title="Capex" content={researchData.capex} />}
                                            {researchData.analyst_opinion && <Section title="Analyst Views" content={researchData.analyst_opinion} />}
                                            {researchData.recent_news && <Section title="Recent News" content={researchData.recent_news} />}
                                            {researchData.legal_patents && <Section title="Legal/Patents" content={researchData.legal_patents} />}

                                        </div>
                                    )}

                                    {researchData.generated_at && (
                                        <div className="text-center pt-8 text-gray-600 text-xs">
                                            Analysis generated by PortfolioBuzz AI • {new Date(researchData.generated_at).toLocaleString()}
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

function Section({ icon, title, content, positive, negative, highlight, className }: any) {
    if (!content) return null
    return (
        <div className={`
            p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full
            ${positive ? 'bg-emerald-950/20 border-emerald-500/20' :
                negative ? 'bg-red-950/20 border-red-500/20' :
                    highlight ? 'bg-blue-900/10 border-blue-500/30' :
                        'bg-[#111] border-white/5 hover:border-white/10 hover:bg-[#161616]'}
            ${className}
        `}>
            <div className="flex items-center gap-3 mb-4">
                {icon && <span className="text-blue-400">{icon}</span>}
                <h4 className={`font-semibold ${positive ? 'text-emerald-400' : negative ? 'text-red-400' : 'text-gray-100'}`}>{title}</h4>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-gray-400 text-sm flex-1">{content}</div>
        </div>
    )
}

function MetricCard({ title, value }: any) {
    if (!value) return null
    return (
        <div className="flex flex-col justify-center p-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</span>
            <span className="text-sm font-medium text-white line-clamp-2" title={value}>{value}</span>
        </div>
    )
}
