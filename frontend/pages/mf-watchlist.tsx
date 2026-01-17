import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth-context'
import { buildApiUrl, getApiHeaders } from '../lib/api-helpers'
import { Plus, TrendingUp, TrendingDown, RefreshCw, Trash2, MoreVertical, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import MFSearchModal from '../components/MFSearchModal'
import { usePortfolio } from '@/lib/portfolio-context'
import { Tabs } from '@/components/ui/vercel-tabs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WatchlistLoader } from '@/components/ui/watchlist-loader'

type MutualFund = {
    scheme_code: string
    scheme_name: string
    nav: number
    prev_nav: number
    change: number
    change_percent: number
    fund_house: string
    scheme_category: string
    return_1y: number | null
    return_3y: number | null
    return_5y: number | null
    return_10y: number | null
}

type MFWatchlist = {
    watchlist_id: string
    watchlist_name: string
    description?: string
    is_default: boolean
    portfolio_id: string
}

export default function MFWatchlistPage() {
    const router = useRouter()
    const { userEmail, isLoading: authLoading } = useAuth()
    const { currentPortfolio, isLoading: portfolioLoading } = usePortfolio()

    // Watchlist Management State
    const [watchlists, setWatchlists] = useState<MFWatchlist[]>([])
    const [currentWatchlistId, setCurrentWatchlistId] = useState<string | null>(null)
    const [funds, setFunds] = useState<MutualFund[]>([])

    // UI State
    const [loading, setLoading] = useState(true)
    const [loadingFunds, setLoadingFunds] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    // Create Watchlist Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newWatchlistName, setNewWatchlistName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    // Delete States
    const [fundToDelete, setFundToDelete] = useState<string | null>(null)
    const [isDeletingFund, setIsDeletingFund] = useState(false)
    const [watchlistToDelete, setWatchlistToDelete] = useState<MFWatchlist | null>(null)
    const [isDeletingWatchlist, setIsDeletingWatchlist] = useState(false)

    // Fetch watchlists
    useEffect(() => {
        if (authLoading) return
        if (!userEmail) {
            router.push('/')
            return
        }

        document.documentElement.setAttribute('data-theme', 'dark')

        if (!portfolioLoading && currentPortfolio) {
            fetchWatchlists()
        }
    }, [authLoading, userEmail, currentPortfolio, portfolioLoading, router])

    // Fetch funds when watchlist changes
    useEffect(() => {
        if (currentWatchlistId) {
            fetchWatchlistFunds(currentWatchlistId)
        }
    }, [currentWatchlistId])

    const fetchWatchlists = async () => {
        if (!userEmail || !currentPortfolio) return

        try {
            setLoading(true)
            const url = buildApiUrl(userEmail, `mf-portfolio-management/portfolios/${currentPortfolio.portfolio_id}/watchlists`)
            const res = await fetch(url, { headers: getApiHeaders() })
            const data = await res.json()

            if (data.success && data.watchlists) {
                setWatchlists(data.watchlists)

                // Set current watchlist to default or first
                const defaultWatchlist = data.watchlists.find((w: MFWatchlist) => w.is_default)
                const firstWatchlist = data.watchlists[0]

                if (defaultWatchlist) {
                    setCurrentWatchlistId(defaultWatchlist.watchlist_id)
                } else if (firstWatchlist) {
                    setCurrentWatchlistId(firstWatchlist.watchlist_id)
                }
            }
        } catch (error) {
            console.error('Error fetching watchlists:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchWatchlistFunds = async (watchlistId: string) => {
        if (!userEmail) return

        try {
            setLoadingFunds(true)
            const url = buildApiUrl(userEmail, `mf/watchlist?watchlist_id=${watchlistId}`)
            const res = await fetch(url, { headers: getApiHeaders() })
            const data = await res.json()

            if (data.success) {
                setFunds(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching funds:', error)
        } finally {
            setLoadingFunds(false)
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        if (currentWatchlistId) {
            await fetchWatchlistFunds(currentWatchlistId)
        }
        setIsRefreshing(false)
    }

    const handleCreateWatchlist = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userEmail || !currentPortfolio || !newWatchlistName.trim()) return

        try {
            setIsCreating(true)
            const url = buildApiUrl(userEmail, 'mf-portfolio-management/watchlists')
            const res = await fetch(url, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    portfolio_id: currentPortfolio.portfolio_id,
                    watchlist_name: newWatchlistName,
                    is_default: watchlists.length === 0
                })
            })

            const data = await res.json()
            if (data.success) {
                setNewWatchlistName('')
                setIsCreateModalOpen(false)
                await fetchWatchlists()
            } else {
                alert(data.message || 'Failed to create watchlist')
            }
        } catch (error) {
            console.error('Error creating watchlist:', error)
            alert('Error creating watchlist. Please try again.')
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteWatchlist = async () => {
        if (!watchlistToDelete || !userEmail) return

        try {
            setIsDeletingWatchlist(true)
            const url = buildApiUrl(userEmail, `mf-portfolio-management/watchlists/${watchlistToDelete.watchlist_id}`)
            const res = await fetch(url, {
                method: 'DELETE',
                headers: getApiHeaders()
            })

            if (res.ok) {
                setWatchlistToDelete(null)
                await fetchWatchlists()
            }
        } catch (error) {
            console.error('Error deleting watchlist:', error)
        } finally {
            setIsDeletingWatchlist(false)
        }
    }

    const handleAddFund = async (schemeCode: string) => {
        if (!userEmail || !currentWatchlistId) return

        try {
            const url = buildApiUrl(userEmail, 'mf/watchlist')
            const res = await fetch(url, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    scheme_code: schemeCode,
                    watchlist_id: currentWatchlistId
                })
            })

            const data = await res.json()
            if (data.success) {
                await fetchWatchlistFunds(currentWatchlistId)
            } else {
                throw new Error(data.error || 'Failed to add fund')
            }
        } catch (error) {
            console.error('Error adding fund:', error)
            throw error
        }
    }

    const handleDeleteFund = async () => {
        if (!fundToDelete || !userEmail || !currentWatchlistId) return

        try {
            setIsDeletingFund(true)
            const url = buildApiUrl(userEmail, `mf/watchlist/${fundToDelete}?watchlist_id=${currentWatchlistId}`)
            const res = await fetch(url, {
                method: 'DELETE',
                headers: getApiHeaders()
            })

            if (res.ok) {
                setFundToDelete(null)
                await fetchWatchlistFunds(currentWatchlistId)
            }
        } catch (error) {
            console.error('Error deleting fund:', error)
        } finally {
            setIsDeletingFund(false)
        }
    }

    // Create tabs for watchlists
    const tabs = watchlists.map(w => ({
        id: w.watchlist_id,
        label: w.watchlist_name
    }))

    const currentWatchlist = watchlists.find(w => w.watchlist_id === currentWatchlistId)

    if (authLoading || (loading && watchlists.length === 0)) {
        return <WatchlistLoader />
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black text-white">
            {/* Background effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                            MF Watchlist
                        </h1>
                        <p className="text-zinc-400">Track and monitor your favorite mutual funds</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            className="bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all h-10 w-10 p-0 rounded-xl"
                            disabled={isRefreshing}
                        >
                            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        </Button>
                        <Button
                            onClick={() => setIsSearchOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all h-10 px-6 rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add Fund
                        </Button>
                    </div>
                </div>

                {/* Watchlist Tabs */}
                {watchlists.length > 0 && (
                    <div className="border-b border-zinc-800/50 mb-6 flex items-center justify-between">
                        <div className="flex-1 overflow-x-auto no-scrollbar">
                            <Tabs
                                tabs={tabs}
                                activeTab={currentWatchlistId || ''}
                                onChange={setCurrentWatchlistId}
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg"
                            >
                                <Plus size={18} />
                            </Button>
                            {currentWatchlistId && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg"
                                        >
                                            <MoreVertical size={18} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                        <DropdownMenuItem
                                            onClick={() => {
                                                const wl = watchlists.find(w => w.watchlist_id === currentWatchlistId)
                                                if (wl) setWatchlistToDelete(wl)
                                            }}
                                            className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                                        >
                                            <Trash2 size={14} className="mr-2" />
                                            Delete Watchlist
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 px-6 md:px-8 pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full relative z-10">
                {loadingFunds ? (
                    <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                        <div className="bg-zinc-900/50 p-6 rounded-full mb-6">
                            <RefreshCw size={48} className="text-zinc-700 animate-spin" />
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">Fetching fund data...</p>
                    </div>
                ) : watchlists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-[2rem] text-center">
                        <div className="bg-zinc-900/50 p-8 rounded-full mb-8">
                            <Plus size={48} className="text-zinc-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Create a Watchlist First</h3>
                        <p className="text-zinc-400 mb-10 max-w-sm">Start by creating a mutual fund watchlist to organize and track your investments.</p>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-white hover:bg-zinc-200 text-black font-bold h-12 px-10 rounded-2xl shadow-xl shadow-white/5 transition-all"
                        >
                            Create Watchlist
                        </Button>
                    </div>
                ) : funds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-[2rem] text-center">
                        <div className="bg-zinc-900/50 p-8 rounded-full mb-8">
                            <Folder size={48} className="text-zinc-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Watchlist is Empty</h3>
                        <p className="text-zinc-400 mb-10 max-w-sm">Search and add mutual funds to this watchlist to track their performance.</p>
                        <Button
                            onClick={() => setIsSearchOpen(true)}
                            className="bg-white hover:bg-zinc-200 text-black font-bold h-12 px-10 rounded-2xl shadow-xl shadow-white/5 transition-all"
                        >
                            Add Your First Fund
                        </Button>
                    </div>
                ) : (
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-[1.5rem] overflow-hidden shadow-2xl shadow-black/40">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                                        <th className="p-5 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em]">Fund House / Name</th>
                                        <th className="p-5 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">Current NAV</th>
                                        <th className="p-5 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">Day Change (%)</th>
                                        <th className="p-5 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">1Y CAGR</th>
                                        <th className="p-5 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">3Y CAGR</th>
                                        <th className="p-5 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">5Y CAGR</th>
                                        <th className="p-5 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {funds.map((fund) => (
                                        <tr key={fund.scheme_code} className="group hover:bg-zinc-800/40 transition-all">
                                            <td className="p-5">
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{fund.fund_house}</div>
                                                <div className="font-bold text-white truncate max-w-[300px] uppercase tracking-tight group-hover:text-blue-400 transition-colors">{fund.scheme_name}</div>
                                            </td>
                                            <td className="p-5 text-right tabular-nums">
                                                <div className="font-bold text-white tracking-tight">₹{fund.nav.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                            </td>
                                            <td className="p-5 text-right tabular-nums">
                                                <div className={`flex items-center justify-end gap-1 font-bold ${fund.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {fund.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {Math.abs(fund.change_percent).toFixed(2)}%
                                                </div>
                                                <div className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">
                                                    {fund.change >= 0 ? '+' : ''}{fund.change.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="p-5 text-right tabular-nums">
                                                <span className={`text-sm font-bold ${fund.return_1y && fund.return_1y > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                                    {fund.return_1y ? `${fund.return_1y.toFixed(2)}%` : '--'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right tabular-nums">
                                                <span className={`text-sm font-bold ${fund.return_3y && fund.return_3y > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                                    {fund.return_3y ? `${fund.return_3y.toFixed(2)}%` : '--'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right tabular-nums">
                                                <span className={`text-sm font-bold ${fund.return_5y && fund.return_5y > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                                    {fund.return_5y ? `${fund.return_5y.toFixed(2)}%` : '--'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <Button
                                                    onClick={() => setFundToDelete(fund.scheme_code)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg group/btn"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Watchlist Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Create MF Watchlist</h3>
                        <form onSubmit={handleCreateWatchlist}>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Watchlist Name</label>
                                    <Input
                                        value={newWatchlistName}
                                        onChange={(e) => setNewWatchlistName(e.target.value)}
                                        placeholder="e.g. Growth Funds"
                                        className="bg-black border-zinc-800 text-white"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isCreating}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 rounded-xl"
                                    >
                                        {isCreating ? 'Creating...' : 'Create Watchlist'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Search Modal */}
            <MFSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onAddFund={handleAddFund}
            />

            {/* Delete Fund Modal */}
            <DeleteConfirmModal
                isOpen={!!fundToDelete}
                onClose={() => setFundToDelete(null)}
                onConfirm={handleDeleteFund}
                title="Remove Fund"
                description="Are you sure you want to remove this fund from your watchlist?"
                isLoading={isDeletingFund}
            />

            {/* Delete Watchlist Modal */}
            <DeleteConfirmModal
                isOpen={!!watchlistToDelete}
                onClose={() => setWatchlistToDelete(null)}
                onConfirm={handleDeleteWatchlist}
                title="Delete Watchlist"
                description={`Are you sure you want to delete "${watchlistToDelete?.watchlist_name}"? All funds in this watchlist will be removed.`}
                isLoading={isDeletingWatchlist}
            />
        </div>
    )
}
