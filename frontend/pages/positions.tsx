import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
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
            const response = await positionsApi.listPositions('default');
            setPositions(response.positions || []);
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

            await positionsApi.createPosition('default', data);

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
            await fetchPositions();
        } catch (error) {
            console.error('Error deleting position:', error);
        }
    };

    if (isAuthLoading || loading) {
        return (
            <div className="flex h-screen bg-black text-white">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Loading Positions</h2>
                        <p className="text-neutral-400 text-sm">Fetching your portfolio data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black text-white">
            <Sidebar />

            <main className="flex-1 overflow-auto">
                <div className="p-6 max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">My Positions</h1>
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
                            <div className="text-2xl font-bold">{positions.length}</div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-neutral-400 text-xs uppercase tracking-wide">Total Invested</span>
                                <DollarSign className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="text-2xl font-bold">
                                ₹{positions.reduce((sum, p) => sum + p.invested_amount, 0).toLocaleString('en-IN')}
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-neutral-400 text-xs uppercase tracking-wide">Unique Stocks</span>
                                <TrendingUp className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="text-2xl font-bold">
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
                </div>
            </main>

            {/* Add Position Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">Add New Position</h2>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleAddPosition} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Stock Symbol
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., RELIANCE, TCS"
                                    value={formData.symbol}
                                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    placeholder="Number of shares"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Buy Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.buy_date}
                                    onChange={(e) => setFormData({ ...formData, buy_date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Invested Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    placeholder="Total amount invested"
                                    value={formData.invested_amount}
                                    onChange={(e) => setFormData({ ...formData, invested_amount: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setError(null);
                                    }}
                                    variant="ghost"
                                    className="flex-1 bg-white/5 hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Position
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
