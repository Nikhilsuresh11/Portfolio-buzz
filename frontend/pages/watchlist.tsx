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
import { MessageLoading } from '@/components/ui/message-loading'
import { Plus, Trash2, Edit2, MoreVertical, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePortfolio } from '@/lib/portfolio-context'

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
                setWatchlists(data.watchlists)

                // Determine which watchlist to select
                if (data.watchlists.length > 0) {
                    // Try to preserve current selection if valid
                    const currentStillExists = data.watchlists.find((w: UserWatchlist) => w.watchlist_id === currentWatchlistId)

                    if (currentStillExists) {
                        // Do nothing, useEffect will trigger if needed, or we just keep showing current
                        if (!currentWatchlistId) setCurrentWatchlistId(currentStillExists.watchlist_id)
                    } else {
                        // Default
                        const defaultW = data.watchlists.find((w: UserWatchlist) => w.is_default)
                        setCurrentWatchlistId(defaultW ? defaultW.watchlist_id : data.watchlists[0].watchlist_id)
                    }
                } else {
                    // No watchlists found, user might need to create one or we create a default
                    setWatchlists([])
                    setStocks([])
                    setLoading(false)
                }
            }
        } catch (error) {
            console.error('Error fetching watchlists:', error)
            setLoading(false)
        }
    }

    const fetchWatchlistStocks = async (watchlistId: string) => {
        try {
            setLoading(true)
            const token = getToken()
            if (!token) return

            const headers = { 'Authorization': `Bearer ${token}` }

            // Fetch watchlist stocks, prices, and news
            // Note: Update Fetch URL to use watchlist_id query param
            const [watchlistRes, pricesRes, newsRes] = await Promise.all([
                fetch(`${config.API_BASE_URL}/api/watchlist?watchlist_id=${watchlistId}`, { headers }),
                fetch(`${config.API_BASE_URL}/api/watchlist/price?watchlist_id=${watchlistId}`, { headers }),
                fetch(`${config.API_BASE_URL}/api/watchlist/news?time_filter=week&watchlist_id=${watchlistId}`, { headers })
            ])

            const watchlistData = await watchlistRes.json()
            const pricesData = await pricesRes.json()
            const newsDataResponse = await newsRes.json()

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
                                prev_close: priceInfo.prev_close
                            }
                        }
                        return stock
                    })
                }

                if (newsDataResponse.success && newsDataResponse.data) {
                    setNewsData(newsDataResponse.data)
                }

                setStocks(fetchedStocks)

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

    const addStock = async (ticker: string) => {
        try {
            const token = getToken()
            if (!token || !currentWatchlistId) return

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
                fetchWatchlistStocks(currentWatchlistId)
                setSelectedTicker(ticker)
            }
        } catch (error) {
            console.error('Error adding stock:', error)
        }
    }

    const removeStock = async (ticker: string) => {
        try {
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
        }
    }

    const handleAnalyze = (ticker: string) => {
        setAnalysisTicker(ticker)
        setIsAnalysisOpen(true)
    }

    if (loading && !currentWatchlistId && watchlists.length === 0) {
        return (
            <div className="flex min-h-screen bg-black text-white">
                <Sidebar
                    onSearchClick={() => setIsSearchOpen(true)}
                    onResearchClick={() => setIsResearchOpen(true)}
                />
                <div className="flex-1 flex items-center justify-center">
                    <MessageLoading />
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-[#000] to-[#1A2428] text-white">
            <Sidebar
                onSearchClick={() => setIsSearchOpen(true)}
                onResearchClick={() => setIsResearchOpen(true)}
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <div className='p-6 pb-0 z-10'>
                    <Header user={user?.name || 'User'} />

                    {/* Watchlist Tabs */}
                    <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                        {watchlists.map(w => (
                            <div
                                key={w.watchlist_id}
                                onClick={() => setCurrentWatchlistId(w.watchlist_id)}
                                className={`
                                    group flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-all border
                                    ${currentWatchlistId === w.watchlist_id
                                        ? 'bg-blue-600 border-blue-500 text-white'
                                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-neutral-200'
                                    }
                                `}
                            >
                                <span className="text-sm font-medium">{w.watchlist_name}</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/20 ${currentWatchlistId === w.watchlist_id ? 'opacity-100' : ''}`}>
                                            <MoreVertical size={14} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#1A1A1A] border-white/10 text-white">
                                        <DropdownMenuItem
                                            onClick={(e) => { e.stopPropagation(); handleDeleteWatchlist(w.watchlist_id) }}
                                            className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Watchlist
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
                        >
                            <Plus size={16} />
                            <span className="text-sm font-medium">New List</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 p-6 pt-4 overflow-hidden">
                    <div className="overflow-y-auto pr-2 custom-scrollbar">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-1 h-full shadow-xl">
                            {stocks.length > 0 ? (
                                <StockTable
                                    rows={stocks}
                                    onSelect={setSelectedTicker}
                                    onAnalyze={handleAnalyze}
                                    onRemove={removeStock}
                                    selectedTicker={selectedTicker}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-neutral-400 p-8 text-center">
                                    <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
                                    <h3 className="text-lg font-semibold mb-2">Watchlist is empty</h3>
                                    <p className="text-sm max-w-xs mx-auto mb-6">
                                        Add stocks to track their performance and get AI-powered insights.
                                    </p>
                                    <Button
                                        onClick={() => setIsSearchOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Stocks
                                    </Button>
                                </div>
                            )}
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
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Watchlist</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">
                                    Watchlist Name
                                </label>
                                <Input
                                    value={newWatchlistName}
                                    onChange={(e) => setNewWatchlistName(e.target.value)}
                                    placeholder="e.g. High Growth, Dividend Stocks"
                                    className="bg-white/5 border-white/10 text-white"
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
                                <Button
                                    onClick={handleCreateWatchlist}
                                    disabled={!newWatchlistName.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Create
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
