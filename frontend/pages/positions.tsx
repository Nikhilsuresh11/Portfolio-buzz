import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import { usePortfolio } from '../lib/portfolio-context';
import { buildApiUrl, getApiHeaders } from '../lib/api-helpers';
import { Plus, Trash2, Calendar, Package, X } from 'lucide-react';
import { PageLoader } from '../components/ui/page-loader';
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

type SortField = 'symbol' | 'totalInvested' | 'totalQuantity' | 'transactionCount';
type SortDirection = 'asc' | 'desc';

export default function MyPositionsPage() {
    const router = useRouter();
    const { userEmail, isLoading: isAuthLoading } = useAuth();
    const { currentPortfolio } = usePortfolio();
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('totalInvested');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
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
            group.transactions.sort((a, b) => new Date(b.buy_date).getTime() - new Date(a.buy_date).getTime());
        });

        const sorted = Object.values(groups).sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];

            if (sortField === 'symbol') {
                return sortDirection === 'asc'
                    ? aVal.toString().localeCompare(bVal.toString())
                    : bVal.toString().localeCompare(aVal.toString());
            }

            return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
        });

        return sorted;
    }, [positions, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleAddPosition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPortfolio || !userEmail) return;

        try {
            setSubmitting(true);
            setError(null);

            const url = buildApiUrl(userEmail, 'portfolio/positions');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    ...getApiHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    portfolio_id: currentPortfolio.portfolio_id || 'default',
                    quantity: parseFloat(formData.quantity),
                    invested_amount: parseFloat(formData.invested_amount),
                }),
            });

            if (!response.ok) throw new Error('Failed to add position');

            setFormData({ symbol: '', quantity: '', buy_date: '', invested_amount: '' });
            setIsAddModalOpen(false);
            fetchPositions();
        } catch (err: any) {
            setError(err.message || 'Failed to add position');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePosition = async (positionId: string) => {
        if (!userEmail || !confirm('Are you sure you want to delete this position?')) return;

        try {
            const url = buildApiUrl(userEmail, `portfolio/positions/${positionId}`);
            const response = await fetch(url, {
                method: 'DELETE',
                headers: getApiHeaders(),
            });

            if (!response.ok) throw new Error('Failed to delete position');
            fetchPositions();
        } catch (error) {
            console.error('Error deleting position:', error);
        }
    };

    if (loading && positions.length === 0) {
        return (
            <div className="flex-1 overflow-auto flex items-center justify-center min-h-screen">
                <PageLoader
                    messages={[
                        "Loading your positions...",
                        "Fetching transaction history...",
                        "Almost ready..."
                    ]}
                    subtitle="Preparing your portfolio data"
                />
            </div>
        );
    }

    const selectedGroup = groupedPositions.find(g => g.symbol === selectedSymbol);
    const totalInvested = positions.reduce((sum, p) => sum + p.invested_amount, 0);

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                            My Positions
                        </h1>
                        <p className="text-zinc-400">Track and manage all your stock transactions</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-9 px-5 rounded-[11px]"
                        >
                            <Plus size={16} />
                            Add Position
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                        <p className="text-zinc-500 text-xs mb-2">Total Transactions</p>
                        <p className="text-2xl font-bold text-white">{positions.length}</p>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                        <p className="text-zinc-500 text-xs mb-2">Total Invested</p>
                        <p className="text-2xl font-bold text-white">₹{totalInvested.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                        <p className="text-zinc-500 text-xs mb-2">Unique Stocks</p>
                        <p className="text-2xl font-bold text-white">{groupedPositions.length}</p>
                    </div>
                </div>

                {/* Table */}
                {groupedPositions.length === 0 ? (
                    <div className="bg-zinc-900/20 border border-zinc-800/40 backdrop-blur-xl rounded-2xl p-16 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 text-zinc-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">No positions yet</h3>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                            Start building your portfolio by adding your first stock position
                        </p>
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5 inline-block">
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-9 px-5 rounded-[11px]"
                            >
                                <Plus size={16} />
                                Add First Position
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-zinc-900/20 border border-zinc-800/40 backdrop-blur-xl rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-800/40">
                                        <th
                                            className="text-left p-4 text-zinc-400 text-sm font-medium cursor-pointer hover:text-white transition-colors"
                                            onClick={() => handleSort('symbol')}
                                        >
                                            Symbol
                                        </th>
                                        <th
                                            className="text-right p-4 text-zinc-400 text-sm font-medium cursor-pointer hover:text-white transition-colors"
                                            onClick={() => handleSort('totalQuantity')}
                                        >
                                            Quantity
                                        </th>
                                        <th className="text-right p-4 text-zinc-400 text-sm font-medium">
                                            Avg Price
                                        </th>
                                        <th
                                            className="text-right p-4 text-zinc-400 text-sm font-medium cursor-pointer hover:text-white transition-colors"
                                            onClick={() => handleSort('totalInvested')}
                                        >
                                            Total Invested
                                        </th>
                                        <th
                                            className="text-right p-4 text-zinc-400 text-sm font-medium cursor-pointer hover:text-white transition-colors"
                                            onClick={() => handleSort('transactionCount')}
                                        >
                                            Transactions
                                        </th>
                                        <th className="text-right p-4 text-zinc-400 text-sm font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedPositions.map((group, idx) => (
                                        <tr
                                            key={group.symbol}
                                            className={`border-b border-zinc-800/20 hover:bg-zinc-800/20 transition-colors ${idx === groupedPositions.length - 1 ? 'border-b-0' : ''
                                                }`}
                                        >
                                            <td className="p-4">
                                                <span className="text-base font-bold text-white">{group.symbol}</span>
                                            </td>
                                            <td className="p-4 text-right text-zinc-300 text-sm">
                                                {group.totalQuantity.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right text-zinc-300 text-sm">
                                                ₹{group.avgPrice.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="text-white font-semibold text-sm">
                                                    ₹{group.totalInvested.toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="inline-block bg-zinc-800/50 px-2 py-1 rounded-lg text-xs text-zinc-400">
                                                    {group.transactionCount}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => setSelectedSymbol(group.symbol)}
                                                    className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction Details Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {selectedGroup.symbol} Transactions
                                </h2>
                                <p className="text-zinc-400 text-sm">
                                    {selectedGroup.transactionCount} transaction{selectedGroup.transactionCount !== 1 ? 's' : ''} • Total: ₹{selectedGroup.totalInvested.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSymbol(null)}
                                className="w-10 h-10 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-zinc-800/40">
                                            <th className="text-left p-3 text-zinc-400 text-sm font-medium">Date</th>
                                            <th className="text-right p-3 text-zinc-400 text-sm font-medium">Quantity</th>
                                            <th className="text-right p-3 text-zinc-400 text-sm font-medium">Price</th>
                                            <th className="text-right p-3 text-zinc-400 text-sm font-medium">Amount</th>
                                            <th className="text-right p-3 text-zinc-400 text-sm font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedGroup.transactions.map((transaction, idx) => (
                                            <tr
                                                key={transaction.position_id}
                                                className={`border-b border-zinc-800/20 hover:bg-zinc-800/20 transition-colors ${idx === selectedGroup.transactions.length - 1 ? 'border-b-0' : ''
                                                    }`}
                                            >
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-400" />
                                                        <span className="text-white text-sm">
                                                            {new Date(transaction.buy_date).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right text-zinc-300 text-sm">
                                                    {transaction.quantity.toFixed(2)}
                                                </td>
                                                <td className="p-3 text-right text-zinc-300 text-sm">
                                                    ₹{(transaction.invested_amount / transaction.quantity).toFixed(2)}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className="text-green-400 font-semibold text-sm">
                                                        ₹{transaction.invested_amount.toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeletePosition(transaction.position_id);
                                                        }}
                                                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors ml-auto"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Position Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-white">Add Position</h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-10 h-10 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        <form onSubmit={handleAddPosition} className="p-5 space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Stock Symbol
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.symbol}
                                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="e.g., RELIANCE"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Buy Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.buy_date}
                                    onChange={(e) => setFormData({ ...formData, buy_date: e.target.value })}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Invested Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.invested_amount}
                                    onChange={(e) => setFormData({ ...formData, invested_amount: e.target.value })}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 bg-zinc-800/50 hover:bg-zinc-800 text-white font-semibold py-2.5 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <div className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-black hover:bg-zinc-900 text-white font-semibold py-[9px] rounded-[11px] transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Adding...' : 'Add Position'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
