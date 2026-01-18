import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import { useAuth } from '../../lib/auth-context'
import { usePortfolio } from '../../lib/portfolio-context'
import { buildApiUrl, getApiHeaders } from '../../lib/api-helpers'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, RefreshCw, Plus, PieChart, ArrowUpRight, Target } from 'lucide-react'
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
            const url = buildApiUrl(userEmail, `mf-portfolio/${currentPortfolio.portfolio_id}/overview`)
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
        if (value === null || value === undefined) return '0.00%'
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
                <div className="bg-zinc-900/50 p-6 rounded-3xl mb-6">
                    <PieChart className="w-16 h-16 text-zinc-700" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Portfolio Selected</h3>
                <p className="text-zinc-500 mb-8 max-w-sm">Please select or create a portfolio to view your mutual fund investments.</p>
                <Button
                    onClick={() => router.push('/settings')}
                    className="bg-white hover:bg-zinc-200 text-black font-bold h-11 px-8 rounded-xl shadow-lg shadow-white/5"
                >
                    Go to Settings
                </Button>
            </div>
        )
    }

    const isProfit = summary && summary.total_returns >= 0

    return (
        <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">

            {/* Premium Background Effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="flex-1 px-6 md:px-8 pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">
                            MF Overview
                        </h1>
                        <p className="text-zinc-400 mt-2 text-sm">Global performance overview of your mutual fund portfolio.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="bg-zinc-900/50 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors h-10 w-10 p-0 rounded-xl"
                        >
                            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        </Button>
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                            <Button
                                onClick={() => router.push('/mf-positions')}
                                className="bg-black hover:bg-zinc-900 text-white font-semibold h-9 px-5 rounded-[11px] flex items-center gap-2 transition-colors"
                            >
                                <Plus size={16} />
                                Manage Positions
                            </Button>
                        </div>
                    </div>
                </div>

                {summary && (
                    <div className="space-y-10">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Invested */}
                            <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                                <p className="text-zinc-500 text-xs mb-2">Total Invested</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(summary.total_invested)}</p>
                            </div>

                            {/* Current Value */}
                            <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                                <p className="text-zinc-500 text-xs mb-2">Current Value</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(summary.current_value)}</p>
                            </div>

                            {/* Net P&L */}
                            <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                                <p className="text-zinc-500 text-xs mb-2">Net Profit/Loss</p>
                                <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isProfit ? '+' : ''}{formatCurrency(summary.total_returns)}
                                </p>
                            </div>

                            {/* XIRR */}
                            <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                                <p className="text-zinc-500 text-xs mb-2">Portfolio XIRR</p>
                                <p className={`text-2xl font-bold ${summary.xirr && summary.xirr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {summary.xirr ? `${summary.xirr.toFixed(2)}%` : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Analysis & Benchmarking */}
                        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                            <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-8">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <Target className="w-48 h-48" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                        <div>
                                            <h3 className="text-3xl font-black text-white tracking-tight mb-2">Benchmark Analysis</h3>
                                            <p className="text-zinc-500 font-medium">How your portfolio performs against the Nifty 50 Index.</p>
                                        </div>
                                        <div className={`px-6 p-4 rounded-3xl border-2 flex flex-col items-center justify-center ${summary.alpha && summary.alpha >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                            <div className={`text-3xl font-black ${summary.alpha && summary.alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {formatPercent(summary.alpha)}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Alpha Generated</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                        <div className="space-y-4">
                                            <div className="p-6 bg-zinc-800/20 border border-zinc-800/40 rounded-[1.5rem] flex items-center justify-between group/item hover:bg-zinc-800/40 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                    <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Portfolio XIRR</span>
                                                </div>
                                                <div className="text-2xl font-black text-white">{formatPercent(summary.xirr)}</div>
                                            </div>

                                            <div className="p-6 bg-zinc-800/20 border border-zinc-800/40 rounded-[1.5rem] flex items-center justify-between group/item hover:bg-zinc-800/40 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                                    <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Nifty 50 XIRR</span>
                                                </div>
                                                <div className="text-2xl font-black text-white">{formatPercent(summary.nifty_xirr)}</div>
                                            </div>


                                            <div className="pt-6">
                                                <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                                                    <Button
                                                        onClick={() => router.push('/mf-portfolio/summary')}
                                                        className="w-full bg-black hover:bg-zinc-900 text-white font-semibold h-10 rounded-[11px] flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <PieChart size={18} />
                                                        Full Allocation Breakdown
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-center p-10 bg-black/40 border border-zinc-800/50 rounded-[2rem] min-h-[300px] relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 opacity-50" />

                                            <div className="relative w-56 h-56 flex items-center justify-center">
                                                {/* Animated benchmark visual */}
                                                <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-spin-slow ${summary.alpha && summary.alpha >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`} style={{ animationDuration: '30s' }} />
                                                <div className={`absolute inset-4 rounded-full border-2 border-zinc-800/50`} />

                                                <div className="text-center z-10 px-4">
                                                    <div className={`text-6xl font-black mb-1 ${summary.alpha && summary.alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {summary.alpha ? `${Math.abs(summary.alpha).toFixed(1)}` : '0.0'}
                                                        <span className="text-2xl text-zinc-500">%</span>
                                                    </div>
                                                    <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black leading-tight">
                                                        {summary.alpha && summary.alpha >= 0 ? 'Market Alpha' : 'Relative Return'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                <div className={`w-2 h-2 rounded-full ${summary.alpha && summary.alpha >= 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                {summary.alpha && summary.alpha >= 0 ? 'Systematic Alpha Strategy Active' : 'Market Lag Identified'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                    animation: spin-slow 30s linear infinite;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div >
    )
}
