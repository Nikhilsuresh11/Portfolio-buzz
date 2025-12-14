import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import StockTable from '../components/StockTable'
import RelatedNews from '../components/RelatedNews'
import StockSearchModal from '../components/StockSearchModal'
import StockResearchModal from '../components/StockResearchModal'
import WelcomeModal from '../components/WelcomeModal'
import AnalysisModal from '../components/AnalysisModal'
import { getToken, getUser } from '../lib/auth'
import { config } from '../config'

type Stock = {
    ticker: string;
    name: string;
    shares?: number;
    price?: number;
    change?: number;
    changePercent?: number;
    currency?: string;
    volume?: number;
    high?: number;
    low?: number;
    open?: number;
    prev_close?: number;
}

export default function Watchlist() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [watchlist, setWatchlist] = useState<Stock[]>([])
    const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isResearchOpen, setIsResearchOpen] = useState(false)
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
    const [analysisTicker, setAnalysisTicker] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check authentication
        const token = getToken()
        const userData = getUser()

        if (!token || !userData) {
            router.push('/auth/login')
            return
        }

        setUser(userData)
        fetchWatchlistData()

        // Apply saved theme or default to dark
        const savedTheme = localStorage.getItem('pb_theme') as 'light' | 'dark' | null
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme)
        } else {
            document.documentElement.setAttribute('data-theme', 'dark')
            localStorage.setItem('pb_theme', 'dark')
        }
    }, [])

    const fetchWatchlistData = async () => {
        try {
            const token = getToken()
            if (!token) return

            const headers = { 'Authorization': `Bearer ${token}` }

            // Fetch watchlist and prices in parallel
            const [watchlistRes, pricesRes] = await Promise.all([
                fetch(`${config.API_BASE_URL}/api/watchlist`, { headers }),
                fetch(`${config.API_BASE_URL}/api/watchlist/price`, { headers })
            ])

            const watchlistData = await watchlistRes.json()
            const pricesData = await pricesRes.json()

            if (watchlistData.success) {
                let stocks = watchlistData.data as Stock[]

                // Merge prices if available
                if (pricesData.success && pricesData.data) {
                    stocks = stocks.map(stock => {
                        const priceInfo = pricesData.data[stock.ticker]
                        if (priceInfo) {
                            return {
                                ...stock,
                                price: priceInfo.price,
                                change: priceInfo.change,
                                changePercent: priceInfo.change_percent,
                                currency: priceInfo.currency,
                                volume: priceInfo.volume,
                                high: priceInfo.high,
                                low: priceInfo.low,
                                open: priceInfo.open,
                                prev_close: priceInfo.prev_close
                            }
                        }
                        return stock
                    })
                }

                setWatchlist(stocks)

                // If watchlist is empty, show welcome modal
                if (stocks.length === 0) {
                    const hasShown = sessionStorage.getItem('welcome_shown')
                    if (!hasShown) {
                        setIsWelcomeOpen(true)
                        sessionStorage.setItem('welcome_shown', 'true')
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching watchlist data:', error)
        } finally {
            setLoading(false)
        }
    }

    const addStock = async (ticker: string) => {
        try {
            const token = getToken()
            if (!token) return

            const res = await fetch(`${config.API_BASE_URL}/api/watchlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ticker })
            })

            const data = await res.json()
            if (data.success) {
                // Refresh data to get prices for the new stock
                fetchWatchlistData()
                setSelectedTicker(ticker)
            }
        } catch (error) {
            console.error('Error adding stock:', error)
        }
    }

    const removeStock = async (ticker: string) => {
        try {
            const token = getToken()
            if (!token) return

            const res = await fetch(`${config.API_BASE_URL}/api/watchlist/\${ticker}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await res.json()
            if (data.success) {
                setWatchlist(prev => prev.filter(s => s.ticker !== ticker))
                if (selectedTicker === ticker) {
                    setSelectedTicker(null)
                }
            }
        } catch (error) {
            console.error('Error removing stock:', error)
        }
    }

    const handleAnalyze = (ticker: string) => {
        setAnalysisTicker(ticker)
        setIsAnalysisOpen(true)
    }

    if (loading) return null // Or a loading spinner

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-[#000] to-[#1A2428] text-white">
            <Sidebar
                onSearchClick={() => setIsSearchOpen(true)}
                onResearchClick={() => setIsResearchOpen(true)}
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <div className='p-6 pb-0 z-10'>
                    <Header user={user?.name || 'User'} />
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 p-6 pt-0 overflow-hidden">
                    <div className="overflow-y-auto pr-2 custom-scrollbar">
                        {/* We will refactor StockTable styles next, but container needs glass effect */}
                        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-1 h-full shadow-xl">
                            <StockTable
                                rows={watchlist}
                                onSelect={setSelectedTicker}
                                onAnalyze={handleAnalyze}
                                onRemove={removeStock}
                                selectedTicker={selectedTicker}
                            />
                        </div>
                    </div>

                    <div className="hidden lg:block h-full overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl shadow-xl">
                        <RelatedNews
                            ticker={selectedTicker}
                            onClose={() => setSelectedTicker(null)}
                        />
                    </div>
                </div>

                {/* Background ambient light effects */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
            </main>

            <StockSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onAddStock={addStock}
                watchlist={watchlist}
            />

            <WelcomeModal
                isOpen={isWelcomeOpen}
                onClose={() => setIsWelcomeOpen(false)}
                onAddStock={addStock}
                watchlist={watchlist}
            />

            <AnalysisModal
                ticker={analysisTicker}
                open={isAnalysisOpen}
                onClose={() => setIsAnalysisOpen(false)}
            />

            <StockResearchModal
                isOpen={isResearchOpen}
                onClose={() => setIsResearchOpen(false)}
            />
        </div>
    )
}
