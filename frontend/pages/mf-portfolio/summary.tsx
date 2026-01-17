import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import { useAuth } from '../../lib/auth-context'
import { usePortfolio } from '../../lib/portfolio-context'
import { buildApiUrl, getApiHeaders } from '../../lib/api-helpers'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TrendingUp, Award, BarChart3, Target, Trophy, TrendingDown, DollarSign } from 'lucide-react'
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

    const insights = useMemo(() => {
        if (positions.length === 0) return null

        const highestInvested = positions.reduce((max, p) => p.invested_amount > max.invested_amount ? p : max)
        const bestReturn = positions.reduce((max, p) => p.returns_percent > max.returns_percent ? p : max)
        const worstReturn = positions.reduce((min, p) => p.returns_percent < min.returns_percent ? p : min)
        const largestValue = positions.reduce((max, p) => p.current_value > max.current_value ? p : max)

        return { highestInvested, bestReturn, worstReturn, largestValue }
    }, [positions])

    const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

    if (authLoading || portfolioLoading || (loading && positions.length === 0)) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <PageLoader messages={["Analyzing fund breakdown...", "Calculating allocations..."]} />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <Header />

            <div className="flex-1 px-6 md:p-8 pb-6 md:pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                        Portfolio Breakdown
                    </h1>
                    <p className="text-zinc-400">Detailed analysis of individual fund performance and weightage</p>
                </div>

                {insights && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase mb-2">
                                <DollarSign size={14} className="text-blue-400" />
                                Highest Invested
                            </div>
                            <div className="text-lg font-bold text-white truncate">{insights.highestInvested.scheme_name}</div>
                            <div className="text-sm text-zinc-500 mt-1">₹{insights.highestInvested.invested_amount.toLocaleString('en-IN')}</div>
                        </div>

                        <div className="bg-zinc-900/40 border border-green-500/20 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase mb-2">
                                <Trophy size={14} className="text-green-400" />
                                Best Performer
                            </div>
                            <div className="text-lg font-bold text-green-400 truncate">{insights.bestReturn.scheme_name}</div>
                            <div className="text-sm text-zinc-500 mt-1">+{insights.bestReturn.returns_percent.toFixed(2)}% return</div>
                        </div>

                        <div className="bg-zinc-900/40 border border-red-500/20 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase mb-2">
                                <TrendingDown size={14} className="text-red-400" />
                                Lagging Fund
                            </div>
                            <div className="text-lg font-bold text-red-400 truncate">{insights.worstReturn.scheme_name}</div>
                            <div className="text-sm text-zinc-500 mt-1">{insights.worstReturn.returns_percent.toFixed(2)}% return</div>
                        </div>

                        <div className="bg-zinc-900/40 border border-purple-500/20 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase mb-2">
                                <Target size={14} className="text-purple-400" />
                                Largest Holding
                            </div>
                            <div className="text-lg font-bold text-purple-400 truncate">{insights.largestValue.scheme_name}</div>
                            <div className="text-sm text-zinc-500 mt-1">Weightage: {((insights.largestValue.current_value / summary.current_value) * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Allocation Chart */}
                    <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 h-[400px]">
                        <h3 className="text-lg font-semibold text-white mb-4">Fund Allocation</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <PieChart>
                                <Pie
                                    data={positions.map(p => ({ name: p.scheme_name, value: p.current_value }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {positions.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Weightage List */}
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 overflow-y-auto scrollbar-hide">
                        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Weightage</h3>
                        <div className="space-y-4">
                            {positions.map((p, index) => (
                                <div key={p.position_id} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400 truncate max-w-[150px]">{p.scheme_name}</span>
                                        <span className="text-white font-medium">
                                            {((p.current_value / summary.current_value) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(p.current_value / summary.current_value) * 100}%`,
                                                backgroundColor: chartColors[index % chartColors.length]
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Fund-wise Performance Table */}
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden mb-8">
                    <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/50">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            Fund Performance
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-900/30">
                                <tr className="text-zinc-500 text-xs uppercase font-bold tracking-widest border-b border-zinc-800/50">
                                    <th className="px-6 py-4 text-left">Mutual Fund Scheme</th>
                                    <th className="px-6 py-4 text-right">Invested</th>
                                    <th className="px-6 py-4 text-right">Current Value</th>
                                    <th className="px-6 py-4 text-right">Returns</th>
                                    <th className="px-6 py-4 text-right">% Weight</th>
                                    <th className="px-6 py-4 text-right">NAV</th>
                                </tr>
                            </thead>
                            <tbody>
                                {positions.map((p) => (
                                    <tr key={p.position_id} className="border-b border-zinc-800/30 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white text-sm">{p.scheme_name}</div>
                                            <div className="text-[10px] text-zinc-500">{p.fund_house}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums text-sm">₹{p.invested_amount.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 text-right tabular-nums text-sm font-semibold">₹{p.current_value.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 text-right tabular-nums">
                                            <div className={`text-sm font-bold ${p.returns >= 0 ? 'text-green-400' : 'text-danger'}`}>
                                                {p.returns >= 0 ? '+' : ''}{p.returns_percent.toFixed(2)}%
                                            </div>
                                            <div className={`text-[10px] ${p.returns >= 0 ? 'text-green-500/50' : 'text-red-500/50'}`}>
                                                ₹{Math.abs(p.returns).toLocaleString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-blue-400 font-bold">
                                            {((p.current_value / summary.current_value) * 100).toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums text-zinc-400 text-xs">
                                            ₹{p.current_nav.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-center mb-8">
                    <Button onClick={() => router.push('/mf-portfolio')} variant="ghost" className="text-zinc-400 hover:text-white">
                        Back to Overview
                    </Button>
                </div>
            </div>
        </div>
    )
}
