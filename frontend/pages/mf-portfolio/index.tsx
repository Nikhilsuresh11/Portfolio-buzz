import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import { useAuth } from '../../lib/auth-context'
import { usePortfolio } from '../../lib/portfolio-context'
import { buildApiUrl, getApiHeaders } from '../../lib/api-helpers'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, RefreshCw, Plus } from 'lucide-react'
import { PageLoader } from '../../components/ui/page-loader'
import { Button } from '@/components/ui/button'

type PortfolioSummary = {
    total_invested: number
    current_value: number
    total_returns: number
    total_returns_percent: number
    xirr: number | null
    nifty_xirr: number | null
    alpha: number | null
    position_count: number
}

export default function MFOverviewPage() {
    const router = useRouter()
    const { userEmail, isLoading: authLoading } = useAuth()
    const { currentPortfolio, isLoading: portfolioLoading } = usePortfolio()

    const [summary, setSummary] = useState<PortfolioSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    useEffect(() => {
        if (!authLoading && !userEmail) {
            router.push('/login')
        }
    }, [authLoading, userEmail, router])

    useEffect(() => {
        if (userEmail && currentPortfolio) {
            fetchPortfolioAnalysis()
        }
    }, [userEmail, currentPortfolio])

    const fetchPortfolioAnalysis = async () => {
        if (!userEmail || !currentPortfolio) return

        try {
            setLoading(true)
            const url = buildApiUrl(userEmail, `mf-portfolio/${currentPortfolio.portfolio_id}/analysis`)
            const res = await fetch(url, { headers: getApiHeaders() })
            const data = await res.json()

            if (data.success) {
                setSummary(data.summary || null)
            }
        } catch (error) {
            console.error('Error fetching portfolio analysis:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchPortfolioAnalysis()
        setIsRefreshing(false)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value)
    }

    const formatPercent = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A'
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    }

    if (authLoading || portfolioLoading || (loading && !summary)) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <PageLoader
                    messages={["Loading MF Overview...", "Calculating XIRR...", "Comparing with Nifty..."]}
                    subtitle="Analyzing your mutual fund performance"
                />
            </div>
        )
    }

    if (!currentPortfolio) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-center p-4">
                <div className="text-white text-xl mb-4 font-bold">No Portfolio Selected</div>
                <p className="text-zinc-400 mb-6 max-w-sm">Please select or create a portfolio to view your mutual fund investments.</p>
                <Button onClick={() => router.push('/portfolios')} className="bg-blue-600 hover:bg-blue-500">Go to Portfolios</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">
            <Header />

            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="flex-1 px-6 md:p-8 pb-6 md:pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full relative z-10">
                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                            MF Overview
                        </h1>
                        <p className="text-zinc-400">Comprehensive performance analysis of your mutual fund investments</p>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        variant="outline"
                        className="bg-zinc-900/50 border-zinc-800 text-white gap-2 hover:bg-zinc-800"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>

                {summary && (
                    <div className="space-y-8">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-6 hover:border-blue-500/30 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wide font-bold">Total Invested</span>
                                    <DollarSign className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="text-3xl font-bold text-white">{formatCurrency(summary.total_invested)}</div>
                                <div className="text-xs text-zinc-500 mt-2">{summary.position_count} active funds</div>
                            </div>

                            <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-6 hover:border-blue-500/30 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wide font-bold">Current Value</span>
                                    <BarChart3 className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="text-3xl font-bold text-white">{formatCurrency(summary.current_value)}</div>
                                <div className={`text-xs mt-2 font-bold ${summary.total_returns >= 0 ? 'text-green-400' : 'text-danger'}`}>
                                    {formatPercent(summary.total_returns_percent)} absolute
                                </div>
                            </div>

                            <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-6 hover:border-blue-500/30 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wide font-bold">Total Gains</span>
                                    {summary.total_returns >= 0 ? <TrendingUp size={16} className="text-green-400" /> : <TrendingDown size={16} className="text-red-400" />}
                                </div>
                                <div className={`text-3xl font-bold ${summary.total_returns >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(summary.total_returns)}
                                </div>
                                <div className="text-xs text-zinc-500 mt-2">Real-time P/L</div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-600/10 to-emerald-600/10 border border-blue-500/20 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-blue-500/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-zinc-400 text-xs uppercase tracking-wide font-bold">Portfolio XIRR</span>
                                    <Activity className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className={`text-3xl font-bold ${summary.xirr && summary.xirr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {summary.xirr ? `${summary.xirr.toFixed(2)}%` : 'N/A'}
                                </div>
                                <div className="text-xs text-zinc-500 mt-2">Annualized return</div>
                            </div>
                        </div>

                        {/* Benchmark Comparison */}
                        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
                            <h3 className="text-2xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Benchmark Comparison (vs Nifty 50)</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                {/* Comparison Table Style */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-zinc-400 font-medium">Portfolio XIRR</div>
                                        <div className={`text-2xl font-bold ${summary.xirr && summary.xirr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatPercent(summary.xirr)}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-zinc-400 font-medium">Nifty 50 XIRR</div>
                                        <div className="text-2xl font-bold text-white">
                                            {formatPercent(summary.nifty_xirr)}
                                        </div>
                                    </div>
                                    <div className={`flex justify-between items-center p-4 rounded-2xl border ${summary.alpha && summary.alpha >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                        <div className="text-zinc-300 font-bold">Alpha (Outperformance)</div>
                                        <div className={`text-2xl font-black ${summary.alpha && summary.alpha >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatPercent(summary.alpha)}
                                        </div>
                                    </div>
                                </div>

                                {/* Comparison Graphic */}
                                <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-3xl border border-white/5 h-full">
                                    <div className="relative w-48 h-48 flex items-center justify-center">
                                        {/* Simple visualization of alpha */}
                                        <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-spin-slow ${summary.alpha && summary.alpha >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`} style={{ animationDuration: '20s' }} />
                                        <div className="text-center z-10">
                                            <div className={`text-5xl font-black mb-1 ${summary.alpha && summary.alpha >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {summary.alpha ? `${Math.abs(summary.alpha).toFixed(1)}%` : '0.0%'}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                                                {summary.alpha && summary.alpha >= 0 ? 'Outperformance' : 'Underperformance'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Call to Action */}
                        <div className="flex flex-col md:flex-row gap-4 justify-center py-6">
                            <Button onClick={() => router.push('/mf-portfolio/summary')} className="h-12 px-8 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded-2xl gap-2 text-lg">
                                <BarChart3 size={20} />
                                View Breakdown
                            </Button>
                            <Button onClick={() => router.push('/mf-positions')} className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl gap-2 text-lg shadow-lg shadow-blue-600/20">
                                <Plus size={20} />
                                Manage Positions
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
            `}</style>
        </div>
    )
}
