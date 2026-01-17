import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth-context'
import { buildApiUrl, getApiHeaders } from '../lib/api-helpers'
import { Plus, TrendingUp, TrendingDown, RefreshCw, Trash2, Edit2, MoreVertical, Folder } from 'lucide-react'
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
            console.log('Creating watchlist at:', url)
            console.log('Payload:', {
                portfolio_id: currentPortfolio.portfolio_id,
                watchlist_name: newWatchlistName,
                is_default: watchlists.length === 0
            })

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
            console.log('Response:', data)

            if (data.success) {
                setNewWatchlistName('')
                setIsCreateModalOpen(false)
                await fetchWatchlists()
            } else {
                console.error('Failed to create watchlist:', data.message || data.error)
                alert(data.message || data.error || 'Failed to create watchlist')
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

    console.log('[MF Watchlist] Watchlists:', watchlists)
    console.log('[MF Watchlist] Tabs:', tabs)
    console.log('[MF Watchlist] Current watchlist ID:', currentWatchlistId)

    const currentWatchlist = watchlists.find(w => w.watchlist_id === currentWatchlistId)

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black">
            {/* Background effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-1.5 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                            Mutual Funds Watchlist
                        </h1>
                        <p className="text-zinc-400 text-sm">Track your favorite mutual funds with real-time NAV updates</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing || !currentWatchlistId}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 font-medium text-sm h-9 px-4 border border-zinc-800 rounded-xl"
                        >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                            <Button
                                onClick={() => setIsSearchOpen(true)}
                                disabled={!currentWatchlistId}
                                className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-9 px-5 rounded-[11px]"
                            >
                                <Plus size={16} />
                                Add Fund
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Watchlist Tabs */}
                {watchlists.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                        <Tabs
                            tabs={tabs}
                            activeTab={currentWatchlistId || ''}
                            onTabChange={(value) => setCurrentWatchlistId(value)}
                        />

                        {/* Watchlist Actions */}
                        {currentWatchlist && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    >
                                        <MoreVertical size={16} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                    <DropdownMenuItem
                                        onClick={() => setWatchlistToDelete(currentWatchlist)}
                                        className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                                    >
                                        <Trash2 size={14} className="mr-2" />
                                        Delete Watchlist
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Create New Watchlist Button */}
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2"
                        >
                            <Plus size={14} />
                            New Watchlist
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex-1 px-6 md:p-8 pb-6 md:pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full">
                {loading || portfolioLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                        <div className="text-zinc-400 text-sm">Loading mutual fund data...</div>
                    </div>
                ) : watchlists.length === 0 ? (
                    // No watchlists - show create prompt
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center border border-white/5">
                            <Folder className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No MF Watchlists Yet</h3>
                        <p className="text-zinc-400 text-center mb-8 max-w-md">
                            Create your first mutual fund watchlist to start tracking funds
                        </p>
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-10 px-6 rounded-[11px]"
                            >
                                <Plus size={16} />
                                Create Watchlist
                            </Button>
                        </div>
                    </div>
                ) : loadingFunds ? (
                    // Loading funds
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative mb-4">
                            <div className="w-12 h-12 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                        <div className="text-zinc-400 text-sm">Loading fund data...</div>
                    </div>
                ) : funds.length > 0 ? (
                    // Show funds table
                    <div className="bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-900/50 border-b border-zinc-800/50">
                                    <tr>
                                        <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fund Name</th>
                                        <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Category</th>
                                        <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prev NAV</th>
                                        <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Current NAV</th>
                                        <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Day Change</th>
                                        <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">1Y CAGR</th>
                                        <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">3Y CAGR</th>
                                        <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">5Y CAGR</th>
                                        <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">10Y CAGR</th>
                                        <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {funds.map((fund) => (
                                        <tr key={fund.scheme_code} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-semibold text-white text-sm">{fund.scheme_name}</div>
                                                    <div className="text-xs text-zinc-500">{fund.fund_house}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-zinc-400">{fund.scheme_category || 'N/A'}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="text-zinc-400 text-sm">₹{fund.prev_nav ? fund.prev_nav.toFixed(2) : '-'}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="text-white font-semibold">₹{fund.nav.toFixed(2)}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {fund.change_percent >= 0 ? (
                                                        <TrendingUp size={14} className="text-green-500" />
                                                    ) : (
                                                        <TrendingDown size={14} className="text-red-500" />
                                                    )}
                                                    <span className={fund.change_percent >= 0 ? 'text-green-500 text-sm font-medium' : 'text-red-500 text-sm font-medium'}>
                                                        {fund.change_percent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                {fund.return_1y !== null && fund.return_1y !== undefined ? (
                                                    <span className={fund.return_1y >= 0 ? 'text-green-500 text-sm font-medium' : 'text-red-500 text-sm font-medium'}>
                                                        {fund.return_1y.toFixed(2)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-600 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {fund.return_3y !== null && fund.return_3y !== undefined ? (
                                                    <span className={fund.return_3y >= 0 ? 'text-green-500 text-sm font-medium' : 'text-red-500 text-sm font-medium'}>
                                                        {fund.return_3y.toFixed(2)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-600 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {fund.return_5y !== null && fund.return_5y !== undefined ? (
                                                    <span className={fund.return_5y >= 0 ? 'text-green-500 text-sm font-medium' : 'text-red-500 text-sm font-medium'}>
                                                        {fund.return_5y.toFixed(2)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-600 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {fund.return_10y !== null && fund.return_10y !== undefined ? (
                                                    <span className={fund.return_10y >= 0 ? 'text-green-500 text-sm font-medium' : 'text-red-500 text-sm font-medium'}>
                                                        {fund.return_10y.toFixed(2)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-600 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                                    onClick={() => setFundToDelete(fund.scheme_code)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // Empty watchlist
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center border border-white/5">
                            <TrendingUp className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Funds in this Watchlist</h3>
                        <p className="text-zinc-400 text-center mb-8 max-w-md">
                            Add mutual funds to track their performance
                        </p>
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                            <Button
                                onClick={() => setIsSearchOpen(true)}
                                className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-10 px-6 rounded-[11px]"
                            >
                                <Plus size={16} />
                                Add Your First Fund
                            </Button>
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
                                    <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5 flex-1">
                                        <Button
                                            type="submit"
                                            disabled={isCreating}
                                            className="w-full bg-black hover:bg-zinc-900 text-white font-semibold text-sm h-10 rounded-[11px]"
                                        >
                                            {isCreating ? 'Creating...' : 'Create Watchlist'}
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
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
