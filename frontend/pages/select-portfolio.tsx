import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import { usePortfolio } from '../lib/portfolio-context';
import { Folder, Plus, ArrowRight } from 'lucide-react';
import { PageLoader } from '../components/ui/page-loader';

export default function SelectPortfolioPage() {
    const router = useRouter();
    const { userEmail, isLoading: isAuthLoading } = useAuth();
    const { portfolios, setCurrentPortfolio, isLoading: isPortfolioLoading, refreshPortfolios } = usePortfolio();
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !userEmail) {
            router.push('/');
        }
    }, [isAuthLoading, userEmail, router]);

    const handleSelect = (portfolio: any) => {
        setCurrentPortfolio(portfolio);
        router.push('/portfolio');
    };

    const handleCreate = async () => {
        // Implement create logic later or mock
        setCreating(true);
        setTimeout(() => {
            // Mock creation
            setCreating(false);
            refreshPortfolios();
        }, 1000);
    };

    if (isAuthLoading || isPortfolioLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <PageLoader
                    messages={[
                        "Loading your portfolios...",
                        "Fetching portfolio data...",
                        "Almost there..."
                    ]}
                    subtitle="Preparing your portfolio selection"
                />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8 flex flex-col items-center justify-center">
            <div className="max-w-4xl w-full">
                <h1 className="text-4xl font-bold mb-2 text-center">Select Portfolio</h1>
                <p className="text-neutral-400 text-center mb-12">Choose a portfolio to manage or create a new one</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolios.map((p) => (
                        <button
                            key={p.portfolio_id}
                            onClick={() => handleSelect(p)}
                            className="group relative bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 rounded-2xl p-6 text-left transition-all duration-300"
                        >
                            <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Folder className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-1">{p.portfolio_name}</h3>
                            <p className="text-sm text-neutral-400 mb-4">{p.position_count || 0} Positions</p>

                            <div className="flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                View Portfolio <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </button>
                    ))}

                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="group border-2 border-dashed border-white/10 hover:border-white/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[200px]"
                    >
                        <div className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                            <Plus className="w-6 h-6 text-neutral-400 group-hover:text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-300 group-hover:text-white">Create New Portfolio</h3>
                    </button>
                </div>
            </div>
        </div>
    );
}
