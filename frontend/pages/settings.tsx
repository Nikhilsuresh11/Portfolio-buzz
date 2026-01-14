import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
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
            <div className="flex-1 flex items-center justify-center">
                <MessageLoading />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen relative p-6">
            <Header user={user?.name && user.name !== 'User' ? user.name : (user?.email?.split('@')[0] || 'User')} />

            <div className="max-w-6xl mx-auto w-full z-10 space-y-8 pt-6">
                {/* Profile Settings */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Account Profile</h2>
                            <p className="text-neutral-400">Manage your account information and preferences</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-neutral-400 uppercase text-[10px] font-bold tracking-widest">Email Address</Label>
                            <Input
                                value={user?.email || ''}
                                disabled
                                className="bg-white/5 border-white/10 text-neutral-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-neutral-400 uppercase text-[10px] font-bold tracking-widest">Account Type</Label>
                            <div className="flex items-center gap-2 h-10 px-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400 font-semibold text-sm">
                                <Shield size={16} />
                                Pro Member
                            </div>
                        </div>
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
                                <h2 className="text-2xl font-bold text-white">Portfolios</h2>
                                <p className="text-neutral-400">Add, edit, or switch between your investment portfolios</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowCreatePortfolio(!showCreatePortfolio)}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            <Plus size={16} />
                            New Portfolio
                        </Button>
                    </div>

                    {showCreatePortfolio && (
                        <form onSubmit={handleCreatePortfolio} className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-neutral-300">Name</Label>
                                    <Input
                                        required
                                        placeholder="e.g. Long Term Stocks"
                                        value={portfolioName}
                                        onChange={e => setPortfolioName(e.target.value)}
                                        className="bg-black/50 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-neutral-300">Description</Label>
                                    <Input
                                        placeholder="e.g. Retirement savings"
                                        value={portfolioDescription}
                                        onChange={e => setPortfolioDescription(e.target.value)}
                                        className="bg-black/50 border-white/10"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={isDefault}
                                    onChange={e => setIsDefault(e.target.checked)}
                                    className="accent-blue-500 cursor-pointer"
                                />
                                <Label htmlFor="isDefault" className="text-neutral-300 cursor-pointer">Set as default portfolio</Label>
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {submitting ? 'Creating...' : 'Create Portfolio'}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setShowCreatePortfolio(false)} className="text-neutral-400">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {portfolios.map((p: any) => (
                            <div
                                key={p.portfolio_id}
                                className={`
                                    relative p-6 rounded-2xl border transition-all cursor-pointer group
                                    ${currentPortfolio?.portfolio_id === p.portfolio_id
                                        ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/5'
                                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                                    }
                                `}
                                onClick={() => setCurrentPortfolio(p)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <h4 className="font-bold text-white text-lg truncate pr-8">{p.portfolio_name}</h4>
                                    {p.is_default && (
                                        <div className="flex items-center justify-center p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg absolute top-4 right-4" title="Default Portfolio">
                                            <Star size={16} fill="currentColor" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-neutral-400 mb-6 line-clamp-2 min-h-[40px] italic">
                                    {p.description || "No description provided."}
                                </p>
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2">
                                        {currentPortfolio?.portfolio_id === p.portfolio_id && (
                                            <Badge className="bg-blue-500 text-white text-[10px] px-2 py-0 h-5">Selected</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!p.is_default && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleSetDefault(p.portfolio_id); }}
                                                className="text-[10px] text-neutral-500 hover:text-white"
                                            >
                                                Make Default
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                                            onClick={(e) => { e.stopPropagation(); handleDeletePortfolio(p.portfolio_id); }}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full font-medium ${className}`}>
            {children}
        </span>
    );
}
