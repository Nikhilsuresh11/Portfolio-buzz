import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import StockTable from '../components/StockTable'
import RelatedNews from '../components/RelatedNews'
import StockSearchModal from '../components/StockSearchModal'
import StockResearchModal from '../components/StockResearchModal'
import WelcomeModal from '../components/WelcomeModal'
import AnalysisModal from '../components/AnalysisModal'
import { getToken, getUser } from '../lib/auth'
import { config } from '../config'
import { WatchlistLoader } from '@/components/ui/watchlist-loader'
import { Plus, Trash2, Edit2, MoreVertical, LayoutGrid, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePortfolio } from '@/lib/portfolio-context'
import { Tabs } from '@/components/ui/vercel-tabs'

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

type UserWatchlist = {
    watchlist_id: string;
    watchlist_name: string;
    description?: string;
    is_default: boolean;
    portfolio_id: string;
}

export default function Watchlist() {
    const router = useRouter()
    const { currentPortfolio } = usePortfolio()

    // Auth & User State
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [dataLoaded, setDataLoaded] = useState(false)

    // Watchlist Management State
    const [watchlists, setWatchlists] = useState<UserWatchlist[]>([])
    const [currentWatchlistId, setCurrentWatchlistId] = useState<string | null>(null)
    const [stocks, setStocks] = useState<Stock[]>([])

    // UI State
    const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isResearchOpen, setIsResearchOpen] = useState(false)
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
    const [analysisTicker, setAnalysisTicker] = useState<string | null>(null)

    // Create Watchlist Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newWatchlistName, setNewWatchlistName] = useState('')

    // Data
    const [newsData, setNewsData] = useState<Record<string, any[]>>({})
    const [deletingTicker, setDeletingTicker] = useState<string | null>(null)

    useEffect(() => {
        const token = getToken()
        const userData = getUser()

        if (!token || !userData) {
            router.push('/auth/login')
            return
        }

        setUser(userData)

        const savedTheme = localStorage.getItem('pb_theme') as 'light' | 'dark' | null
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme)
        } else {
            document.documentElement.setAttribute('data-theme', 'dark')
            localStorage.setItem('pb_theme', 'dark')
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setIsSearchOpen(prev => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Fetch watchlists when portfolio changes
    useEffect(() => {
        if (user && currentPortfolio) {
            fetchWatchlists()
        } else if (user && !currentPortfolio) {
            // Fallback if no portfolio context yet (or standalone usage), fetch all user watchlists
            // Or maybe we don't fetch anything until portfolio is ready.
            // But let's verify if we can fetch all watchlists without portfolio_id
            fetchAllUserWatchlists()
        }
    }, [user, currentPortfolio])

    // Fetch stocks when current watchlist changes
    useEffect(() => {
        if (currentWatchlistId) {
            fetchWatchlistStocks(currentWatchlistId)
        }
    }, [currentWatchlistId])

    const fetchAllUserWatchlists = async () => {
        try {
            const token = getToken()
            if (!token) return

            const res = await fetch(`${config.API_BASE_URL}/api/portfolio-management/watchlists`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success && data.watchlists.length > 0) {
                setWatchlists(data.watchlists)
                // Select default or first
                const defaultW = data.watchlists.find((w: UserWatchlist) => w.is_default)
                setCurrentWatchlistId(defaultW ? defaultW.watchlist_id : data.watchlists[0].watchlist_id)
            } else {
                setWatchlists([])
                setStocks([])
                setLoading(false)
                setDataLoaded(true)
            }
        } catch (error) {
            console.error('Error fetching user watchlists:', error)
            setLoading(false)
        }
    }

    const fetchWatchlists = async () => {
        try {
            setLoading(true)
            const token = getToken()
            if (!token) return

            // If we have a current portfolio, fetch watchlists for that portfolio
            const url = currentPortfolio
                ? `${config.API_BASE_URL}/api/portfolio-management/portfolios/${currentPortfolio.portfolio_id}/watchlists`
                : `${config.API_BASE_URL}/api/portfolio-management/watchlists`

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const data = await res.json()

            if (data.success) {
                if (data.watchlists.length > 0) {
                    setWatchlists(data.watchlists)

                    // Determine which watchlist to select
                    const currentStillExists = data.watchlists.find((w: UserWatchlist) => w.watchlist_id === currentWatchlistId)

                    if (currentStillExists) {
                        if (!currentWatchlistId) setCurrentWatchlistId(currentStillExists.watchlist_id)
                        // If it didn't change, we still need to clear loading if useEffect won't run
                        if (currentWatchlistId === currentStillExists.watchlist_id) {
                            setLoading(false)
                            setDataLoaded(true)
                        }
                    } else {
                        const defaultW = data.watchlists.find((w: UserWatchlist) => w.is_default)
                        setCurrentWatchlistId(defaultW ? defaultW.watchlist_id : data.watchlists[0].watchlist_id)
                    }
                } else {
                    setWatchlists([])
                    setStocks([])
                    setLoading(false)
                    setDataLoaded(true)
                }
            } else {
                setLoading(false)
                setDataLoaded(true)
            }
        } catch (error) {
            console.error('Error fetching watchlists:', error)
            setLoading(false)
        }
    }

    const fetchWatchlistStocks = async (watchlistId: string) => {
        try {
            setLoading(true)
            setDataLoaded(false)
            const token = getToken()
            if (!token) return

            const headers = { 'Authorization': `Bearer ${token}` }

            // Fetch watchlist stocks, prices, and news - wait for ALL to complete
            const [watchlistRes, pricesRes, newsRes] = await Promise.all([
                fetch(`${config.API_BASE_URL}/api/watchlist?watchlist_id=${watchlistId}`, { headers }),
                fetch(`${config.API_BASE_URL}/api/watchlist/price?watchlist_id=${watchlistId}`, { headers }),
                fetch(`${config.API_BASE_URL}/api/watchlist/news?time_filter=week&watchlist_id=${watchlistId}`, { headers })
            ])

            // Wait for ALL JSON parsing to complete
            const [watchlistData, pricesData, newsDataResponse] = await Promise.all([
                watchlistRes.json(),
                pricesRes.json(),
                newsRes.json()
            ])

            if (watchlistData.success) {
                let fetchedStocks = watchlistData.data as Stock[]

                if (pricesData.success && pricesData.data) {
                    fetchedStocks = fetchedStocks.map(stock => {
                        const priceInfo = pricesData.data[stock.ticker] || pricesData.data[stock.ticker.toUpperCase()]
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
                                prev_close: priceInfo.prev_close,
                                historical_returns: priceInfo.historical_returns  // Add historical returns
                            }
                        }
                        return stock
                    })
                }

                if (newsDataResponse.success && newsDataResponse.data) {
                    setNewsData(newsDataResponse.data)
                }

                setStocks(fetchedStocks)
                setDataLoaded(true) // Mark data as loaded only after everything is ready

                if (fetchedStocks.length === 0) {
                    const hasShown = sessionStorage.getItem('welcome_shown')
                    if (!hasShown) {
                        setIsWelcomeOpen(true)
                        sessionStorage.setItem('welcome_shown', 'true')
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching watchlist data:', error)
            setDataLoaded(true) // Still mark as loaded to show error state
        } finally {
            setLoading(false)
        }
    }

    const handleCreateWatchlist = async () => {
        if (!newWatchlistName.trim()) return

        try {
            const token = getToken()
            if (!token) return

            const res = await fetch(`${config.API_BASE_URL}/api/portfolio-management/watchlists`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    watchlist_name: newWatchlistName,
                    portfolio_id: currentPortfolio?.portfolio_id || 'default',
                    description: 'Created via web',
                    is_default: watchlists.length === 0 // If first one, make default
                })
            })

            const data = await res.json()
            if (data.success) {
                setNewWatchlistName('')
                setIsCreateModalOpen(false)
                await fetchWatchlists() // Refresh list
                setCurrentWatchlistId(data.watchlist.watchlist_id) // Switch to new one
            }
        } catch (error) {
            console.error('Error creating watchlist:', error)
        }
    }

    const handleDeleteWatchlist = async (id: string) => {
        if (!confirm('Are you sure you want to delete this watchlist?')) return

        try {
            const token = getToken()
            if (!token) return

            const res = await fetch(`${config.API_BASE_URL}/api/portfolio-management/watchlists/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const data = await res.json()
            if (data.success) {
                fetchWatchlists() // Refresh list
                if (currentWatchlistId === id) {
                    setCurrentWatchlistId(null) // Reset selection, useEffect will pick new default
                }
            } else {
                alert(data.message || "Could not delete watchlist")
            }
        } catch (error) {
            console.error('Error deleting watchlist:', error)
        }
    }


    // Refresh watchlist data without showing the full page loader
    const refreshWatchlistData = async (watchlistId: string) => {
        try {
            const token = getToken()
            if (!token) return

            const headers = { 'Authorization': `Bearer ${token}` }

            // Fetch watchlist stocks, prices, and news in background
            const [watchlistRes, pricesRes, newsRes] = await Promise.all([
                fetch(`${config.API_BASE_URL}/api/watchlist?watchlist_id=${watchlistId}`, { headers }),
                fetch(`${config.API_BASE_URL}/api/watchlist/price?watchlist_id=${watchlistId}`, { headers }),
                fetch(`${config.API_BASE_URL}/api/watchlist/news?time_filter=week&watchlist_id=${watchlistId}`, { headers })
            ])

            const [watchlistData, pricesData, newsDataResponse] = await Promise.all([
                watchlistRes.json(),
                pricesRes.json(),
                newsRes.json()
            ])

            if (watchlistData.success) {
                let fetchedStocks = watchlistData.data as Stock[]

                if (pricesData.success && pricesData.data) {
                    fetchedStocks = fetchedStocks.map(stock => {
                        const priceInfo = pricesData.data[stock.ticker] || pricesData.data[stock.ticker.toUpperCase()]
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
                                prev_close: priceInfo.prev_close,
                                historical_returns: priceInfo.historical_returns
                            }
                        }
                        return stock
                    })
                }

                if (newsDataResponse.success && newsDataResponse.data) {
                    setNewsData(newsDataResponse.data)
                }

                setStocks(fetchedStocks)
            }
        } catch (error) {
            console.error('Error refreshing watchlist data:', error)
        }
    }

    const addStock = async (ticker: string) => {
        try {
            const token = getToken()
            if (!token || !currentWatchlistId) throw new Error("Please log in and select a watchlist first.")

            const res = await fetch(`${config.API_BASE_URL}/api/watchlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ticker,
                    watchlist_id: currentWatchlistId
                })
            })

            const data = await res.json()
            if (data.success) {
                // Refresh data in background without loader
                await refreshWatchlistData(currentWatchlistId)
                setSelectedTicker(ticker)
                setIsSearchOpen(false)  // Close search modal
                return true
            } else {
                throw new Error(data.message || "Failed to add stock")
            }
        } catch (error: any) {
            console.error('Error adding stock:', error)
            throw error
        }
    }

    const removeStock = async (ticker: string) => {
        try {
            setDeletingTicker(ticker)  // Start loading
            const token = getToken()
            if (!token || !currentWatchlistId) return

            const res = await fetch(`${config.API_BASE_URL}/api/watchlist/${ticker}?watchlist_id=${currentWatchlistId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await res.json()
            if (data.success) {
                setStocks(prev => prev.filter(s => s.ticker !== ticker))
                if (selectedTicker === ticker) {
                    setSelectedTicker(null)
                }
            }
        } catch (error) {
            console.error('Error removing stock:', error)
        } finally {
            setDeletingTicker(null)  // Stop loading
        }
    }

    const handleAnalyze = (ticker: string) => {
        setAnalysisTicker(ticker)
        setIsAnalysisOpen(true)
    }

    // Show loading until data is fully loaded
    if (loading && !dataLoaded) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-black">
                <WatchlistLoader />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black">
            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                {/* Unified Header - Smaller */}
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-1.5 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                                My Watchlist
                            </h1>
                            <p className="text-zinc-400 text-sm">Track and monitor your favorite assets with real-time insights</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                                <Button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-9 px-5 rounded-[11px]"
                                >
                                    <Plus size={16} />
                                    Add Stock
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Watchlist Tabs with inline + button */}
                <div className="flex items-center gap-2 px-6 md:px-8">
                    <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <Tabs
                            tabs={watchlists.map(w => ({ id: w.watchlist_id, label: w.watchlist_name }))}
                            activeTab={currentWatchlistId || undefined}
                            onTabChange={(tabId) => setCurrentWatchlistId(tabId)}
                            className="[&>div>div>div]:h-[42px] [&>div>div>div]:px-5 [&>div>div>div]:text-[15px]"
                        />
                        <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-2">
                            <button
                                onClick={() => currentPortfolio && setIsCreateModalOpen(true)}
                                disabled={!currentPortfolio}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${!currentPortfolio
                                        ? 'text-zinc-600 cursor-not-allowed opacity-50'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                                title={currentPortfolio ? "New Watchlist" : "Please create a portfolio first"}
                            >
                                <Plus size={18} />
                            </button>
                            {currentWatchlistId && watchlists.length > 0 && (
                                <button
                                    onClick={() => handleDeleteWatchlist(currentWatchlistId)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all"
                                    title="Delete Watchlist"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area - No gap, directly attached to tabs */}
            <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 overflow-hidden max-w-[1600px] mx-auto w-full" style={{ paddingTop: '0px' }}>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 h-full">
                    {/* Stock Table - Scrollable with sticky header */}
                    <div className="bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col">
                        {stocks.length > 0 ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <StockTable
                                    rows={stocks}
                                    onSelect={setSelectedTicker}
                                    onAnalyze={handleAnalyze}
                                    onRemove={removeStock}
                                    selectedTicker={selectedTicker}
                                    deletingTicker={deletingTicker}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-400 p-8 text-center bg-black/60 backdrop-blur-md">
                                {watchlists.length === 0 ? (
                                    <>
                                        <div className="w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-white/5 shadow-2xl shadow-blue-500/20">
                                            {currentPortfolio ? (
                                                <LayoutGrid className="w-8 h-8 text-blue-400" />
                                            ) : (
                                                <Folder className="w-8 h-8 text-purple-400" />
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            {currentPortfolio ? "Create your first Watchlist" : "Welcome to Portfolio Buzz"}
                                        </h3>
                                        <p className="text-sm text-neutral-400 max-w-xs mx-auto mb-8 leading-relaxed">
                                            {currentPortfolio
                                                ? "Create a watchlist to start tracking stocks, analyzing trends, and getting AI insights."
                                                : "To get started, please go to the Settings to create your first Portfolio."}
                                        </p>

                                        {currentPortfolio ? (
                                            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                                                <Button
                                                    onClick={() => setIsCreateModalOpen(true)}
                                                    className="bg-black hover:bg-zinc-900 text-white rounded-[11px] h-10 px-6 font-semibold"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Create Watchlist
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-0.5">
                                                <Button
                                                    onClick={() => router.push('/settings')}
                                                    className="bg-black hover:bg-zinc-900 text-white rounded-[11px] h-10 px-6 font-semibold"
                                                >
                                                    <Folder className="w-4 h-4 mr-2" />
                                                    Create Portfolio
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
                                        <h3 className="text-lg font-semibold mb-2">Watchlist is empty</h3>
                                        <p className="text-sm max-w-xs mx-auto mb-6">
                                            Add stocks to track their performance and get AI-powered insights.
                                        </p>
                                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                                            <Button
                                                onClick={() => setIsSearchOpen(true)}
                                                className="bg-black hover:bg-zinc-900 text-white rounded-[11px]"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Stocks
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* News Panel - Scrollable with sticky header - Hidden when analysis modal is open */}
                    {!isAnalysisOpen && (
                        <div className="hidden lg:block bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                            <RelatedNews
                                ticker={selectedTicker}
                                watchlistId={currentWatchlistId}
                                onClose={() => setSelectedTicker(null)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

            <StockSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onAddStock={addStock}
                watchlist={stocks}
            />

            <WelcomeModal
                isOpen={isWelcomeOpen}
                onClose={() => setIsWelcomeOpen(false)}
                onAddStock={addStock}
                watchlist={stocks}
            />

            <AnalysisModal
                ticker={analysisTicker}
                open={isAnalysisOpen}
                onClose={() => setIsAnalysisOpen(false)}
                newsArticles={analysisTicker ? newsData[analysisTicker] || [] : []}
            />

            <StockResearchModal
                isOpen={isResearchOpen}
                onClose={() => setIsResearchOpen(false)}
            />

            {/* Create Watchlist Modal */}
            {
                isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6">Create New Watchlist</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                                        Watchlist Name
                                    </label>
                                    <Input
                                        value={newWatchlistName}
                                        onChange={(e) => setNewWatchlistName(e.target.value)}
                                        placeholder="e.g. High Growth, Dividend Stocks"
                                        className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-blue-500/50"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="text-neutral-400 hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                    <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                                        <Button
                                            onClick={handleCreateWatchlist}
                                            disabled={!newWatchlistName.trim()}
                                            className="bg-black hover:bg-zinc-900 text-white rounded-[11px] disabled:opacity-50"
                                        >
                                            Create
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
