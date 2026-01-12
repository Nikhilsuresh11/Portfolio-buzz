import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { positionsApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { usePortfolio } from '../lib/portfolio-context';
import { Plus, Trash2, Edit2, Loader2, TrendingUp, Calendar, DollarSign, Hash } from 'lucide-react';
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

export default function MyPositionsPage() {
    const router = useRouter();
    const { userEmail, isLoading: isAuthLoading } = useAuth();
    const { currentPortfolio } = usePortfolio();
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
            router.push('/auth/login');
        } else if (userEmail && !currentPortfolio) {
            router.push('/select-portfolio');
        } else if (userEmail && currentPortfolio) {
            fetchPositions();
        }
    }, [userEmail, currentPortfolio, isAuthLoading, router]);

    const fetchPositions = async () => {
        try {
            setLoading(true);
            if (currentPortfolio) {
                const response = await positionsApi.listPositions(currentPortfolio.portfolio_id);
                setPositions(response.positions || []);
            }
        } catch (error) {
            console.error('Error fetching positions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPosition = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const data = {
                symbol: formData.symbol.toUpperCase(),
                quantity: parseFloat(formData.quantity),
                buy_date: formData.buy_date,
                invested_amount: parseFloat(formData.invested_amount),
                portfolio_name: currentPortfolio?.portfolio_name || 'Main Portfolio',
            };

            if (currentPortfolio) {
                await positionsApi.createPosition(currentPortfolio.portfolio_id, data);
            }

            // Reset form and close modal
            setFormData({
                symbol: '',
                quantity: '',
                buy_date: '',
                invested_amount: '',
            });
            setIsAddModalOpen(false);

            // Refresh positions list
            await fetchPositions();
        } catch (error: any) {
            console.error('Error adding position:', error);
            setError(error.message || 'Failed to add position');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePosition = async (positionId: string) => {
        if (!confirm('Are you sure you want to delete this position?')) return;
        try {
            await positionsApi.deletePosition(positionId);
            fetchPositions();
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-neutral-400 text-xs uppercase tracking-wide">Total Positions</span>
                        <Hash className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{positions.length}</div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-neutral-400 text-xs uppercase tracking-wide">Total Invested</span>
                        <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        ₹{positions.reduce((sum, p) => sum + p.invested_amount, 0).toLocaleString('en-IN')}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-neutral-400 text-xs uppercase tracking-wide">Unique Stocks</span>
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {new Set(positions.map(p => p.symbol)).size}
                    </div>
                </div>
            </div>

            {/* Positions Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="text-left p-4 text-neutral-400 font-medium text-sm">Symbol</th>
                                <th className="text-right p-4 text-neutral-400 font-medium text-sm">Quantity</th>
                                <th className="text-right p-4 text-neutral-400 font-medium text-sm">Buy Date</th>
                                <th className="text-right p-4 text-neutral-400 font-medium text-sm">Invested Amount</th>
                                <th className="text-right p-4 text-neutral-400 font-medium text-sm">Avg Price</th>
                                <th className="text-right p-4 text-neutral-400 font-medium text-sm">Nifty Value</th>
                                <th className="text-right p-4 text-neutral-400 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {positions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <div className="text-neutral-400">
                                            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg mb-2">No positions yet</p>
                                            <p className="text-sm">Click "Add Position" to start tracking your investments</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                positions.map((position) => (
                                    <tr key={position.position_id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-blue-400">{position.symbol}</div>
                                        </td>
                                        <td className="p-4 text-right text-neutral-300">{position.quantity}</td>
                                        <td className="p-4 text-right text-neutral-300">
                                            {new Date(position.buy_date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="p-4 text-right text-white font-semibold">
                                            ₹{position.invested_amount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="p-4 text-right text-neutral-300">
                                            ₹{(position.invested_amount / position.quantity).toFixed(2)}
                                        </td>
                                        <td className="p-4 text-right text-neutral-400">
                                            {position.nifty_value?.toFixed(2) || 'N/A'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeletePosition(position.position_id)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Position Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white">Add New Position</h3>
                        </div>
                        <form onSubmit={handleAddPosition} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-neutral-400 uppercase">Stock Symbol</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. RELIANCE"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={formData.symbol}
                                    onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-neutral-400 uppercase">Quantity</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        placeholder="0.00"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-neutral-400 uppercase">Buy Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={formData.buy_date}
                                        onChange={e => setFormData({ ...formData, buy_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-neutral-400 uppercase">Total Invested Amount (₹)</label>
                                <input
                                    required
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={formData.invested_amount}
                                    onChange={e => setFormData({ ...formData, invested_amount: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 border border-white/10 text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {submitting ? 'Adding...' : 'Add Position'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
