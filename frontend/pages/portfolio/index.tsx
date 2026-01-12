import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import { positionsApi, OverallTransactionsResponse } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { usePortfolio } from '../../lib/portfolio-context';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Calendar, Loader2 } from 'lucide-react';

export default function OverallPortfolioPage() {
    const router = useRouter();
    const { userEmail, isLoading: isAuthLoading } = useAuth();
    const { currentPortfolio } = usePortfolio();
    const [data, setData] = useState<OverallTransactionsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthLoading && !userEmail) {
            router.push('/auth/login');
        } else if (userEmail && !currentPortfolio) {
            // If we have a user but no portfolio, redirect to select
            router.push('/select-portfolio');
        }
    }, [userEmail, currentPortfolio, router, isAuthLoading]);

    useEffect(() => {
        if (userEmail && currentPortfolio) {
            fetchOverallData();
        }
    }, [userEmail, currentPortfolio]);

    const fetchOverallData = async () => {
        if (!currentPortfolio) return;

        try {
            setLoading(true);
            setError(null);
            const response = await positionsApi.getOverallTransactions(currentPortfolio.portfolio_id);
            setData(response);
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const formatPercent = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A';
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    if (isAuthLoading || (loading && !data)) {
        return (
            <div className="flex h-screen bg-black text-white">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Loading Overall Portfolio</h2>
                            <p className="text-neutral-400 text-sm">Calculating comprehensive metrics and XIRR...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen bg-black text-white">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    <div className="p-8">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <p className="text-red-400">{error}</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex h-screen bg-black text-white">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                    <div className="p-8">
                        <div className="text-neutral-400">No data available</div>
                    </div>
                </main>
            </div>
        );
    }

    const isProfit = data.profit >= 0;
    const isProfitVsNifty = data.outperformance !== null && data.outperformance > 0;

    return (
        <div className="flex h-screen bg-black text-white">
            <Sidebar />

            <main className="flex-1 overflow-auto">
                <div className="p-6 max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="mb-6 flex items-start justify-between">
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Overall Portfolio</h1>
                                <p className="text-neutral-400">Comprehensive view of all your transactions and performance metrics</p>
                            </div>
                            <button
                                onClick={() => router.push('/portfolio/metrics')}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                                <BarChart3 className="w-4 h-4" />
                                View Risk Analysis
                            </button>
                        </div>
                    </div>

                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        {/* Total Invested */}
                        <div className="glass-strong rounded-xl p-5 border border-white/10 bg-white/5 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-neutral-400 text-xs uppercase tracking-wide">Total Invested</span>
                                <DollarSign className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="text-xl font-bold">{formatCurrency(data.total_invested)}</div>
                            <div className="text-xs text-neutral-500 mt-1">{data.transaction_count} transactions</div>
                        </div>

                        {/* Current Value */}
                        <div className="glass-strong rounded-xl p-5 border border-white/10 bg-white/5 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-neutral-400 text-xs uppercase tracking-wide">Current Value</span>
                                <BarChart3 className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="text-xl font-bold">{formatCurrency(data.current_value)}</div>
                            <div className={`text-xs mt-1 font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                {formatPercent(data.return_percent)}
                            </div>
                        </div>

                        {/* Profit/Loss */}
                        <div className={`glass-strong rounded-xl p-5 border bg-white/5 backdrop-blur-md ${isProfit ? 'border-green-500/30' : 'border-red-500/30'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-neutral-400 text-xs uppercase tracking-wide">Profit/Loss</span>
                                {isProfit ? (
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                )}
                            </div>
                            <div className={`text-xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(data.profit)}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">Absolute return</div>
                        </div>

                        {/* Portfolio XIRR */}
                        <div className="glass-strong rounded-xl p-5 border border-white/10 bg-white/5 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-neutral-400 text-xs uppercase tracking-wide">Portfolio XIRR</span>
                                <Activity className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className={`text-xl font-bold ${data.portfolio_xirr_percent !== null && data.portfolio_xirr_percent >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {data.portfolio_xirr_percent !== null
                                    ? formatPercent(data.portfolio_xirr_percent)
                                    : 'N/A'}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">Annualized return</div>
                        </div>

                        {/* vs Nifty 50 */}
                        {data.outperformance !== null && (
                            <div className={`glass-strong rounded-xl p-5 border bg-white/5 backdrop-blur-md ${isProfitVsNifty ? 'border-green-500/30' : 'border-red-500/30'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-neutral-400 text-xs uppercase tracking-wide">vs Nifty 50</span>
                                    {isProfitVsNifty ? (
                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4 text-red-400" />
                                    )}
                                </div>
                                <div className={`text-xl font-bold ${isProfitVsNifty ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatPercent(data.outperformance)}
                                </div>
                                <div className="text-xs text-neutral-400 mt-1">Outperformance</div>
                            </div>
                        )}
                    </div>

                    {/* MAIN COMPARISON SECTION */}
                    <div className="glass-strong rounded-xl p-8 mb-6 border border-white/10 bg-white/5 backdrop-blur-md">
                        <h2 className="text-2xl font-bold mb-6 text-center">Performance Comparison</h2>

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

                    {/* Bottom Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Holdings Breakdown */}
                        <div className="glass-strong rounded-xl p-6 border border-white/10 bg-white/5 backdrop-blur-md">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                Holdings Breakdown
                            </h2>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-black/50 backdrop-blur z-10">
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-2 text-neutral-400 font-medium text-sm">Symbol</th>
                                            <th className="text-right py-3 px-2 text-neutral-400 font-medium text-sm">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.symbol_breakdown.map((item, idx) => (
                                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-2 font-semibold">{item.symbol}</td>
                                                <td className="py-3 px-2 text-right text-neutral-300">{item.total_quantity?.toFixed(2) || '0.00'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="glass-strong rounded-xl p-6 border border-white/10 bg-white/5 backdrop-blur-md">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-green-400" />
                                Transaction History
                            </h2>
                            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                                {data.transactions.map((txn, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        <div className="flex-1">
                                            <div className="font-semibold text-white text-sm">{txn.symbol}</div>
                                            <div className="text-xs text-neutral-400">
                                                {new Date(txn.buy_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <div className="text-right mr-4">
                                            <div className="text-neutral-300 text-sm">{txn.quantity} shares</div>
                                            <div className="text-xs text-neutral-500">{formatCurrency(txn.invested_amount)}</div>
                                        </div>
                                        <div className="text-right min-w-[80px]">
                                            <div className="text-xs text-neutral-500">Nifty @ {txn.nifty_value?.toFixed(0) || '0'}</div>
                                            <div className="text-xs text-neutral-600">{txn.nifty_units_bought?.toFixed(3) || '0.000'} units</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
