import Head from 'next/head';
import { PageLoader } from '../../components/ui/page-loader';
import { AlertTriangle } from 'lucide-react';

export default function MFMetrics() {
    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black">
            <Head>
                <title>Mutual Fund Metrics | Portfolio Buzz</title>
            </Head>

            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Mutual Fund Risk Analysis</h2>
                        <p className="text-sm text-gray-400">Detailed risk metrics for your mutual fund portfolio</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center bg-zinc-900/50 border border-zinc-800 p-10 rounded-2xl max-w-md backdrop-blur-sm">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="text-blue-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
                    <p className="text-zinc-400">
                        Advanced risk metrics and analysis for Mutual Funds are currently under development. Check back soon!
                    </p>
                </div>
            </div>

            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
        </div>
    );
}
