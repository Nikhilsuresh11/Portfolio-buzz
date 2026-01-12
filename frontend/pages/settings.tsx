import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getUser } from '../lib/auth';
import { usePortfolio } from '../lib/portfolio-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Shield, User, Plus, Trash2, Edit2, Folder, Star } from 'lucide-react';
import { MessageLoading } from '@/components/ui/message-loading';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { portfolios, currentPortfolio, setCurrentPortfolio, createPortfolio, updatePortfolio, deletePortfolio, refreshPortfolios } = usePortfolio();

    // Portfolio form state
    const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
    const [portfolioName, setPortfolioName] = useState('');
    const [portfolioDescription, setPortfolioDescription] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);

    useEffect(() => {
        const userData = getUser();
        if (userData) {
            setUser(userData);
        } else {
            router.push('/auth/login');
        }
        document.documentElement.setAttribute('data-theme', 'dark');
        setLoading(false);
    }, [router]);

    const handleCreatePortfolio = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await createPortfolio(portfolioName, portfolioDescription, isDefault);
            setShowCreatePortfolio(false);
            setPortfolioName('');
            setPortfolioDescription('');
            setIsDefault(false);
        } catch (error) {
            console.error('Error creating portfolio:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePortfolio = async (portfolioId: string) => {
        if (!confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
            return;
        }

        try {
            await deletePortfolio(portfolioId);
        } catch (error: any) {
            alert(error.message || 'Failed to delete portfolio');
        }
    };

    const handleSetDefault = async (portfolioId: string) => {
        try {
            await updatePortfolio(portfolioId, { is_default: true });
        } catch (error) {
            console.error('Error setting default portfolio:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-black text-white">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <MessageLoading />
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-[#000] to-[#1A2428] text-white">
            <Sidebar />

            <main className="flex-1 flex flex-col min-h-screen relative p-6">
                <Header user={user?.name && user.name !== 'User' ? user.name : (user?.email?.split('@')[0] || 'User')} />

                <div className="max-w-6xl mx-auto w-full z-10 space-y-8">
                    {/* Profile Settings */}
                    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Profile Settings</h2>
                                <p className="text-gray-400">Manage your account information</p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input
                                    defaultValue={user?.name && user.name !== 'User' ? user.name : (user?.email?.split('@')[0] || 'Guest User')}
                                    className="bg-black/20 border-white/10 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input
                                    defaultValue={user?.email || 'user@example.com'}
                                    disabled
                                    className="bg-black/20 border-white/10 text-white opacity-60"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                                Save Changes
                            </Button>
                        </div>
                    </div>

                    {/* Portfolio Management */}
                    <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                    <Folder size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Portfolio Management</h2>
                                    <p className="text-gray-400">Create and manage your investment portfolios</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowCreatePortfolio(true)}
                                className="bg-purple-600 hover:bg-purple-500 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Portfolio
                            </Button>
                        </div>

                        {/* Portfolio List */}
                        <div className="space-y-3">
                            {portfolios.map((portfolio) => (
                                <div
                                    key={portfolio.portfolio_id}
                                    className={`p-4 rounded-xl border transition-all ${currentPortfolio?.portfolio_id === portfolio.portfolio_id
                                            ? 'bg-purple-500/10 border-purple-500/30'
                                            : 'bg-black/20 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Folder className="w-5 h-5 text-purple-400" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{portfolio.portfolio_name}</h3>
                                                    {portfolio.is_default && (
                                                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                                                            <Star className="w-3 h-3" />
                                                            Default
                                                        </span>
                                                    )}
                                                    {currentPortfolio?.portfolio_id === portfolio.portfolio_id && (
                                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                {portfolio.description && (
                                                    <p className="text-sm text-gray-400 mt-1">{portfolio.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {currentPortfolio?.portfolio_id !== portfolio.portfolio_id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setCurrentPortfolio(portfolio)}
                                                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
                                                >
                                                    Switch
                                                </Button>
                                            )}
                                            {!portfolio.is_default && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleSetDefault(portfolio.portfolio_id)}
                                                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                                                    title="Set as default"
                                                >
                                                    <Star className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {!portfolio.is_default && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeletePortfolio(portfolio.portfolio_id)}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {portfolios.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No portfolios yet. Create your first portfolio to get started.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Portfolio Modal */}
            {showCreatePortfolio && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-black border border-white/10 rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">Create New Portfolio</h2>

                        <form onSubmit={handleCreatePortfolio} className="space-y-4">
                            <div>
                                <Label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Portfolio Name
                                </Label>
                                <Input
                                    type="text"
                                    required
                                    placeholder="e.g., Growth Portfolio"
                                    value={portfolioName}
                                    onChange={(e) => setPortfolioName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div>
                                <Label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Description (Optional)
                                </Label>
                                <Input
                                    type="text"
                                    placeholder="e.g., Long-term growth stocks"
                                    value={portfolioDescription}
                                    onChange={(e) => setPortfolioDescription(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/10 bg-white/5"
                                />
                                <Label htmlFor="isDefault" className="text-sm text-neutral-300">
                                    Set as default portfolio
                                </Label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setShowCreatePortfolio(false);
                                        setPortfolioName('');
                                        setPortfolioDescription('');
                                        setIsDefault(false);
                                    }}
                                    variant="ghost"
                                    className="flex-1 bg-white/5 hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    {submitting ? 'Creating...' : 'Create Portfolio'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
        </div>
    );
}
