import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import { usePortfolio } from '../lib/portfolio-context';
import { buildApiUrl, getApiHeaders } from '../lib/api-helpers';
import { Plus, Trash2, Edit2, Loader2, TrendingUp, Calendar, DollarSign, Hash, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Position {
    position_id: string;
    symbol: string;
    quantity: number;
    buy_date: string;
    invested_amount: number;
    nifty_value: number;
    portfolio_id: string;
    portfolio_name: string;
    created_at: string;
}

interface GroupedPosition {
    symbol: string;
    totalQuantity: number;
    totalInvested: number;
    avgPrice: number;
    transactionCount: number;
    transactions: Position[];
}

export default function MyPositionsPage() {
    const router = useRouter();
    const { userEmail, isLoading: isAuthLoading } = useAuth();
    const { currentPortfolio } = usePortfolio();
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        symbol: '',
        quantity: '',
        buy_date: '',
        invested_amount: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthLoading && !userEmail) {
            router.push('/');
        } else if (userEmail && !currentPortfolio && !isAuthLoading) {
            router.push('/select-portfolio');
        } else if (userEmail && currentPortfolio) {
            fetchPositions();
        }
    }, [userEmail, currentPortfolio, isAuthLoading, router]);

    const fetchPositions = async () => {
        if (!currentPortfolio || !userEmail) return;

        try {
            setLoading(true);
            const query = `?portfolio_id=${currentPortfolio.portfolio_id || 'default'}`;
            const url = buildApiUrl(userEmail, `portfolio/positions${query}`);
            const response = await fetch(url, {
                headers: getApiHeaders()
            });
            const data = await response.json();
            setPositions(data.positions || []);
        } catch (error) {
            console.error('Error fetching positions:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupedPositions = useMemo(() => {
        const groups: Record<string, GroupedPosition> = {};

        positions.forEach(pos => {
            if (!groups[pos.symbol]) {
                groups[pos.symbol] = {
                    symbol: pos.symbol,
                    totalQuantity: 0,
                    totalInvested: 0,
                    avgPrice: 0,
                    transactionCount: 0,
                    transactions: []
                };
            }

            groups[pos.symbol].totalQuantity += pos.quantity;
            groups[pos.symbol].totalInvested += pos.invested_amount;
            groups[pos.symbol].transactionCount += 1;
            groups[pos.symbol].transactions.push(pos);
        });

        Object.values(groups).forEach(group => {
            group.avgPrice = group.totalInvested / group.totalQuantity;
            // Sort transactions by date descending
            group.transactions.sort((a, b) => new Date(b.buy_date).getTime() - new Date(a.buy_date).getTime());
        });

        return Object.values(groups).sort((a, b) => b.totalInvested - a.totalInvested);
    }, [positions]);

    const handleAddPosition = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (!currentPortfolio || !userEmail) return;

            const data = {
                symbol: formData.symbol.toUpperCase(),
                quantity: parseFloat(formData.quantity),
                buy_date: formData.buy_date,
                invested_amount: parseFloat(formData.invested_amount),
                portfolio_id: currentPortfolio.portfolio_id,
                portfolio_name: currentPortfolio.portfolio_name || 'Main Portfolio',
            };

            const url = buildApiUrl(userEmail, 'portfolio/positions');
            const response = await fetch(url, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add position');
            }

            setFormData({
                symbol: '',
                quantity: '',
                buy_date: '',
                invested_amount: '',
            });
            setIsAddModalOpen(false);
            await fetchPositions();
        } catch (error: any) {
            console.error('Error adding position:', error);
            setError(error.message || 'Failed to add position');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePosition = async (positionId: string) => {
        if (!confirm('Are you sure you want to delete this transaction?') || !userEmail) return;
        try {
            const url = buildApiUrl(userEmail, `portfolio/positions/${positionId}`);
            const response = await fetch(url, {
                method: 'DELETE',
                headers: getApiHeaders()
            });

            if (response.ok) {
                fetchPositions();
            } else {
                const errorData = await response.json();
                console.error('Error deleting position:', errorData.message);
            }
        } catch (error) {
            console.error('Error deleting position:', error);
        }
    };

    if (isAuthLoading || loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2 text-white">Loading Positions</h2>
                    <p className="text-neutral-400 text-sm">Fetching your portfolio data...</p>
                </div>
            </div>
        );
    }

    const selectedGroup = groupedPositions.find(g => g.symbol === selectedSymbol);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white">My Positions</h1>
                    <p className="text-neutral-400">Manage your stock positions and track performance</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Position
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-neutral-400 text-xs uppercase tracking-widest font-bold">Total Portfolios Value</span>
                        <Hash className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white leading-none">
                        {positions.length} <span className="text-sm font-normal text-neutral-500 ml-1">Entries</span>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-neutral-400 text-xs uppercase tracking-widest font-bold">Total Invested</span>
                        <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white leading-none">
                        ₹{positions.reduce((sum, p) => sum + p.invested_amount, 0).toLocaleString('en-IN')}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-neutral-400 text-xs uppercase tracking-widest font-bold">Unique Holdings</span>
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-white leading-none">
                        {groupedPositions.length}
                    </div>
                </div>
            </div>

            {/* Positions Card Grid */}
            {groupedPositions.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-20 text-center">
                    <TrendingUp className="w-16 h-16 mx-auto mb-6 text-neutral-600" />
                    <h3 className="text-xl font-bold text-white mb-2">No positions found</h3>
                    <p className="text-neutral-400 mb-8 max-w-sm mx-auto">Start tracking your investment journey by adding your first position.</p>
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Add First Position
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {groupedPositions.map((group) => (
                        <div
                            key={group.symbol}
                            onClick={() => setSelectedSymbol(group.symbol)}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.08] hover:border-blue-500/30 transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98]"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight truncate">{group.symbol}</h3>
                                <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-neutral-500 font-bold">{group.transactionCount} Tx</span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Total</p>
                                    <p className="text-sm font-black text-white">₹{group.totalInvested.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                                    <p className="text-[9px] text-neutral-500 font-medium uppercase">Qty</p>
                                    <p className="text-[11px] font-bold text-neutral-300">{group.totalQuantity.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Transaction History Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#09090B] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <button
                                        onClick={() => setSelectedSymbol(null)}
                                        className="p-1 hover:bg-white/10 rounded-lg transition-colors text-neutral-400"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">{selectedGroup.symbol} History</h2>
                                </div>
                                <p className="text-neutral-400 ml-9">Detailed transaction logs for this asset</p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedSymbol(null)}
                                className="text-neutral-500 hover:text-white"
                            >
                                Close
                            </Button>
                        </div>

                        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] border-b border-white/5">
                                    <tr>
                                        <th className="pb-4">Date</th>
                                        <th className="pb-4 text-right">Quantity</th>
                                        <th className="pb-4 text-right">Buy Price</th>
                                        <th className="pb-4 text-right">Invested</th>
                                        <th className="pb-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {selectedGroup.transactions.map((t) => (
                                        <tr key={t.position_id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-5 font-medium text-neutral-300">
                                                {new Date(t.buy_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="py-5 text-right font-bold text-white">
                                                {t.quantity.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-5 text-right text-neutral-400">
                                                ₹{(t.invested_amount / t.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-5 text-right font-bold text-white">
                                                ₹{t.invested_amount.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-5 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePosition(t.position_id);
                                                    }}
                                                    className="h-8 w-8 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-white/[0.02] flex justify-between items-center">
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Aggregate Cost</p>
                                    <p className="text-xl font-bold text-white">₹{selectedGroup.totalInvested.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Total Quantity</p>
                                    <p className="text-xl font-bold text-white">{selectedGroup.totalQuantity.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => {
                                    setFormData({ ...formData, symbol: selectedGroup.symbol });
                                    setIsAddModalOpen(true);
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            >
                                Add Transaction
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Position Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Add Position</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-500 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleAddPosition} className="p-8 space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Stock Symbol</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. RELIANCE"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/[0.08] transition-all"
                                    value={formData.symbol}
                                    onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Quantity</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        placeholder="0"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/[0.08] transition-all"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Buy Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/[0.08] transition-all"
                                        value={formData.buy_date}
                                        onChange={e => setFormData({ ...formData, buy_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total Invested (₹)</label>
                                <input
                                    required
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/[0.08] transition-all"
                                    value={formData.invested_amount}
                                    onChange={e => setFormData({ ...formData, invested_amount: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 h-12 rounded-xl border border-white/10 text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                >
                                    {submitting ? 'Processing...' : 'Add Holding'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
