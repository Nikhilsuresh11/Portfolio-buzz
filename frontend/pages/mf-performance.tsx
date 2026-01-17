import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { useAuth } from '../lib/auth-context'
import { buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { TrendingUp, Award, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react'

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

    return (
        <div className="flex flex-col h-screen bg-black">
            <Header />

            <div className="flex-1 px-6 md:p-8 pb-6 md:pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                        Top Performing Funds
                    </h1>
                    <p className="text-zinc-400">Discover and analyze top-rated mutual funds</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {popularFunds.map((fund) => (
                            <div key={fund.scheme_code} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Current NAV</div>
                                        <div className="text-xl font-bold text-white">₹{fund.nav.toFixed(2)}</div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 min-h-[3.5rem]">{fund.scheme_name}</h3>

                                <div className="grid grid-cols-3 gap-2 mt-6">
                                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-zinc-500 uppercase mb-1">1Y Return</div>
                                        <div className={`text-sm font-bold ${(fund.return_1y || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {(fund.return_1y || 0).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-zinc-500 uppercase mb-1">3Y Return</div>
                                        <div className={`text-sm font-bold ${(fund.return_3y || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {(fund.return_3y || 0).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-zinc-500 uppercase mb-1">5Y Return</div>
                                        <div className={`text-sm font-bold ${(fund.return_5y || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {(fund.return_5y || 0).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
