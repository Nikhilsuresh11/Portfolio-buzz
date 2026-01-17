import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { useAuth } from '../lib/auth-context'
import { usePortfolio } from '../lib/portfolio-context'
import { buildApiUrl, buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { Plus, Trash2, RefreshCw, Search, Calendar, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MFPosition = {
    position_id: string
    scheme_code: string
    scheme_name: string
    units: number
    purchase_date: string
    invested_amount: number
    purchase_nav: number
    current_nav: number
    current_value: number
    returns: number
    returns_percent: number
    fund_house: string
}

export default function MFPositionsPage() {
    const router = useRouter()
    const { userEmail, isLoading: authLoading } = useAuth()
    const { currentPortfolio, isLoading: portfolioLoading } = usePortfolio()

    const [positions, setPositions] = useState<MFPosition[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Add Position Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [selectedFund, setSelectedFund] = useState<any>(null)
    const [formData, setFormData] = useState({
        units: '',
        purchase_date: '',
        invested_amount: '',
        purchase_nav: ''
    })
    const [isAdding, setIsAdding] = useState(false)
    const [isFetchingNav, setIsFetchingNav] = useState(false)

    // Delete Modal State
    const [positionToDelete, setPositionToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (!authLoading && !userEmail) {
            router.push('/login')
        }
    }, [authLoading, userEmail, router])

    useEffect(() => {
        if (userEmail && currentPortfolio) {
            fetchPositions()
        }
    }, [userEmail, currentPortfolio])

    const fetchPositions = async () => {
        if (!userEmail || !currentPortfolio) return

        try {
            setLoading(true)
            const url = buildApiUrl(userEmail, `mf-portfolio/${currentPortfolio.portfolio_id}/analysis`)
            const res = await fetch(url, { headers: getApiHeaders() })
            const data = await res.json()

            if (data.success) {
                setPositions(data.positions || [])
            }
        } catch (error) {
            console.error('Error fetching positions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchPositions()
        setIsRefreshing(false)
    }

    const fetchNavOnDate = async (schemeCode: string, date: string) => {
        if (!schemeCode || !date) return null

        try {
            setIsFetchingNav(true)
            const url = buildPublicApiUrl(`mf/${schemeCode}/nav-on-date?date=${date}`)
            const res = await fetch(url, { headers: getApiHeaders() })
            const data = await res.json()

            if (data.success) {
                return data.data.nav
            }
            return null
        } catch (error) {
            console.error('Error fetching NAV on date:', error)
            return null
        } finally {
            setIsFetchingNav(false)
        }
    }

    // Auto-calculate units when date or amount changes
    useEffect(() => {
        const calculateUnits = async () => {
            // If date or amount changes and units was already auto-calculated or empty, re-calculate
            if (selectedFund && formData.purchase_date && formData.invested_amount) {
                const nav = await fetchNavOnDate(selectedFund.scheme_code, formData.purchase_date)
                if (nav) {
                    const amount = parseFloat(formData.invested_amount)
                    const units = (amount / nav).toFixed(4)
                    setFormData(prev => ({ ...prev, units, purchase_nav: nav.toString() }))
                }
            }
        }

        const timeoutId = setTimeout(calculateUnits, 500)
        return () => clearTimeout(timeoutId)
    }, [selectedFund, formData.purchase_date, formData.invested_amount])

    // Clear auto-calculated units when fund changes
    useEffect(() => {
        if (selectedFund) {
            setFormData(prev => ({ ...prev, units: '', purchase_nav: '' }))
        }
    }, [selectedFund])

    const searchFunds = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        try {
            const url = buildPublicApiUrl(`mf/search?q=${encodeURIComponent(query)}`)
            const res = await fetch(url, { headers: getApiHeaders() })
            const data = await res.json()

            if (data.success) {
                setSearchResults(data.data.results || [])
            }
        } catch (error) {
            console.error('Error searching funds:', error)
        }
    }

    const handleAddPosition = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userEmail || !currentPortfolio || !selectedFund) return

        try {
            setIsAdding(true)
            const url = buildApiUrl(userEmail, `mf-portfolio/${currentPortfolio.portfolio_id}/positions`)
            const res = await fetch(url, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    scheme_code: selectedFund.scheme_code,
                    units: formData.units ? parseFloat(formData.units) : null,
                    purchase_date: formData.purchase_date,
                    invested_amount: parseFloat(formData.invested_amount),
                    purchase_nav: formData.purchase_nav ? parseFloat(formData.purchase_nav) : null
                })
            })

            const data = await res.json()
            if (data.success) {
                setIsAddModalOpen(false)
                setSelectedFund(null)
                setFormData({ units: '', purchase_date: '', invested_amount: '', purchase_nav: '' })
                setSearchQuery('')
                await fetchPositions()
            } else {
                alert(data.message || 'Failed to add position')
            }
        } catch (error) {
            console.error('Error adding position:', error)
            alert('An error occurred while adding the position')
        } finally {
            setIsAdding(false)
        }
    }

    const handleDeletePosition = async () => {
        if (!userEmail || !currentPortfolio || !positionToDelete) return

        try {
            setIsDeleting(true)
            const url = buildApiUrl(userEmail, `mf-portfolio/${currentPortfolio.portfolio_id}/positions/${positionToDelete}`)
            const res = await fetch(url, {
                method: 'DELETE',
                headers: getApiHeaders()
            })

            if (res.ok) {
                setPositionToDelete(null)
                await fetchPositions()
            }
        } catch (error) {
            console.error('Error deleting position:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    if (authLoading || portfolioLoading) {
        return <div className="flex items-center justify-center h-screen bg-black">
            <div className="text-white">Loading...</div>
        </div>
    }

    if (!currentPortfolio) {
        return <div className="flex flex-col items-center justify-center h-screen bg-black">
            <div className="text-white text-xl mb-4">No Portfolio Selected</div>
            <Button onClick={() => router.push('/settings')}>Go to Settings</Button>
        </div>
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            <Header />

            <div className="flex-1 px-6 md:p-8 pb-6 md:pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                            MF Positions
                        </h1>
                        <p className="text-zinc-400">Manage individual transactions in your mutual fund portfolio</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            variant="outline"
                            className="border-zinc-800 hover:bg-zinc-900 text-white gap-2"
                        >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5">
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-9 px-5 rounded-[11px]"
                            >
                                <Plus size={16} />
                                Add Position
                            </Button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="w-16 h-16 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="text-zinc-400 text-sm">Loading positions...</div>
                    </div>
                ) : (
                    <>
                        {/* Positions Table */}
                        {positions.length > 0 ? (
                            <div className="bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-zinc-900/50 border-b border-zinc-800/50">
                                            <tr>
                                                <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fund Name</th>
                                                <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Units</th>
                                                <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Purchase Date</th>
                                                <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Invested</th>
                                                <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Current Value</th>
                                                <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                                                <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {positions.map((position) => (
                                                <tr key={position.position_id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                                                <Package size={16} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-white text-sm truncate">{position.scheme_name}</div>
                                                                <div className="text-xs text-zinc-500 truncate">{position.fund_house}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right tabular-nums">
                                                        <span className="text-white text-sm">{position.units.toFixed(3)}</span>
                                                    </td>
                                                    <td className="p-4 text-right tabular-nums">
                                                        <div className="flex items-center justify-end gap-1.5 text-zinc-400 text-sm">
                                                            <Calendar size={14} />
                                                            {new Date(position.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right tabular-nums">
                                                        <span className="text-white text-sm">₹{position.invested_amount.toLocaleString('en-IN')}</span>
                                                    </td>
                                                    <td className="p-4 text-right tabular-nums">
                                                        <span className="text-white font-semibold">₹{position.current_value.toLocaleString('en-IN')}</span>
                                                    </td>
                                                    <td className="p-4 text-right tabular-nums">
                                                        <div className={`text-sm font-semibold ${position.returns >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {position.returns_percent.toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                                            onClick={() => setPositionToDelete(position.position_id)}
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
                            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                                <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 flex items-center justify-center border border-white/5">
                                    <Package className="w-10 h-10 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">No MF Positions</h3>
                                <p className="text-zinc-400 text-center mb-8 max-w-md">
                                    You haven't added any mutual fund positions to this portfolio yet.
                                </p>
                                <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-500 hover:bg-blue-600">
                                    <Plus size={16} className="mr-2" />
                                    Add Your First Position
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add Position Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Add MF Position</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)}>
                                <Search size={20} className="rotate-45" />
                            </Button>
                        </div>
                        <form onSubmit={handleAddPosition} className="space-y-4">
                            {/* Fund Search */}
                            <div>
                                <label className="text-sm font-medium text-zinc-400 mb-2 block">Search Mutual Fund</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value)
                                            searchFunds(e.target.value)
                                        }}
                                        placeholder="Type fund name (min 2 chars)..."
                                        className="bg-black/50 border-zinc-800 text-white pl-10 focus:border-blue-500"
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="mt-2 max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-10 scrollbar-hide">
                                        {searchResults.map((fund) => (
                                            <div
                                                key={fund.scheme_code}
                                                onClick={() => {
                                                    setSelectedFund(fund)
                                                    setSearchQuery(fund.scheme_name)
                                                    setSearchResults([])
                                                }}
                                                className="p-3 hover:bg-zinc-800 cursor-pointer text-sm text-zinc-300 border-b border-zinc-800/50 last:border-0"
                                            >
                                                <div className="font-semibold text-white">{fund.scheme_name}</div>
                                                <div className="text-[10px] text-zinc-500 uppercase mt-0.5">{fund.fund_house}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedFund && (
                                    <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <div className="text-xs font-semibold text-blue-400">SELECTED FUND</div>
                                        <div className="text-sm text-white truncate">{selectedFund.scheme_name}</div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-zinc-400 mb-2 block">Invested Amount</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.invested_amount}
                                        onChange={(e) => setFormData({ ...formData, invested_amount: e.target.value })}
                                        placeholder="₹0.00"
                                        className="bg-black/50 border-zinc-800 text-white focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-400 mb-2 block">Purchase Date</label>
                                    <Input
                                        type="date"
                                        value={formData.purchase_date}
                                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                        className="bg-black/50 border-zinc-800 text-white focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-zinc-400 block">Units</label>
                                        <span className="text-[10px] text-zinc-500 font-normal italic">Optional</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={formData.units}
                                            onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                                            placeholder={isFetchingNav ? "Calculating..." : "Auto-fill"}
                                            className={`bg-black/50 border-zinc-800 text-white focus:border-blue-500 ${isFetchingNav ? 'opacity-50' : ''}`}
                                        />
                                        {isFetchingNav && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <RefreshCw size={14} className="animate-spin text-blue-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-400 mb-2 block">Purchase NAV</label>
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        value={formData.purchase_nav}
                                        onChange={(e) => setFormData({ ...formData, purchase_nav: e.target.value })}
                                        placeholder="Auto-fetched"
                                        className="bg-black/50 border-zinc-800 text-white focus:border-blue-500"
                                        disabled={isFetchingNav}
                                    />
                                </div>
                            </div>

                            {!formData.units && !isFetchingNav && selectedFund && formData.invested_amount && formData.purchase_date && (
                                <p className="text-[10px] text-blue-400 mt-1 animate-pulse">
                                    Units will be calculated automatically on save.
                                </p>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false)
                                        setSelectedFund(null)
                                        setFormData({ units: '', purchase_date: '', invested_amount: '', purchase_nav: '' })
                                        setSearchQuery('')
                                    }}
                                    variant="outline"
                                    className="flex-1 border-zinc-800 hover:bg-zinc-800 text-white bg-transparent"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isAdding || !selectedFund}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold"
                                >
                                    {isAdding ? 'Adding...' : 'Add Position'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {positionToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Delete Position?</h3>
                        <p className="text-zinc-400 mb-6">This action cannot be undone. This transaction will be permanently removed from your portfolio.</p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setPositionToDelete(null)}
                                variant="outline"
                                className="flex-1 border-zinc-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeletePosition}
                                disabled={isDeleting}
                                className="flex-1 bg-red-500 hover:bg-red-600 font-bold"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
