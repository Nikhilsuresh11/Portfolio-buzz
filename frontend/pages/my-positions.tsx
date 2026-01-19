import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';
import { usePortfolio } from '../lib/portfolio-context';
import { PageLoader } from '../components/ui/page-loader';
import { Tabs } from '@/components/ui/vercel-tabs';

type PositionType = 'stocks' | 'mutual-funds';

export default function MyPositionsPage() {
    const router = useRouter();
    const { userEmail, isLoading: isAuthLoading } = useAuth();
    const { currentPortfolio } = usePortfolio();

    const [activeTab, setActiveTab] = useState<PositionType>('stocks');

    useEffect(() => {
        if (!isAuthLoading && !userEmail) {
            router.push('/');
        } else if (userEmail && !currentPortfolio && !isAuthLoading) {
            router.push('/select-portfolio');
        }
    }, [userEmail, currentPortfolio, isAuthLoading, router]);

    // When tab changes, redirect to the appropriate page
    useEffect(() => {
        if (userEmail && currentPortfolio) {
            if (activeTab === 'stocks') {
                router.push('/positions');
            } else {
                router.push('/mf-positions');
            }
        }
    }, [activeTab, userEmail, currentPortfolio, router]);

    const tabs = [
        { id: 'stocks' as PositionType, label: 'Stock Positions' },
        { id: 'mutual-funds' as PositionType, label: 'Mutual Fund Positions' }
    ];

    if (isAuthLoading) {
        return (
            <div className="flex-1 overflow-auto flex items-center justify-center min-h-screen">
                <PageLoader
                    messages={["Loading positions...", "Please wait..."]}
                    subtitle="Preparing your data"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black">
            {/* Header */}
            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-1.5 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                            My Positions
                        </h1>
                        <p className="text-zinc-400 text-sm">Track and manage all your transactions</p>
                    </div>
                </div>

                {/* Tabs below header */}
                <div className="flex items-center gap-2 px-6 md:px-8">
                    <Tabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={(tabId) => setActiveTab(tabId as PositionType)}
                        className="[&>div>div>div]:h-[42px] [&>div>div>div]:px-5 [&>div>div>div]:text-[15px]"
                    />
                </div>
            </div>

            {/* Loading state while redirecting */}
            <div className="flex-1 flex items-center justify-center">
                <PageLoader
                    messages={["Switching to " + (activeTab === 'stocks' ? 'Stock' : 'Mutual Fund') + " Positions..."]}
                    subtitle="Please wait"
                />
            </div>

            {/* Background effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
        </div>
    );
}
