import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import { useAuth } from '../../lib/auth-context'
import { usePortfolio } from '../../lib/portfolio-context'
import { buildApiUrl, getApiHeaders } from '../../lib/api-helpers'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { TrendingUp, Award, BarChart3, Target, Trophy, TrendingDown, DollarSign, ArrowLeft, ChevronRight, Activity, PieChart } from 'lucide-react'
import { PageLoader } from '../../components/ui/page-loader'
import { Button } from '@/components/ui/button'

type MFPosition = {
    position_id: string
    scheme_code: string
    scheme_name: string
    units: number
    purchase_date: string
    invested_amount: number
    current_nav: number
    current_value: number
    returns: number
    returns_percent: number
    day_change: number
    day_change_percent: number
    fund_house: string
    fund_xirr?: number | null
}

export default function MFSummaryPage() {
    const router = useRouter()
    const { userEmail, isLoading: authLoading } = useAuth()
    const { currentPortfolio, isLoading: portfolioLoading } = usePortfolio()

    const [positions, setPositions] = useState<MFPosition[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)

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
                setPositions(data.positions || [])
                setSummary(data.summary || null)
            }
        } catch (error) {
            console.error('Error fetching portfolio summary:', error)
        } finally {
            setLoading(false)
        }
    }

    const aggregatedPositions = useMemo(() => {
        const map = new Map<string, any>()

        positions.forEach(p => {
            if (map.has(p.scheme_code)) {
                const existing = map.get(p.scheme_code)
                existing.invested_amount += p.invested_amount
                existing.current_value += p.current_value
                existing.returns += p.returns
                existing.day_change += p.day_change
                // Recalculate returns percent for the aggregated position
                existing.returns_percent = (existing.returns / existing.invested_amount) * 100
                existing.units += p.units
            } else {
                map.set(p.scheme_code, { ...p })
            }
        })

        return Array.from(map.values())
    }, [positions])

    const insights = useMemo(() => {
        if (aggregatedPositions.length === 0) return null

        const bestDailyPct = aggregatedPositions.reduce((max, p) => p.day_change_percent > max.day_change_percent ? p : max)
        const worstDailyPct = aggregatedPositions.reduce((min, p) => p.day_change_percent < min.day_change_percent ? p : min)
        const bestDailyRupee = aggregatedPositions.reduce((max, p) => p.day_change > max.day_change ? p : max)
        const worstDailyRupee = aggregatedPositions.reduce((min, p) => p.day_change < min.day_change ? p : min)

        return { bestDailyPct, worstDailyPct, bestDailyRupee, worstDailyRupee }
    }, [aggregatedPositions])

    const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1']

    const getRandomColor = (symbol: string) => {
        const colors = [
            'bg-gradient-to-br from-blue-500 to-blue-600',
            'bg-gradient-to-br from-purple-500 to-purple-600',
            'bg-gradient-to-br from-pink-500 to-pink-600',
            'bg-gradient-to-br from-emerald-500 to-emerald-600',
            'bg-gradient-to-br from-amber-500 to-amber-600',
        ];
        const index = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    if (authLoading || portfolioLoading || (loading && positions.length === 0)) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <PageLoader messages={["Analyzing fund breakdown...", "Calculating allocations...", "Generating insights..."]} />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">

            {/* Background effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="flex-1 px-6 md:px-8 pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full relative z-10">

                {/* Header */}
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                            MF Summary
                        </h1>
                        <p className="text-neutral-400">Deep dive into your mutual fund allocations and performance metrics.</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                        <button
                            onClick={() => router.push('/mf-portfolio')}
                            className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-9 px-5 rounded-[11px] flex items-center transition-colors"
                        >
                            <ArrowLeft size={16} />
                            View Global Overview
                        </button>
                    </div>
                </div>

                {insights && summary && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        {/* Overall Today G/L */}
                        <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-[9px] uppercase mb-2 font-medium tracking-wider">
                                <Activity className="w-3.5 h-3.5 text-blue-400" />
                                Today's G/L
                            </div>
                            <div className={`text-[15px] font-bold ${summary.total_day_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ₹{summary.total_day_change.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[9px] mt-0.5 font-medium ${summary.total_day_change >= 0 ? 'text-green-500/80' : 'text-red-500/80'}`}>
                                {summary.total_day_change_percent.toFixed(2)}% today
                            </div>
                        </div>

                        {/* Best Pct */}
                        <div className="bg-zinc-900/40 border border-emerald-500/10 backdrop-blur-xl rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-[9px] uppercase mb-2 font-medium tracking-wider">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                Best Performance %
                            </div>
                            <div className="text-[14px] font-bold text-white truncate">{insights.bestDailyPct.scheme_name}</div>
                            <div className="text-[10px] text-emerald-400 mt-0.5">{insights.bestDailyPct.day_change_percent.toFixed(2)}%</div>
                        </div>

                        {/* Worst Pct */}
                        <div className="bg-zinc-900/40 border border-rose-500/10 backdrop-blur-xl rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-[9px] uppercase mb-2 font-medium tracking-wider">
                                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                                Worst Performance %
                            </div>
                            <div className="text-[14px] font-bold text-white truncate">{insights.worstDailyPct.scheme_name}</div>
                            <div className="text-[10px] text-rose-400 mt-0.5">{insights.worstDailyPct.day_change_percent.toFixed(2)}%</div>
                        </div>

                        {/* Best Rupee */}
                        <div className="bg-zinc-900/40 border border-emerald-500/10 backdrop-blur-xl rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-[9px] uppercase mb-2 font-medium tracking-wider">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                Top Gainer (₹)
                            </div>
                            <div className="text-[14px] font-bold text-white truncate">{insights.bestDailyRupee.scheme_name}</div>
                            <div className="text-[10px] text-emerald-400 mt-0.5">+₹{insights.bestDailyRupee.day_change.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>

                        {/* Worst Rupee */}
                        <div className="bg-zinc-900/40 border border-rose-500/10 backdrop-blur-xl rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-[9px] uppercase mb-2 font-medium tracking-wider">
                                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                                Top Loser (₹)
                            </div>
                            <div className="text-[14px] font-bold text-white truncate">{insights.worstDailyRupee.scheme_name}</div>
                            <div className="text-[10px] text-rose-400 mt-0.5">₹{insights.worstDailyRupee.day_change.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                )}

                {/* Fund-wise Performance Table */}
                <div className="bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col mb-10">
                    <div className="p-4 border-b border-white/10 bg-zinc-900/50">
                        <h3 className="text-base font-bold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            Fund Performance
                        </h3>
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Sticky Header */}
                        <table className="w-full border-collapse text-left table-fixed">
                            <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm">
                                <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                    <th className="px-4 py-3 w-[350px]">Mutual Fund Scheme</th>
                                    <th className="px-3 py-3 text-right w-[140px]">Invested</th>
                                    <th className="px-3 py-3 text-right w-[140px]">Current Value</th>
                                    <th className="px-3 py-3 text-right w-[110px]">Day G/L</th>
                                    <th className="px-3 py-3 text-right w-[110px]">XIRR</th>
                                    <th className="px-3 py-3 text-right w-[160px]">Total Return</th>
                                    <th className="px-3 py-3 text-right w-[130px]">Allocation</th>
                                    <th className="px-3 py-3 text-right pr-6 w-[110px]">Latest NAV</th>
                                </tr>
                            </thead>
                        </table>

                        {/* Scrollable Body */}
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full border-collapse text-left table-fixed">
                                <tbody className="divide-y divide-white/5">
                                    {aggregatedPositions.map((p) => {
                                        const houseInitial = p.fund_house.substring(0, 1).toUpperCase();
                                        const isPositive = p.returns >= 0;

                                        return (
                                            <tr
                                                key={p.scheme_code}
                                                onClick={() => router.push(`/mf-positions?fund=${encodeURIComponent(p.fund_house)}`)}
                                                className="group cursor-pointer transition-colors duration-200 hover:bg-white/5"
                                            >
                                                {/* Scheme Name Column */}
                                                <td className="px-4 py-4 w-[350px]">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`
                                                            w-10 h-10 rounded-lg flex items-center justify-center 
                                                            text-white font-black text-sm shadow-md shrink-0
                                                            ${getRandomColor(p.fund_house)}
                                                        `}>
                                                            {houseInitial}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5 truncate">{p.fund_house}</div>
                                                            <div className="font-semibold text-gray-100 text-[12px] group-hover:text-blue-400 transition-colors truncate uppercase tracking-tight">{p.scheme_name}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Invested */}
                                                <td className="px-3 py-4 text-right tabular-nums text-sm text-zinc-300 font-medium w-[140px]">
                                                    ₹{p.invested_amount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                                                </td>

                                                {/* Current Value */}
                                                <td className="px-3 py-4 text-right tabular-nums font-bold text-sm text-white w-[140px]">
                                                    ₹{p.current_value.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                                                </td>

                                                {/* Day G/L */}
                                                <td className="px-3 py-4 text-right w-[110px]">
                                                    <div className={`text-sm font-semibold ${p.day_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {p.day_change >= 0 ? '+' : ''}{p.day_change_percent.toFixed(2)}%
                                                    </div>
                                                    <div className={`text-[10px] ${p.day_change >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                                                        {p.day_change >= 0 ? '+' : ''}₹{Math.abs(p.day_change).toFixed(2)}
                                                    </div>
                                                </td>

                                                {/* XIRR */}
                                                <td className="px-3 py-4 text-right w-[110px]">
                                                    <div className={`text-sm font-semibold ${p.fund_xirr && p.fund_xirr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {p.fund_xirr ? `${p.fund_xirr.toFixed(1)}%` : 'N/A'}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500/60 uppercase font-medium">Annualized</div>
                                                </td>

                                                {/* Total Return */}
                                                <td className="px-3 py-4 text-right w-[160px]">
                                                    <div className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {isPositive ? '+' : ''}{p.returns_percent.toFixed(2)}%
                                                    </div>
                                                    <div className={`text-[10px] ${isPositive ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                                                        {isPositive ? '+' : ''}₹{Math.abs(p.returns).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                                                    </div>
                                                </td>

                                                {/* Allocation */}
                                                <td className="px-3 py-4 text-right w-[130px]">
                                                    <span className="inline-block px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400 font-bold text-[11px] uppercase">
                                                        {summary?.current_value ? ((p.current_value / summary.current_value) * 100).toFixed(1) : '0.0'}%
                                                    </span>
                                                </td>

                                                {/* Latest NAV */}
                                                <td className="px-3 py-4 text-right pr-6 tabular-nums text-zinc-500 font-medium text-sm tracking-tight w-[110px]">
                                                    ₹{p.current_nav.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* Allocation Chart */}
                    <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col group">
                        <div className="p-4 border-b border-white/10 bg-zinc-900/50">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <PieChart size={20} className="text-blue-400" />
                                Fund Distribution
                            </h3>
                        </div>
                        <div className="p-8 relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <PieChart size={64} className="w-32 h-32" />
                            </div>
                            <div className="h-[350px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={aggregatedPositions.map(p => ({ name: p.scheme_name, value: p.current_value }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={90}
                                            outerRadius={130}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {aggregatedPositions.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} className="hover:opacity-80 transition-opacity cursor-pointer outline-none" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl p-4 rounded-2xl shadow-2xl">
                                                            <p className="text-zinc-500 text-[10px] uppercase font-black mb-1">{payload[0].name}</p>
                                                            <p className="text-white font-black text-xl">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
                                                            <p className="text-blue-400 text-xs font-bold mt-1 uppercase">
                                                                Allocation: {summary?.current_value ? ((Number(payload[0].value) / summary.current_value) * 100).toFixed(1) : '0.0'}%
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                                {/* Center labels for Donut */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Total Value</div>
                                    <div className="text-2xl font-black text-white tracking-tight">
                                        ₹{summary?.current_value?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weightage List */}
                    <div className="bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col group">
                        <div className="p-4 border-b border-white/10 bg-zinc-900/50">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Activity size={20} className="text-emerald-400" />
                                Portfolio Weightage
                            </h3>
                        </div>
                        <div className="p-8 overflow-y-auto scrollbar-hide">
                            <div className="space-y-6">
                                {aggregatedPositions.map((p, index) => (
                                    <div key={p.scheme_code} className="flex flex-col gap-2 group/item">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                                            <span className="truncate max-w-[180px] group-hover/item:text-white transition-colors uppercase">{p.scheme_name}</span>
                                            <span className="text-white font-bold text-sm">
                                                {summary?.current_value ? ((p.current_value / summary.current_value) * 100).toFixed(1) : '0.0'}
                                                <span className="text-[10px] text-zinc-500 ml-0.5">%</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-zinc-800/50 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 group-hover:opacity-100 opacity-80"
                                                style={{
                                                    width: `${summary?.current_value ? (p.current_value / summary.current_value) * 100 : 0}%`,
                                                    backgroundColor: chartColors[index % chartColors.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mt-12 mb-10">
                    <Button
                        onClick={() => router.push('/mf-portfolio')}
                        variant="ghost"
                        className="text-zinc-500 hover:text-white font-bold h-12 px-8 rounded-xl flex items-center gap-2 group transition-all"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Global Overview
                    </Button>
                </div>
            </div >

            <style jsx global>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
        </div >
    );
}
