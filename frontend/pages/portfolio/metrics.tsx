import { useState, useEffect } from 'react'
import Head from 'next/head'
import { buildApiUrl, getApiHeaders } from '../../lib/api-helpers'
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    LineChart, Line, CartesianGrid, ReferenceLine
} from 'recharts'
import {
    Activity, TrendingUp, TrendingDown, Shield, AlertTriangle,
    PieChart as PieIcon, BarChart3, Info, Zap, Layers, RefreshCw
} from 'lucide-react'
import { usePortfolio } from '../../lib/portfolio-context'
import Header from '../../components/Header'
import { useAuth } from '../../lib/auth-context'

// Interfaces
interface AnalysisData {
    portfolio_health: {
        beta: number;
        sharpe_ratio: number;
        diversification_score: number;
        var_95: string;
        max_drawdown: string;
        volatility: string;
    };
    market_indicators: {
        nifty_rsi: number;
        fear_greed_index: number;
        market_sentiment: string;
    };
    sector_allocation: {
        name: string;
        value: number;
        count: number;
    }[];
    assets: {
        ticker: string;
        beta: number;
        sharpe: number;
        sector: string;
    }[];
    performance_chart: {
        date: string;
        Portfolio: number;
        Nifty50: number;
    }[];
    technical_signals: {
        ticker: string;
        signal: string;
        type: 'success' | 'warning' | 'danger';
        value: number;
    }[];
    correlation_matrix: {
        x: string;
        y: string;
        value: number;
    }[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

// Metric Card Component with Info Tooltip
function MetricCard({
    title, value, subValue, subLabel, icon: Icon, colorClass, infoText, progress
}: {
    title: string, value: string | number, subValue?: string | number, subLabel?: string,
    icon: any, colorClass: string, infoText: string, progress?: number
}) {
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/[0.07] transition-colors group relative">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-400 font-medium">{title}</p>
                        <div
                            onMouseEnter={() => setShowInfo(true)}
                            onMouseLeave={() => setShowInfo(false)}
                            className="text-gray-500 hover:text-gray-300 transition-colors cursor-help"
                        >
                            <Info size={14} />
                        </div>
                    </div>
                    {showInfo && (
                        <div className="absolute top-10 left-4 right-4 z-20 bg-gray-800 text-xs text-gray-200 p-3 rounded-lg border border-gray-700 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                            {infoText}
                        </div>
                    )}
                    <h3 className="text-3xl font-bold text-white mt-1 group-hover:scale-105 transition-transform origin-left">
                        {value}
                    </h3>
                </div>
                <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon size={20} />
                </div>
            </div>

            {progress !== undefined ? (
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            ) : (
                <p className="text-xs text-gray-500">
                    {subValue} <span className="text-gray-500">{subLabel}</span>
                </p>
            )}
        </div>
    );
}

export default function Analytics() {
    const { currentPortfolio } = usePortfolio()
    const { userEmail } = useAuth()
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentPortfolio && userEmail) {
            fetchAnalytics();
        }
    }, [currentPortfolio, userEmail]);

    const fetchAnalytics = async () => {
        if (!currentPortfolio || !userEmail) return;

        setLoading(true);
        setError('');
        try {
            const url = buildApiUrl(userEmail, `analysis/portfolio?portfolio_id=${currentPortfolio.portfolio_id}`);

            const res = await fetch(url, {
                headers: getApiHeaders()
            });

            const json = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                setError(json.message || 'Failed to fetch analytics');
            }
        } catch (err) {
            setError('Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (score: number) => {
        if (score >= 75) return 'text-green-500';
        if (score >= 55) return 'text-green-400';
        if (score >= 45) return 'text-gray-400';
        if (score >= 25) return 'text-orange-500';
        return 'text-red-500';
    };

    if (loading && !data) {
        return (
            <div className="flex-1 overflow-auto flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-full flex flex-col relative z-10">
            <Head>
                <title>Portfolio Metrics | Portfolio Buzz</title>
            </Head>

            <Header user={userEmail} />

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pt-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Portfolio Risk Analysis</h2>
                    <p className="text-sm text-gray-400">Based on your current positions in <span className="text-blue-400">{currentPortfolio?.portfolio_name}</span></p>
                </div>

                <button
                    onClick={fetchAnalytics}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors flex items-center gap-2"
                    title="Refresh analysis"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    <span className="text-sm">Refresh Data</span>
                </button>
            </div>

            {error ? (
                <div className="text-center text-red-500 p-10 bg-white/5 rounded-xl border border-red-500/20">
                    <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
                    {error}
                </div>
            ) : data ? (
                <div className="space-y-8 pb-10">
                    {/* TOP ROW: Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="Diversification"
                            value={`${data.portfolio_health.diversification_score}/100`}
                            icon={Shield}
                            colorClass="bg-blue-500/20 text-blue-400"
                            infoText="A score based on how correlated your assets are. Higher is better (less risky)."
                            progress={data.portfolio_health.diversification_score}
                        />

                        <MetricCard
                            title="Portfolio Beta"
                            value={data.portfolio_health.beta}
                            icon={Activity}
                            colorClass={data.portfolio_health.beta > 1.2 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}
                            infoText="Measures volatility vs market (1.0). High (>1) means aggressive, Low (<1) means defensive."
                            subValue="vs NIFTY 50"
                            subLabel="(1.0)"
                        />

                        <MetricCard
                            title="Sharpe Ratio"
                            value={data.portfolio_health.sharpe_ratio}
                            icon={TrendingUp}
                            colorClass="bg-purple-500/20 text-purple-400"
                            infoText="Returns generated per unit of risk taken. Values > 1.0 are considered good."
                            subValue="Risk-Adjusted"
                            subLabel="Return"
                        />

                        <MetricCard
                            title="VaR (95%)"
                            value={data.portfolio_health.var_95}
                            icon={AlertTriangle}
                            colorClass="bg-orange-500/20 text-orange-400"
                            infoText="Maximum expected loss on a bad day (with 95% confidence)."
                            subValue="Max Drawdown:"
                            subLabel={data.portfolio_health.max_drawdown}
                        />
                    </div>

                    {/* SECOND ROW: Performance Chart & Sentiment */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="text-green-400" size={20} /> Performance vs NIFTY 50
                                </h2>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                        <span className="text-xs text-gray-400">Portfolio</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                                        <span className="text-xs text-gray-400">NIFTY 50</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.performance_chart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#666"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            stroke="#666"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                            itemStyle={{ fontSize: 13 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="Portfolio"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6, fill: "#3b82f6" }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="Nifty50"
                                            stroke="#71717a"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col gap-6">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                    <BarChart3 className="text-purple-400" size={20} /> Market Sentiment
                                </h2>
                                <div className="flex-1 flex flex-col items-center justify-center relative mb-4 bg-black/30 p-4 rounded-xl border border-white/5">
                                    <div className="w-40 h-20 overflow-hidden relative mb-2">
                                        <div className="absolute top-0 left-0 w-full h-full bg-gray-800 rounded-t-full"></div>
                                        <div
                                            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-t-full origin-bottom transition-transform duration-1000 ease-out"
                                            style={{
                                                clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 0)',
                                                transform: `rotate(${(data.market_indicators.fear_greed_index / 100) * 180 - 180}deg)`
                                            }}
                                        ></div>
                                    </div>
                                    <div className={`text-2xl font-bold ${getSentimentColor(data.market_indicators.fear_greed_index)}`}>
                                        {data.market_indicators.fear_greed_index}
                                    </div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wider">Fear & Greed</div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                    <Zap className="text-yellow-400" size={20} /> Technical Alerts
                                </h2>
                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {data.technical_signals && data.technical_signals.length > 0 ? (
                                        data.technical_signals.map((signal, idx) => (
                                            <div key={idx} className="bg-black/30 p-3 rounded-lg border border-white/5 flex items-start gap-3">
                                                <div className={`w-1.5 self-stretch rounded-full ${signal.type === 'warning' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{signal.ticker}</div>
                                                    <div className="text-xs text-gray-400">{signal.signal}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 text-sm py-4">No active signals</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* THIRD ROW: Sector & Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                                <PieIcon className="text-blue-400" size={20} /> Sector Allocation
                            </h2>
                            <div className="h-[300px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.sector_allocation}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {data.sector_allocation.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: any) => `${Number(value).toFixed(1)}%`}
                                        />
                                        <Legend
                                            layout="vertical"
                                            verticalAlign="middle"
                                            align="right"
                                            wrapperStyle={{ fontSize: '12px' }}
                                            content={({ payload }) => (
                                                <ul className="space-y-2 pl-4">
                                                    {payload?.map((entry: any, index: number) => (
                                                        <li key={`item-${index}`} className="flex items-center gap-3">
                                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                                                            <span className="text-gray-300 truncate max-w-[120px]" title={entry.value}>{entry.value}</span>
                                                            <span className="text-gray-500 ml-auto font-mono text-xs">
                                                                {data.sector_allocation[index]?.value || 0}%
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[380px]">
                            <div className="p-6 border-b border-white/10">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Layers className="text-gray-400" size={20} /> Asset Risk Profile
                                </h2>
                            </div>
                            <div className="overflow-x-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-black/40 text-gray-400 border-b border-white/5">
                                            <th className="px-6 py-3 font-medium">Ticker</th>
                                            <th className="px-6 py-3 font-medium">Beta</th>
                                            <th className="px-6 py-3 font-medium">Sharpe</th>
                                            <th className="px-6 py-3 font-medium">Risk Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {data.assets.map((asset) => (
                                            <tr key={asset.ticker} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-3 font-semibold text-white">{asset.ticker}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`font-medium ${asset.beta > 1.2 ? 'text-orange-400' : 'text-blue-400'}`}>
                                                        {asset.beta.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`font-medium ${asset.sharpe > 1 ? 'text-green-400' : asset.sharpe > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                        {asset.sharpe.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-gray-400 text-xs">
                                                    {asset.beta < 0.5 ? 'Defensive' : asset.beta > 1.2 ? 'Aggressive' : 'Moderate'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
