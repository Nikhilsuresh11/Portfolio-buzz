import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { OverallTransactionsResponse } from '../../lib/types';
import { useAuth } from '../../lib/auth-context';
import { usePortfolio } from '../../lib/portfolio-context';
import { buildApiUrl, getApiHeaders } from '../../lib/api-helpers';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity } from 'lucide-react';
import { PageLoader } from '../../components/ui/page-loader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
    date: string;
    portfolio: number;
    nifty: number;
}

type TimePeriod = '1M' | '6M' | 'YTD' | '1Y' | '3Y' | '5Y' | 'ALL';

export default function OverallPortfolioPage() {
    const router = useRouter();
    const { userEmail, isLoading: isAuthLoading } = useAuth();
    const { currentPortfolio } = usePortfolio();
    const [data, setData] = useState<OverallTransactionsResponse | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [filteredChartData, setFilteredChartData] = useState<ChartDataPoint[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1Y');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthLoading && !userEmail) {
            router.push('/');
        } else if (userEmail && !currentPortfolio && !isAuthLoading) {
            router.push('/select-portfolio');
        }
    }, [userEmail, currentPortfolio, router, isAuthLoading]);

    useEffect(() => {
        if (userEmail && currentPortfolio) {
            fetchOverallData();
            fetchChartData();
        }
    }, [userEmail, currentPortfolio]);

    useEffect(() => {
        if (chartData.length > 0) {
            filterChartData(selectedPeriod);
        }
    }, [chartData, selectedPeriod]);

    const fetchOverallData = async () => {
        if (!currentPortfolio || !userEmail) return;

        try {
            setLoading(true);
            setError(null);

            const url = buildApiUrl(userEmail, `portfolio/overall-transactions?portfolio_id=${currentPortfolio.portfolio_id}`);
            const response = await fetch(url, {
                headers: getApiHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `API error: ${response.status}`);
            }

            const result = await response.json();
            setData(result);
        } catch (err: any) {
            console.error('Error fetching overall transactions:', err);
            if (err.message && err.message.includes("404")) {
                setError("No portfolio data found.");
            } else {
                setError(err.message || 'Failed to load data');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchChartData = async () => {
        if (!currentPortfolio || !userEmail) return;

        try {
            const url = buildApiUrl(userEmail, `portfolio/performance-chart?portfolio_id=${currentPortfolio.portfolio_id}`);
            const response = await fetch(url, {
                headers: getApiHeaders()
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setChartData(result.data);
                }
            }
        } catch (err) {
            console.error('Error fetching chart data:', err);
        }
    };

    const filterChartData = (period: TimePeriod) => {
        if (chartData.length === 0) return;

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '1M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case '6M':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case 'YTD':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case '1Y':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            case '3Y':
                startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
                break;
            case '5Y':
                startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
                break;
            case 'ALL':
                setFilteredChartData(chartData);
                return;
        }

        const filtered = chartData.filter(point => {
            const pointDate = new Date(point.date);
            return pointDate >= startDate;
        });

        setFilteredChartData(filtered);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatPercent = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A';
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    if (isAuthLoading || (loading && !data)) {
        return (
            <div className="flex items-center justify-center h-full">
                <PageLoader
                    messages={[
                        "Loading your portfolio...",
                        "Calculating comprehensive metrics...",
                        "Computing XIRR returns...",
                        "Comparing with Nifty 50...",
                        "Almost there..."
                    ]}
                    subtitle="Analyzing your investment performance"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8">
                <div className="text-neutral-400">No data available</div>
            </div>
        );
    }

    const isProfit = data.profit >= 0;
    const isProfitVsNifty = data.outperformance !== null && data.outperformance > 0;

    const timePeriods: TimePeriod[] = ['1M', '6M', 'YTD', '1Y', '3Y', '5Y', 'ALL'];

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black">
            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                        Overall Portfolio
                    </h1>
                    <p className="text-zinc-400">Comprehensive view of your investment performance and metrics</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full relative z-10" style={{ paddingTop: '0px' }}>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    {/* Total Invested */}
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5 hover:bg-zinc-900/60 hover:border-blue-500/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-400 text-xs uppercase tracking-wide">Total Invested</span>
                            <DollarSign className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-xl font-bold text-white">{formatCurrency(data.total_invested)}</div>
                        <div className="text-xs text-zinc-500 mt-1">{data.transaction_count} transactions</div>
                    </div>

                    {/* Current Value */}
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5 hover:bg-zinc-900/60 hover:border-blue-500/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-400 text-xs uppercase tracking-wide">Current Value</span>
                            <BarChart3 className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-xl font-bold text-white">{formatCurrency(data.current_value)}</div>
                        <div className={`text-xs mt-1 font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercent(data.return_percent)}
                        </div>
                    </div>

                    {/* Profit/Loss */}
                    <div className={`bg-zinc-900/40 border backdrop-blur-xl rounded-2xl p-5 hover:bg-zinc-900/60 transition-all ${isProfit ? 'border-green-500/30' : 'border-red-500/30'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-400 text-xs uppercase tracking-wide">Profit/Loss</span>
                            {isProfit ? (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                        </div>
                        <div className={`text-xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(data.profit)}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">Absolute return</div>
                    </div>

                    {/* Portfolio XIRR */}
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5 hover:bg-zinc-900/60 hover:border-blue-500/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-400 text-xs uppercase tracking-wide">Portfolio XIRR</span>
                            <Activity className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className={`text-xl font-bold ${data.portfolio_xirr_percent !== null && data.portfolio_xirr_percent >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {data.portfolio_xirr_percent !== null
                                ? formatPercent(data.portfolio_xirr_percent)
                                : 'N/A'}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">Annualized return</div>
                    </div>

                    {/* vs Nifty 50 */}
                    {data.outperformance !== null && (
                        <div className={`bg-zinc-900/40 border backdrop-blur-xl rounded-2xl p-5 hover:bg-zinc-900/60 transition-all ${isProfitVsNifty ? 'border-green-500/30' : 'border-red-500/30'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-zinc-400 text-xs uppercase tracking-wide">vs Nifty 50</span>
                                {isProfitVsNifty ? (
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                )}
                            </div>
                            <div className={`text-xl font-bold ${isProfitVsNifty ? 'text-green-400' : 'text-red-400'}`}>
                                {formatPercent(data.outperformance)}
                            </div>
                            <div className="text-xs text-zinc-400 mt-1">Outperformance</div>
                        </div>
                    )}
                </div>

                {/* Performance Comparison Section */}
                <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-8 mb-6">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white">Performance Comparison</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Your Portfolio */}
                        <div className="bg-white/[0.02] backdrop-sm border border-white/20 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                <div className="bg-blue-500/20 p-3 rounded-lg">
                                    <BarChart3 className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Your Portfolio</h3>
                                    <p className="text-xs text-neutral-400">Actual performance</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-neutral-400 text-sm">Invested Amount</span>
                                    <span className="font-semibold text-white">{formatCurrency(data.total_invested)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 bg-white/5 px-3 rounded-lg">
                                    <span className="text-neutral-400 text-sm">Current Value</span>
                                    <span className="font-bold text-lg text-white">{formatCurrency(data.current_value)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-neutral-400 text-sm">Profit/Loss</span>
                                    <span className={`font-bold text-lg ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(data.profit)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 bg-white/5 px-3 rounded-lg">
                                    <span className="text-neutral-400 text-sm">Simple Return</span>
                                    <span className={`font-semibold ${data.return_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatPercent(data.return_percent)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 mt-4 pt-4 border-t border-white/10">
                                    <span className="text-neutral-400 text-sm font-semibold">XIRR (Annualized)</span>
                                    <span className={`font-bold text-xl ${data.portfolio_xirr_percent !== null && data.portfolio_xirr_percent >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {data.portfolio_xirr_percent !== null
                                            ? formatPercent(data.portfolio_xirr_percent)
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Nifty 50 */}
                        <div className="bg-white/[0.02] backdrop-sm border border-white/20 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                <div className="bg-green-500/20 p-3 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Nifty 50</h3>
                                    <p className="text-xs text-neutral-400">Benchmark index</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-neutral-400 text-sm">Invested Amount</span>
                                    <span className="font-semibold text-white">{formatCurrency(data.total_invested)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 bg-white/5 px-3 rounded-lg">
                                    <span className="text-neutral-400 text-sm">Current Value</span>
                                    <span className="font-bold text-lg text-white">{formatCurrency(data.nifty.current_value)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-neutral-400 text-sm">Profit/Loss</span>
                                    <span className={`font-bold text-lg ${data.nifty.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(data.nifty.profit)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 bg-white/5 px-3 rounded-lg">
                                    <span className="text-neutral-400 text-sm">Simple Return</span>
                                    <span className={`font-semibold ${data.nifty.return_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatPercent(data.nifty.return_percent)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 mt-4 pt-4 border-t border-white/10">
                                    <span className="text-neutral-400 text-sm font-semibold">XIRR (Annualized)</span>
                                    <span className={`font-bold text-xl ${data.nifty.xirr_percent !== null && data.nifty.xirr_percent >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {data.nifty.xirr_percent !== null
                                            ? formatPercent(data.nifty.xirr_percent)
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-500 text-xs">Equivalent Units Held</span>
                                    <span className="font-semibold text-neutral-300 text-sm">
                                        {data.nifty?.total_units?.toFixed(4) || '0.0000'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-6 mb-6 min-h-[480px]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Historical Performance</h2>
                        <div className="flex gap-2">
                            {timePeriods.map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedPeriod === period
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                        }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[400px] w-full">
                        {filteredChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={filteredChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#71717a"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={formatDate}
                                    />
                                    <YAxis
                                        stroke="#71717a"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => formatCurrency(value)}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#18181b',
                                            borderColor: '#27272a',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                        labelFormatter={(label) => formatDate(label)}
                                        formatter={(value: any) => [formatCurrency(value), '']}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: '14px' }}
                                        iconType="line"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="portfolio"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={false}
                                        name="Your Portfolio"
                                        activeDot={{ r: 6, fill: "#3b82f6" }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="nifty"
                                        stroke="#71717a"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        name="Nifty 50"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
                                <Activity className="w-12 h-12 opacity-10" />
                                <p>{chartData.length === 0 ? "Loading performance data..." : "No data points available for this period"}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
        </div>
    );
}
