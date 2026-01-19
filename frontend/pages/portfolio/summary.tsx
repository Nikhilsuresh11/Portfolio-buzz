import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { usePortfolio } from '../../lib/portfolio-context';
import { buildApiUrl, getApiHeaders } from '../../lib/api-helpers';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity, ArrowUpDown, ArrowUp, ArrowDown, Trophy, Target } from 'lucide-react';
import { PageLoader } from '../../components/ui/page-loader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type SortField = 'symbol' | 'quantity' | 'avg_price' | 'invested_amount' | 'current_value' | 'profit' | 'return_percent' | 'allocation_percent' | 'day_change' | 'day_change_percent';
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

        // Best daily performer (%)
        const bestDailyPct = allocations.reduce((max: any, item: any) =>
            item.day_change_percent > max.day_change_percent ? item : max
        );

        // Worst daily performer (%)
        const worstDailyPct = allocations.reduce((min: any, item: any) =>
            item.day_change_percent < min.day_change_percent ? item : min
        );

        // Best daily performer (Rupee)
        const bestDailyRupee = allocations.reduce((max: any, item: any) =>
            item.day_change > max.day_change ? item : max
        );

        // Worst daily performer (Rupee)
        const worstDailyRupee = allocations.reduce((min: any, item: any) =>
            item.day_change < min.day_change ? item : min
        );

        return {
            bestDailyPct,
            worstDailyPct,
            bestDailyRupee,
            worstDailyRupee
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
        <div className="flex flex-col h-screen relative overflow-hidden bg-black">
            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
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
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full">

                {/* Insights Cards */}
                {insights && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        {/* Overall Today G/L */}
                        <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase mb-2 font-medium tracking-wider">
                                <Activity className="w-3.5 h-3.5 text-blue-400" />
                                Today's G/L
                            </div>
                            <div className={`text-lg font-bold ${data.total_day_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(data.total_day_change)}
                            </div>
                            <div className={`text-[10px] mt-1 font-medium ${data.total_day_change >= 0 ? 'text-green-500/80' : 'text-red-500/80'}`}>
                                {formatPercent(data.total_day_change_percent)} today
                            </div>
                        </div>

                        {/* Best Pct */}
                        <div className="bg-zinc-900/40 border border-green-500/10 backdrop-blur-xl rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase mb-2 font-medium tracking-wider">
                                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                                Best Performance %
                            </div>
                            <div className="text-lg font-bold text-white truncate">{insights.bestDailyPct.symbol}</div>
                            <div className="text-xs text-green-400 mt-1">{formatPercent(insights.bestDailyPct.day_change_percent)}</div>
                        </div>

                        {/* Worst Pct */}
                        <div className="bg-zinc-900/40 border border-red-500/10 backdrop-blur-xl rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase mb-2 font-medium tracking-wider">
                                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                                Worst Performance %
                            </div>
                            <div className="text-lg font-bold text-white truncate">{insights.worstDailyPct.symbol}</div>
                            <div className="text-xs text-red-400 mt-1">{formatPercent(insights.worstDailyPct.day_change_percent)}</div>
                        </div>

                        {/* Best Rupee */}
                        <div className="bg-zinc-900/40 border border-emerald-500/10 backdrop-blur-xl rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase mb-2 font-medium tracking-wider">
                                <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                                Top Gainer (₹)
                            </div>
                            <div className="text-lg font-bold text-white truncate">{insights.bestDailyRupee.symbol}</div>
                            <div className="text-xs text-emerald-400 mt-1">+{formatCurrency(insights.bestDailyRupee.day_change)}</div>
                        </div>

                        {/* Worst Rupee */}
                        <div className="bg-zinc-900/40 border border-amber-500/10 backdrop-blur-xl rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase mb-2 font-medium tracking-wider">
                                <ArrowDown className="w-3.5 h-3.5 text-red-400" />
                                Top Loser (₹)
                            </div>
                            <div className="text-lg font-bold text-white truncate">{insights.worstDailyRupee.symbol}</div>
                            <div className="text-xs text-red-400 mt-1">{formatCurrency(insights.worstDailyRupee.day_change)}</div>
                        </div>
                    </div>
                )}

                {/* Positions Table */}
                <div className="bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col h-[600px] mb-6">
                    <div className="p-4 border-b border-white/10 bg-zinc-900/50">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            Positions
                        </h3>
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Sticky Header */}
                        <table className="w-full border-collapse text-left table-fixed">
                            <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm">
                                <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <th
                                        className="px-4 py-3 bg-transparent text-left cursor-pointer hover:text-white transition-colors w-[180px]"
                                        onClick={() => handleSort('symbol')}
                                    >
                                        Symbol
                                    </th>
                                    <th
                                        className="px-3 py-3 bg-transparent text-right cursor-pointer hover:text-white transition-colors w-[110px]"
                                        onClick={() => handleSort('quantity')}
                                    >
                                        Quantity
                                    </th>
                                    <th
                                        className="px-3 py-3 bg-transparent text-right cursor-pointer hover:text-white transition-colors w-[110px]"
                                        onClick={() => handleSort('avg_price')}
                                    >
                                        Avg Price
                                    </th>
                                    <th
                                        className="px-3 py-3 bg-transparent text-right cursor-pointer hover:text-white transition-colors w-[130px]"
                                        onClick={() => handleSort('invested_amount')}
                                    >
                                        Invested
                                    </th>
                                    <th
                                        className="px-3 py-3 bg-transparent text-right cursor-pointer hover:text-white transition-colors w-[130px]"
                                        onClick={() => handleSort('current_value')}
                                    >
                                        Current
                                    </th>
                                    <th
                                        className="px-3 py-3 bg-transparent text-right cursor-pointer hover:text-white transition-colors w-[120px]"
                                        onClick={() => handleSort('day_change')}
                                    >
                                        Day G/L
                                    </th>
                                    <th
                                        className="px-3 py-3 bg-transparent text-right cursor-pointer hover:text-white transition-colors w-[110px]"
                                        onClick={() => handleSort('profit')}
                                    >
                                        Total G/L
                                    </th>
                                    <th
                                        className="px-3 py-3 bg-transparent text-right cursor-pointer hover:text-white transition-colors w-[100px]"
                                        onClick={() => handleSort('return_percent')}
                                    >
                                        Return %
                                    </th>
                                    <th
                                        className="px-3 py-3 bg-transparent text-right pr-4 cursor-pointer hover:text-white transition-colors w-[110px]"
                                        onClick={() => handleSort('allocation_percent')}
                                    >
                                        Allocation
                                    </th>
                                </tr>
                            </thead>
                        </table>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            <table className="w-full border-collapse text-left table-fixed">
                                <tbody className="divide-y divide-white/5">
                                    {sortedAllocations.map((pos: any, idx: number) => {
                                        const tickerPrefix = pos.symbol.substring(0, 2).toUpperCase();
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
                                        const isPositive = pos.profit >= 0;

                                        return (
                                            <tr key={idx} className="group cursor-pointer transition-colors duration-200 hover:bg-white/5">
                                                {/* Symbol Column */}
                                                <td className="px-4 py-4 w-[180px]">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`
                                                        w-10 h-10 rounded-lg flex items-center justify-center 
                                                        text-white font-bold text-sm shadow-md
                                                        ${getRandomColor(pos.symbol)}
                                                    `}>
                                                            {tickerPrefix}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-bold text-gray-100 text-sm">{pos.symbol}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Quantity */}
                                                <td className="px-3 py-4 text-right font-semibold text-sm text-gray-200 tabular-nums w-[110px]">
                                                    {pos.quantity.toFixed(2)}
                                                </td>

                                                {/* Avg Price */}
                                                <td className="px-3 py-4 text-right text-sm text-gray-300 tabular-nums w-[110px]">
                                                    {formatCurrency(pos.invested_amount / pos.quantity)}
                                                </td>

                                                {/* Invested */}
                                                <td className="px-3 py-4 text-right text-sm text-gray-300 tabular-nums w-[130px]">
                                                    {formatCurrency(pos.invested_amount)}
                                                </td>

                                                {/* Current Value */}
                                                <td className="px-3 py-4 text-right font-bold text-[15px] text-gray-200 tabular-nums w-[130px]">
                                                    {formatCurrency(pos.current_value)}
                                                </td>

                                                {/* Day G/L */}
                                                <td className="px-3 py-4 text-right w-[120px]">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-sm font-semibold ${pos.day_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            {formatCurrency(pos.day_change)}
                                                        </span>
                                                        <span className={`text-[10px] ${pos.day_change >= 0 ? 'text-green-500/80' : 'text-red-500/80'}`}>
                                                            {formatPercent(pos.day_change_percent)}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Total G/L */}
                                                <td className="px-3 py-4 text-right w-[110px]">
                                                    <div className={`
                                                    inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold
                                                    ${isPositive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}
                                                `}>
                                                        {formatCurrency(pos.profit)}
                                                    </div>
                                                </td>

                                                {/* Return % */}
                                                <td className={`px-3 py-4 text-right text-sm font-semibold w-[100px] ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                    {formatPercent(pos.return_percent)}
                                                </td>

                                                {/* Allocation */}
                                                <td className="px-3 py-4 text-right pr-4 w-[110px]">
                                                    <span className="text-blue-400 font-semibold text-sm">
                                                        {pos.allocation_percent.toFixed(2)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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

            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
        </div>
    );
}
