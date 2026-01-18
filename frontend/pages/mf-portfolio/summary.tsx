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

        const highestInvested = aggregatedPositions.reduce((max, p) => p.invested_amount > max.invested_amount ? p : max)
        const bestReturn = aggregatedPositions.reduce((max, p) => p.returns_percent > max.returns_percent ? p : max)
        const worstReturn = aggregatedPositions.reduce((min, p) => p.returns_percent < min.returns_percent ? p : min)
        const largestValue = aggregatedPositions.reduce((max, p) => p.current_value > max.current_value ? p : max)

        return { highestInvested, bestReturn, worstReturn, largestValue }
    }, [aggregatedPositions])

    const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1']

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
                <div className="mb-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 pt-8">
                        MF Summary
                    </h1>
                    <p className="text-zinc-400 text-sm">Deep dive into your mutual fund allocations and performance metrics.</p>
                </div>

                {insights && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {/* Highest Invested */}
                        <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-3">
                                <DollarSign size={14} className="text-blue-400" />
                                Highest Invested
                            </div>
                            <div className="text-lg font-semibold text-white truncate">{insights.highestInvested.scheme_name}</div>
                            <div className="text-sm text-zinc-500 mt-2">₹{insights.highestInvested.invested_amount.toLocaleString('en-IN')}</div>
                        </div>

                        {/* Best Performer */}
                        <div className="bg-zinc-900/40 border border-emerald-500/20 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 text-emerald-500/60 text-xs mb-3">
                                <Trophy size={14} className="text-emerald-400" />
                                Best Return
                            </div>
                            <div className="text-lg font-semibold text-emerald-400 truncate">{insights.bestReturn.scheme_name}</div>
                            <div className="text-sm text-zinc-500 mt-2">+{insights.bestReturn.returns_percent.toFixed(2)}% absolute return</div>
                        </div>

                        {/* Lagging Fund */}
                        <div className="bg-zinc-900/40 border border-rose-500/20 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 text-rose-500/60 text-xs mb-3">
                                <TrendingDown size={14} className="text-rose-400" />
                                Lowest Return
                            </div>
                            <div className="text-lg font-semibold text-rose-400 truncate">{insights.worstReturn.scheme_name}</div>
                            <div className="text-sm text-zinc-500 mt-2">{insights.worstReturn.returns_percent.toFixed(2)}% absolute return</div>
                        </div>

                        {/* Largest Holding */}
                        <div className="bg-zinc-900/40 border border-purple-500/20 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 text-purple-500/60 text-xs mb-3">
                                <Target size={14} className="text-purple-400" />
                                Concentration
                            </div>
                            <div className="text-lg font-semibold text-purple-400 truncate">{insights.largestValue.scheme_name}</div>
                            <div className="text-sm text-zinc-500 mt-2">
                                Weight: {summary?.current_value ? ((insights.largestValue.current_value / summary.current_value) * 100).toFixed(1) : '0.0'}% of total
                            </div>
                        </div>
                    </div>
                )}

                {/* Fund-wise Performance Table */}
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden mb-10">
                    <div className="p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
                        <h3 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <BarChart3 className="w-6 h-6 text-blue-400" />
                            </div>
                            Performance Metrics
                        </h3>
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Individual Fund Analysis</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-800/50 bg-zinc-900/10">
                                    <th className="px-8 py-6">Mutual Fund Scheme</th>
                                    <th className="px-8 py-6 text-right">Invested</th>
                                    <th className="px-8 py-6 text-right">Current Value</th>
                                    <th className="px-8 py-6 text-right text-emerald-500/80">XIRR</th>
                                    <th className="px-8 py-6 text-right">Total Return</th>
                                    <th className="px-8 py-6 text-right">Concentration</th>
                                    <th className="px-8 py-6 text-right">Latest NAV</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                                {aggregatedPositions.map((p) => (
                                    <tr
                                        key={p.scheme_code}
                                        onClick={() => router.push(`/mf-positions?fund=${encodeURIComponent(p.fund_house)}`)}
                                        className="group/row hover:bg-zinc-800/30 transition-all cursor-pointer"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">{p.fund_house}</div>
                                            <div className="font-black text-white text-base group-hover/row:text-blue-400 transition-colors uppercase tracking-tight">{p.scheme_name}</div>
                                        </td>
                                        <td className="px-8 py-6 text-right tabular-nums text-zinc-300 font-bold">₹{p.invested_amount.toLocaleString('en-IN')}</td>
                                        <td className="px-8 py-6 text-right tabular-nums font-black text-white text-base">₹{p.current_value.toLocaleString('en-IN')}</td>
                                        <td className="px-8 py-6 text-right tabular-nums">
                                            <div className={`text-base font-black ${p.fund_xirr && p.fund_xirr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {p.fund_xirr ? `${p.fund_xirr.toFixed(2)}%` : 'N/A'}
                                            </div>
                                            <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Annualized</div>
                                        </td>
                                        <td className="px-8 py-6 text-right tabular-nums">
                                            <div className={`text-base font-black ${p.returns >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {p.returns >= 0 ? '+' : ''}{p.returns_percent.toFixed(2)}%
                                            </div>
                                            <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${p.returns >= 0 ? 'text-emerald-500/50' : 'text-rose-500/50'}`}>
                                                {p.returns >= 0 ? '+' : ''}₹{Math.abs(p.returns).toLocaleString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 font-black text-xs uppercase tracking-tighter">
                                                {summary?.current_value ? ((p.current_value / summary.current_value) * 100).toFixed(1) : '0.0'}%
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right tabular-nums text-zinc-500 font-bold text-sm tracking-tighter">
                                            ₹{p.current_nav.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* Allocation Chart */}
                    <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/60 rounded-[2.5rem] p-10 h-[500px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <PieChart size={64} className="w-32 h-32" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-8 tracking-tight relative z-10 flex items-center gap-3">
                            <Activity className="text-blue-400" />
                            Fund Distribution
                        </h3>
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

                    {/* Weightage List */}
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto scrollbar-hide group">
                        <h3 className="text-2xl font-black text-white mb-8 tracking-tight flex items-center gap-3">
                            <Activity className="text-emerald-400" />
                            Portfolio Weightage
                        </h3>
                        <div className="space-y-6">
                            {aggregatedPositions.map((p, index) => (
                                <div key={p.scheme_code} className="flex flex-col gap-2 group/item">
                                    <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-zinc-400">
                                        <span className="truncate max-w-[180px] group-hover/item:text-white transition-colors uppercase">{p.scheme_name}</span>
                                        <span className="text-white font-black text-base">
                                            {summary?.current_value ? ((p.current_value / summary.current_value) * 100).toFixed(1) : '0.0'}
                                            <span className="text-xs text-zinc-500 ml-0.5">%</span>
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
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}
