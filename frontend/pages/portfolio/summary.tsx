import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth-context';
import { usePortfolio } from '../../lib/portfolio-context';
import { buildApiUrl, getApiHeaders } from '../../lib/api-helpers';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Activity, Loader2 } from 'lucide-react';

export default function PortfolioSummaryPage() {
    const router = useRouter();
    const { userEmail } = useAuth();
    const { currentPortfolio } = usePortfolio();
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        }).format(value);
    };

    const formatPercent = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A';
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    if (loading && !data) {
        return (
            <div className="flex-1 overflow-auto flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
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

    const isProfit = data.total_profit >= 0;

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Portfolio Summary</h1>
                    <p className="text-neutral-400">Detailed breakdown of your current holdings</p>
                </div>
                <button
                    onClick={() => router.push('/portfolio/metrics')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                    <BarChart3 className="w-4 h-4" />
                    View Risk Analysis
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="glass-strong bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="text-neutral-400 text-xs uppercase mb-2">Total Invested</div>
                    <div className="text-2xl font-bold">{formatCurrency(data.total_invested)}</div>
                </div>
                <div className="glass-strong bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="text-neutral-400 text-xs uppercase mb-2">Current Value</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(data.total_current_value)}</div>
                </div>
                <div className="glass-strong bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="text-neutral-400 text-xs uppercase mb-2">Profit/Loss</div>
                    <div className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(data.total_profit)}
                    </div>
                </div>
                <div className="glass-strong bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="text-neutral-400 text-xs uppercase mb-2">Return</div>
                    <div className={`text-2xl font-bold ${data.return_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(data.return_percent)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Allocation */}
                <div className="glass-strong bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-purple-400" />
                        Allocation
                    </h3>
                    <div className="space-y-3 custom-scrollbar max-h-[400px] overflow-y-auto">
                        {data.symbol_allocations.map((item: any, idx: number) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-semibold">{item.symbol}</span>
                                    <span>{item.allocation_percent.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500"
                                        style={{ width: `${item.allocation_percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Positions Table */}
                <div className="lg:col-span-2 glass-strong bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        Positions
                    </h3>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-neutral-400 text-xs uppercase font-medium">
                                <tr>
                                    <th className="p-3">Symbol</th>
                                    <th className="p-3 text-right">Qty</th>
                                    <th className="p-3 text-right">Avg Price</th>
                                    <th className="p-3 text-right">Invested</th>
                                    <th className="p-3 text-right">Current</th>
                                    <th className="p-3 text-right">P/L</th>
                                    <th className="p-3 text-right">Ret %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.symbol_allocations.map((pos: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 font-semibold">{pos.symbol}</td>
                                        <td className="p-3 text-right text-neutral-300">{pos.quantity.toFixed(2)}</td>
                                        <td className="p-3 text-right text-neutral-300">
                                            {(pos.invested_amount / pos.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3 text-right text-neutral-300">
                                            {(pos.invested_amount / 1000).toFixed(1)}k
                                        </td>
                                        <td className="p-3 text-right text-white">
                                            {(pos.current_value / 1000).toFixed(1)}k
                                        </td>
                                        <td className={`p-3 text-right ${pos.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {(pos.profit / 1000).toFixed(1)}k
                                        </td>
                                        <td className={`p-3 text-right ${pos.return_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatPercent(pos.return_percent)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
