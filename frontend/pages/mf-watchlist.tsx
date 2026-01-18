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

    const getRandomColor = (symbol: string) => {
        const colors = [
            'bg-gradient-to-br from-blue-500 to-blue-600',
            'bg-gradient-to-br from-purple-500 to-purple-600',
            'bg-gradient-to-br from-pink-500 to-pink-600',
            'bg-gradient-to-br from-emerald-500 to-emerald-600',
            'bg-gradient-to-br from-amber-500 to-amber-600',
        ];
        const index = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };
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

    const tabs = watchlists.map(w => ({
        id: w.watchlist_id,
        label: w.watchlist_name
    }))

    const currentWatchlist = watchlists.find(w => w.watchlist_id === currentWatchlistId)

    if (authLoading || (loading && watchlists.length === 0)) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-black">
                <WatchlistLoader />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black text-white">
            {/* Background effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                {/* Unified Header - Smaller */}
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-1.5 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                                MF Watchlist
                            </h1>
                            <p className="text-zinc-400 text-sm">Track and monitor your favorite mutual funds with real-time NAV updates</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleRefresh}
                                disabled={isRefreshing || !currentWatchlistId}
                                className="bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 gap-2 font-medium text-sm h-9 px-4 border border-zinc-800 rounded-xl transition-all"
                                title="Refresh data"
                            >
                                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </Button>
                            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                                <Button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-9 px-5 rounded-[11px] transition-all"
                                >
                                    <Plus size={16} />
                                    Add Fund
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Watchlist Tabs with inline + button */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <Tabs
                            tabs={tabs}
                            activeTab={currentWatchlistId || ''}
                            onTabChange={(id) => setCurrentWatchlistId(id)}
                            className="[&>div>div>div]:h-[42px] [&>div>div>div]:px-5 [&>div>div>div]:text-[15px]"
                        />
                        <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-2">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-zinc-400 hover:text-white hover:bg-white/5"
                                title="New Watchlist"
                            >
                                <Plus size={18} />
                            </button>
                            {currentWatchlistId && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all outline-none"
                                            title="Delete Watchlist"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-60 bg-[#09090b] border-zinc-800 text-white p-1 shadow-2xl z-[120]">
                                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">
                                            Select Watchlist to Delete
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                                            {watchlists.map(w => (
                                                <DropdownMenuItem
                                                    key={w.watchlist_id}
                                                    className="flex items-center justify-between focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-md px-3 py-2.5 transition-colors group"
                                                    onClick={() => setWatchlistToDelete(w)}
                                                >
                                                    <span className="text-sm font-medium truncate pr-4">{w.watchlist_name}</span>
                                                    <Trash2 size={12} className="text-zinc-600 group-hover:text-red-500/60 transition-colors" />
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 px-6 md:px-8 pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full relative z-10">
                {loadingFunds ? (
                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <div className="scale-75">
                            <WatchlistLoader />
                        </div>
                    </div>
                ) : watchlists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-[2rem] text-center">
                        <div className="bg-zinc-900/50 p-8 rounded-full mb-8">
                            <Plus size={48} className="text-zinc-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Create a Watchlist First</h3>
                        <p className="text-zinc-400 mb-10 max-w-sm">Start by creating a mutual fund watchlist to organize and track your investments.</p>
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5 transition-transform hover:scale-105">
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-black hover:bg-zinc-900 text-white font-bold h-11 px-10 rounded-[11px] transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Watchlist
                            </Button>
                        </div>
                    </div>
                ) : funds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-[2rem] text-center">
                        <div className="bg-zinc-900/50 p-8 rounded-full mb-8">
                            <Folder size={48} className="text-zinc-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Watchlist is Empty</h3>
                        <p className="text-zinc-400 mb-10 max-w-sm">Search and add mutual funds to this watchlist to track their performance.</p>
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5 transition-transform hover:scale-105">
                            <Button
                                onClick={() => setIsSearchOpen(true)}
                                className="bg-black hover:bg-zinc-900 text-white font-bold h-11 px-10 rounded-[11px] transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Fund
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
                                        <th className="px-6 py-4 w-[350px]">Mutual Fund Scheme</th>
                                        <th className="px-6 py-4 text-right w-[140px]">Current NAV</th>
                                        <th className="px-6 py-4 text-right w-[160px]">Day Change (%)</th>
                                        <th className="px-6 py-4 text-right w-[110px]">1Y Return</th>
                                        <th className="px-6 py-4 text-right w-[110px]">3Y Return</th>
                                        <th className="px-6 py-4 text-right w-[110px]">5Y Return</th>
                                        <th className="px-6 py-4 text-center w-[80px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {funds.map((fund) => {
                                        const houseInitial = fund.fund_house.substring(0, 1).toUpperCase();
                                        const isPositive = fund.change >= 0;

                                        return (
                                            <tr
                                                key={fund.scheme_code}
                                                className="group hover:bg-white/5 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/mf-performance?scheme=${fund.scheme_code}`)}
                                            >
                                                <td className="px-6 py-4 w-[350px]">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`
                                                            w-10 h-10 rounded-lg flex items-center justify-center 
                                                            text-white font-black text-sm shadow-md shrink-0
                                                            ${getRandomColor(fund.fund_house)}
                                                        `}>
                                                            {houseInitial}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5 truncate">{fund.fund_house}</div>
                                                            <div className="font-bold text-gray-100 text-sm group-hover:text-blue-400 transition-colors truncate uppercase tracking-tight">{fund.scheme_name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums w-[140px]">
                                                    <div className="font-bold text-white tracking-tight">₹{fund.nav.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums w-[160px]">
                                                    <div className={`flex items-center justify-end gap-1 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                        {Math.abs(fund.change_percent).toFixed(2)}%
                                                    </div>
                                                    <div className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-widest">
                                                        {isPositive ? '+' : ''}{fund.change.toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums w-[110px]">
                                                    <span className={`text-sm font-bold ${fund.return_1y && fund.return_1y > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                        {fund.return_1y ? `${fund.return_1y.toFixed(1)}%` : '--'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums w-[110px]">
                                                    <span className={`text-sm font-bold ${fund.return_3y && fund.return_3y > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                        {fund.return_3y ? `${fund.return_3y.toFixed(1)}%` : '--'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums w-[110px]">
                                                    <span className={`text-sm font-bold ${fund.return_5y && fund.return_5y > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                        {fund.return_5y ? `${fund.return_5y.toFixed(1)}%` : '--'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center w-[80px]" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        onClick={() => setFundToDelete(fund.scheme_code)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                                <div className="flex gap-3 pt-4">
                                    <div className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5 transition-transform hover:scale-[1.02]">
                                        <Button
                                            type="submit"
                                            disabled={isCreating}
                                            className="w-full bg-black hover:bg-zinc-900 text-white font-bold h-10 rounded-[11px]"
                                        >
                                            {isCreating ? 'Creating...' : 'Create Watchlist'}
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 text-zinc-400 hover:text-white"
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
