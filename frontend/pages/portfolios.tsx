import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { usePortfolio } from '../lib/portfolio-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Folder, Star, Briefcase } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function PortfoliosPage() {
    const router = useRouter();
    const { userEmail, isLoading: isAuthLoading } = useAuth();
    const { portfolios, currentPortfolio, setCurrentPortfolio, createPortfolio, updatePortfolio, deletePortfolio, refreshPortfolios } = usePortfolio();

    // Portfolio form state
    const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
    const [portfolioName, setPortfolioName] = useState('');
    const [portfolioDescription, setPortfolioDescription] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [portfolioToDelete, setPortfolioToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDeletingPortfolio, setIsDeletingPortfolio] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !userEmail) {
            router.push('/');
        }
        document.documentElement.setAttribute('data-theme', 'dark');
    }, [router, isAuthLoading, userEmail]);

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

    const handleDeletePortfolio = async () => {
        if (!portfolioToDelete) return;

        try {
            setIsDeletingPortfolio(true);
            await deletePortfolio(portfolioToDelete.id);
            setPortfolioToDelete(null);
        } catch (error: any) {
            alert(error.message || 'Failed to delete portfolio');
        } finally {
            setIsDeletingPortfolio(false);
        }
    };

    const handleSetDefault = async (portfolioId: string) => {
        try {
            await updatePortfolio(portfolioId, { is_default: true });
        } catch (error) {
            console.error('Error setting default portfolio:', error);
        }
    };

    const handleSelectPortfolio = (portfolio: any) => {
        setCurrentPortfolio(portfolio);
    };

    if (isAuthLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <PageLoader
                    messages={[
                        "Loading portfolios...",
                        "Fetching your investments...",
                        "Almost ready..."
                    ]}
                    subtitle="Preparing your portfolio dashboard"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black">
            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                        Portfolios
                    </h1>
                    <p className="text-zinc-400">Add, edit, or switch between your investment portfolios</p>
                </div>
            </div>

            <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full">
                {/* Create Portfolio Button */}
                <div className="flex justify-end mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                        <Button
                            onClick={() => setShowCreatePortfolio(!showCreatePortfolio)}
                            className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-10 px-6 rounded-[11px]"
                        >
                            <Plus size={16} />
                            New Portfolio
                        </Button>
                    </div>
                </div>

                {/* Create Portfolio Form */}
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
                        <div className="flex gap-4 pt-2">
                            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-10 px-6 rounded-[11px]"
                                >
                                    {submitting ? 'Creating...' : 'Create Portfolio'}
                                </Button>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setShowCreatePortfolio(false)}
                                className="text-neutral-500 hover:text-white hover:bg-white/5 h-10 px-6 font-medium"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {/* Portfolio Cards Grid */}
                {portfolios.length > 0 ? (
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
                                onClick={() => handleSelectPortfolio(p)}
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
                                            onClick={(e) => { e.stopPropagation(); setPortfolioToDelete({ id: p.portfolio_id, name: p.portfolio_name }); }}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="bg-white/5 border border-white/10 rounded-full p-8 mb-6">
                            <Briefcase className="w-16 h-16 text-neutral-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Portfolios Yet</h3>
                        <p className="text-neutral-400 text-center mb-8 max-w-md">
                            Create your first portfolio to start tracking your investments and analyzing performance.
                        </p>
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                            <Button
                                onClick={() => setShowCreatePortfolio(true)}
                                className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-10 px-6 rounded-[11px]"
                            >
                                <Plus size={16} />
                                Create Your First Portfolio
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

            {/* Delete Portfolio Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={!!portfolioToDelete}
                onClose={() => setPortfolioToDelete(null)}
                onConfirm={handleDeletePortfolio}
                title="Delete Portfolio"
                description={`Are you sure you want to delete "${portfolioToDelete?.name}"? All transactions and data in this portfolio will be permanently removed. This action cannot be undone.`}
                isLoading={isDeletingPortfolio}
            />
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
