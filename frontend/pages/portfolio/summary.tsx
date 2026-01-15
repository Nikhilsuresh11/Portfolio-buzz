import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { usePortfolio } from '../../lib/portfolio-context';
import { buildApiUrl, getApiHeaders } from '../../lib/api-helpers';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity, ArrowUpDown, ArrowUp, ArrowDown, Trophy, Target } from 'lucide-react';
import { PageLoader } from '../../components/ui/page-loader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type SortField = 'symbol' | 'quantity' | 'avg_price' | 'invested_amount' | 'current_value' | 'profit' | 'return_percent' | 'allocation_percent';
type SortDirection = 'asc' | 'desc';

export default function PortfolioSummaryPage() {
    const router = useRouter();
    const { userEmail } = useAuth();
    const { currentPortfolio } = usePortfolio();
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('allocation_percent');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    useEffect(() => {
        if (userEmail && currentPortfolio) {
            fetchSummary();
        }
    }, [userEmail, currentPortfolio]);

    const fetchSummary = async () => {
        if (!currentPortfolio || !userEmail) return;

        try {
            setLoading(true);
            setError(null);

            const url = buildApiUrl(userEmail, `portfolio/summary?portfolio_id=${currentPortfolio.portfolio_id || 'default'}`);
            const response = await fetch(url, {
                headers: getApiHeaders()
            });
            const resData = await response.json();
            setData(resData);
        } catch (err: any) {
            console.error('Error fetching summary:', err);
            setError(err.message || 'Failed to load summary');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatPercent = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A';
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedAllocations = useMemo(() => {
        if (!data?.symbol_allocations) return [];

        const sorted = [...data.symbol_allocations].sort((a, b) => {
            let aVal, bVal;

            switch (sortField) {
                case 'symbol':
                    aVal = a.symbol;
                    bVal = b.symbol;
                    return sortDirection === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                case 'avg_price':
                    aVal = a.invested_amount / a.quantity;
                    bVal = b.invested_amount / b.quantity;
                    break;
                default:
                    aVal = a[sortField];
                    bVal = b[sortField];
            }

            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return sorted;
    }, [data?.symbol_allocations, sortField, sortDirection]);

    const insights = useMemo(() => {
        if (!data?.symbol_allocations || data.symbol_allocations.length === 0) return null;

        const allocations = data.symbol_allocations;

        // Highest invested
        const highestInvested = allocations.reduce((max: any, item: any) =>
            item.invested_amount > max.invested_amount ? item : max
        );

        // Best return percentage
        const bestReturn = allocations.reduce((max: any, item: any) =>
            item.return_percent > max.return_percent ? item : max
        );

        // Worst return percentage
        const worstReturn = allocations.reduce((min: any, item: any) =>
            item.return_percent < min.return_percent ? item : min
        );

        // Smallest allocation
        const smallestAllocation = allocations.reduce((min: any, item: any) =>
            item.allocation_percent < min.allocation_percent ? item : min
        );

        return {
            highestInvested,
            bestReturn,
            worstReturn,
            smallestAllocation
        };
    }, [data?.symbol_allocations]);

    if (loading && !data) {
        return (
            <div className="flex-1 overflow-auto flex items-center justify-center min-h-screen">
                <PageLoader
                    messages={[
                        "Loading portfolio summary...",
                        "Fetching your holdings...",
                        "Calculating allocations...",
                        "Almost ready..."
                    ]}
                    subtitle="Preparing your portfolio breakdown"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="text-red-400">{error}</div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                        Portfolio Summary
                    </h1>
                    <p className="text-neutral-400">Detailed breakdown of your current holdings</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                    <button
                        onClick={() => router.push('/portfolio/metrics')}
                        className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-9 px-5 rounded-[11px] flex items-center transition-colors"
                    >
                        <BarChart3 size={16} />
                        View Risk Analysis
                    </button>
                </div>
            </div>

            {/* Insights Cards */}
            {insights && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase mb-2">
                            <DollarSign className="w-4 h-4" />
                            Highest Invested
                        </div>
                        <div className="text-xl font-bold text-white">{insights.highestInvested.symbol}</div>
                        <div className="text-sm text-green-400 mt-1">{formatPercent(insights.highestInvested.return_percent)}</div>
                    </div>

                    <div className="bg-zinc-900/40 border border-green-500/30 backdrop-blur-xl rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase mb-2">
                            <Trophy className="w-4 h-4 text-green-400" />
                            Best Return
                        </div>
                        <div className="text-xl font-bold text-green-400">{insights.bestReturn.symbol}</div>
                        <div className="text-sm text-zinc-400 mt-1">{formatPercent(insights.bestReturn.return_percent)}</div>
                    </div>

                    <div className="bg-zinc-900/40 border border-red-500/30 backdrop-blur-xl rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase mb-2">
                            <TrendingDown className="w-4 h-4 text-red-400" />
                            Worst Return
                        </div>
                        <div className="text-xl font-bold text-red-400">{insights.worstReturn.symbol}</div>
                        <div className="text-sm text-zinc-400 mt-1">{formatPercent(insights.worstReturn.return_percent)}</div>
                    </div>

                    <div className="bg-zinc-900/40 border border-yellow-500/30 backdrop-blur-xl rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase mb-2">
                            <Target className="w-4 h-4 text-yellow-400" />
                            Smallest Holding
                        </div>
                        <div className="text-xl font-bold text-yellow-400">{insights.smallestAllocation.symbol}</div>
                        <div className="text-sm text-zinc-400 mt-1">{insights.smallestAllocation.allocation_percent.toFixed(2)}%</div>
                    </div>
                </div>
            )}

            {/* Positions Table */}
            <div className="glass-strong bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Positions
                </h3>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-neutral-400 text-xs uppercase font-medium">
                            <tr>
                                <th
                                    className="p-3 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleSort('symbol')}
                                >
                                    Symbol
                                </th>
                                <th
                                    className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleSort('quantity')}
                                >
                                    Quantity
                                </th>
                                <th
                                    className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleSort('avg_price')}
                                >
                                    Avg Price
                                </th>
                                <th
                                    className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleSort('invested_amount')}
                                >
                                    Invested
                                </th>
                                <th
                                    className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleSort('current_value')}
                                >
                                    Current
                                </th>
                                <th
                                    className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleSort('profit')}
                                >
                                    P/L
                                </th>
                                <th
                                    className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleSort('return_percent')}
                                >
                                    Return %
                                </th>
                                <th
                                    className="p-3 text-right cursor-pointer hover:text-white transition-colors"
                                    onClick={() => handleSort('allocation_percent')}
                                >
                                    Allocation %
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedAllocations.map((pos: any, idx: number) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-semibold">{pos.symbol}</td>
                                    <td className="p-3 text-right text-neutral-300">{pos.quantity.toFixed(2)}</td>
                                    <td className="p-3 text-right text-neutral-300">
                                        {formatCurrency(pos.invested_amount / pos.quantity)}
                                    </td>
                                    <td className="p-3 text-right text-neutral-300">
                                        {formatCurrency(pos.invested_amount)}
                                    </td>
                                    <td className="p-3 text-right text-white">
                                        {formatCurrency(pos.current_value)}
                                    </td>
                                    <td className={`p-3 text-right ${pos.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(pos.profit)}
                                    </td>
                                    <td className={`p-3 text-right ${pos.return_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatPercent(pos.return_percent)}
                                    </td>
                                    <td className="p-3 text-right text-blue-400">
                                        {pos.allocation_percent.toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Allocation Chart */}
            <div className="glass-strong bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-400" />
                    Portfolio Allocation
                </h3>
                {data.symbol_allocations && data.symbol_allocations.length > 0 ? (
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.symbol_allocations}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis
                                    dataKey="symbol"
                                    stroke="#71717a"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis
                                    stroke="#71717a"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        borderColor: '#27272a',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'Allocation']}
                                />
                                <Bar
                                    dataKey="allocation_percent"
                                    fill="#3b82f6"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[400px] flex items-center justify-center text-zinc-500">
                        <p>No allocation data available</p>
                    </div>
                )}
            </div>
        </div>
    );
}
