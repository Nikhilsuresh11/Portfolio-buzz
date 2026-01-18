import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { useAuth } from '../lib/auth-context'
import { buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { TrendingUp, Award, BarChart3, ArrowUpRight, ArrowDownRight, Target, Activity, Star } from 'lucide-react'
import { PageLoader } from '../components/ui/page-loader'
import { Button } from '@/components/ui/button'

type FundPerformance = {
    scheme_code: string
    scheme_name: string
    category?: string
    nav: number
    return_1y?: number
    return_3y?: number
    return_5y?: number
}

export default function MFPerformancePage() {
    const { userEmail, isLoading: authLoading } = useAuth()
    const [popularFunds, setPopularFunds] = useState<FundPerformance[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPopularFunds = async () => {
            try {
                const url = buildPublicApiUrl('mf/popular')
                const res = await fetch(url)
                const data = await res.json()
                if (data.success) {
                    setPopularFunds(data.data || [])
                }
            } catch (error) {
                console.error('Error fetching popular funds:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPopularFunds()
    }, [])

    if (authLoading || (loading && popularFunds.length === 0)) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <PageLoader messages={["Scouting top performers...", "Analyzing market leaders...", "Curating popular funds..."]} />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">

            {/* Premium Background Effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="flex-1 px-6 md:px-8 pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pt-4">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                            <Star className="w-4 h-4" />
                            Market Intelligence
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent tracking-tight">
                            Popular Funds
                        </h1>
                        <p className="text-zinc-400 mt-3 text-lg font-medium">Top-rated mutual funds by performance and popularity.</p>
                    </div>
                </div>

                {/* Funds Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {popularFunds.map((fund) => (
                        <div key={fund.scheme_code} className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-[2.5rem] p-8 hover:bg-zinc-900/60 transition-all group shadow-2xl shadow-black/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <TrendingUp className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-blue-500/10 rounded-[1.25rem] text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all border border-blue-500/10">
                                        <Activity size={24} />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mb-1">Current NAV</div>
                                        <div className="text-2xl font-black text-white tracking-tight">₹{fund.nav.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                </div>

                                <div className="min-h-[5rem]">
                                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">{fund.category || 'Equity Scheme'}</div>
                                    <h3 className="text-xl font-black text-white line-clamp-2 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{fund.scheme_name}</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mt-8">
                                    <div className="bg-zinc-800/20 p-4 rounded-2xl border border-zinc-800/40 flex flex-col items-center justify-center group/metric hover:bg-zinc-800/40 transition-all">
                                        <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1.5 opacity-60">1Y</div>
                                        <div className={`text-sm font-black ${(fund.return_1y || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {(fund.return_1y || 0).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="bg-zinc-800/20 p-4 rounded-2xl border border-zinc-800/40 flex flex-col items-center justify-center group/metric hover:bg-zinc-800/40 transition-all">
                                        <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1.5 opacity-60">3Y</div>
                                        <div className={`text-sm font-black ${(fund.return_3y || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {(fund.return_3y || 0).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="bg-zinc-800/20 p-4 rounded-2xl border border-zinc-800/40 flex flex-col items-center justify-center group/metric hover:bg-zinc-800/40 transition-all">
                                        <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1.5 opacity-60">5Y</div>
                                        <div className={`text-sm font-black ${(fund.return_5y || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {(fund.return_5y || 0).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-8 bg-zinc-800/50 hover:bg-blue-600 text-white font-bold h-12 rounded-2xl border border-zinc-700/50 hover:border-blue-500/50 transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                    Track this Fund
                                    <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}
