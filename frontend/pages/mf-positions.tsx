import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { useAuth } from '../lib/auth-context'
import { usePortfolio } from '../lib/portfolio-context'
import { buildApiUrl, buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { Plus, Trash2, RefreshCw, Search, Calendar, Package, ArrowUpRight, TrendingUp, TrendingDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WatchlistLoader } from '@/components/ui/watchlist-loader'

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

    if (authLoading || portfolioLoading || (loading && positions.length === 0)) {
        return <WatchlistLoader />
    }

    if (!currentPortfolio) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-center p-4">
                <div className="bg-zinc-900/50 p-6 rounded-3xl mb-6">
                    <Package className="w-16 h-16 text-zinc-700" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Portfolio Selected</h3>
                <p className="text-zinc-500 mb-8 max-w-sm">Please select or create a portfolio to manage positions.</p>
                <Button onClick={() => router.push('/settings')} className="bg-white hover:bg-zinc-200 text-black font-bold h-11 px-8 rounded-xl">Go to Settings</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white relative overflow-hidden">
            <Header />

            {/* Background effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="flex-1 px-6 md:px-8 pb-8 overflow-y-auto scrollbar-hide max-w-[1600px] mx-auto w-full relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent tracking-tight">
                            MF Positions
                        </h1>
                        <p className="text-zinc-400 mt-3 text-lg font-medium">Manage and track individual buy transactions.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="bg-zinc-900/50 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all h-12 w-12 p-0 rounded-2xl"
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        </Button>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 px-6 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center gap-2 group transition-all"
                        >
                            <Plus size={20} />
                            Add Position
                            <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </Button>
                    </div>
                </div>

                {/* Table Section */}
                {positions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/20 border border-zinc-800/50 border-dashed rounded-[2rem] text-center">
                        <div className="bg-zinc-900/50 p-8 rounded-full mb-8">
                            <Package size={48} className="text-zinc-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">No Positions Yet</h3>
                        <p className="text-zinc-400 mb-10 max-w-sm">Start tracking your mutual fund investments by adding your first buy transaction.</p>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-white hover:bg-zinc-200 text-black font-bold h-12 px-10 rounded-2xl shadow-xl shadow-white/5 transition-all"
                        >
                            Add Your First Position
                        </Button>
                    </div>
                ) : (
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl shadow-black/40">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                                        <th className="p-6 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em]">Fund House / Name</th>
                                        <th className="p-6 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">Units</th>
                                        <th className="p-6 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">Purchase Date</th>
                                        <th className="p-6 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">Invested</th>
                                        <th className="p-6 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">Current Value</th>
                                        <th className="p-6 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">Status</th>
                                        <th className="p-6 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.15em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {positions.map((position) => (
                                        <tr key={position.position_id} className="group/row hover:bg-zinc-800/30 transition-all">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/row:scale-110 transition-transform">
                                                        <Package size={20} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">{position.fund_house}</div>
                                                        <div className="font-black text-white text-base group-hover/row:text-blue-400 transition-colors uppercase tracking-tight truncate max-w-[300px]">{position.scheme_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right tabular-nums">
                                                <div className="font-black text-white text-base tracking-tight">{position.units.toLocaleString('en-IN', { minimumFractionDigits: 3 })}</div>
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Units Allotted</div>
                                            </td>
                                            <td className="p-6 text-right tabular-nums">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg text-zinc-300 font-bold text-xs uppercase tracking-tight">
                                                    <Calendar size={12} className="text-zinc-500" />
                                                    {new Date(position.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="p-6 text-right tabular-nums">
                                                <div className="font-bold text-zinc-300">₹{position.invested_amount.toLocaleString('en-IN')}</div>
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">@ ₹{position.purchase_nav?.toFixed(2)}</div>
                                            </td>
                                            <td className="p-6 text-right tabular-nums">
                                                <div className="font-black text-white text-base tracking-tight">₹{position.current_value.toLocaleString('en-IN')}</div>
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Current NAV</div>
                                            </td>
                                            <td className="p-6 text-right tabular-nums">
                                                <div className={`flex items-center justify-end gap-1.5 font-black text-base ${position.returns >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {position.returns >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                    {Math.abs(position.returns_percent).toFixed(2)}%
                                                </div>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${position.returns >= 0 ? 'text-emerald-500/50' : 'text-rose-500/50'}`}>
                                                    {position.returns >= 0 ? '+' : ''}₹{Math.abs(position.returns).toLocaleString('en-IN')}
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <Button
                                                    onClick={() => setPositionToDelete(position.position_id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
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

            {/* Add Position Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Plus size={100} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tight">Add Position</h3>
                                    <p className="text-zinc-500 text-sm font-medium mt-1">Record a new buy transaction.</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white rounded-xl">
                                    <X size={24} />
                                </Button>
                            </div>

                            <form onSubmit={handleAddPosition} className="space-y-6">
                                {/* Fund Search */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Select Mutual Fund</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value)
                                                searchFunds(e.target.value)
                                            }}
                                            placeholder="Search by fund name..."
                                            className="bg-zinc-800/50 border-zinc-800 text-white pl-12 h-14 rounded-2xl focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        />
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div className="absolute left-8 right-8 mt-2 max-h-60 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-[1.5rem] shadow-2xl z-[210] scrollbar-hide divide-y divide-zinc-800/50">
                                            {searchResults.map((fund) => (
                                                <div
                                                    key={fund.scheme_code}
                                                    onClick={() => {
                                                        setSelectedFund(fund)
                                                        setSearchQuery(fund.scheme_name)
                                                        setSearchResults([])
                                                    }}
                                                    className="p-4 hover:bg-zinc-800/80 cursor-pointer transition-colors"
                                                >
                                                    <div className="font-bold text-white text-sm uppercase tracking-tight">{fund.scheme_name}</div>
                                                    <div className="text-[10px] text-zinc-500 font-black uppercase mt-1 tracking-widest">{fund.fund_house}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedFund && (
                                        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center justify-between">
                                            <div className="min-w-0">
                                                <div className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Selected Scheme</div>
                                                <div className="text-white font-bold text-xs truncate max-w-[300px] uppercase">{selectedFund.scheme_name}</div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => setSelectedFund(null)} className="h-8 w-8 text-blue-400 hover:text-blue-300">
                                                <X size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Invested Amount</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.invested_amount}
                                            onChange={(e) => setFormData({ ...formData, invested_amount: e.target.value })}
                                            placeholder="0.00"
                                            className="bg-zinc-800/50 border-zinc-800 text-white h-14 rounded-2xl focus:border-blue-500/50 transition-all font-black text-lg"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Purchase Date</label>
                                        <Input
                                            type="date"
                                            value={formData.purchase_date}
                                            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                            className="bg-zinc-800/50 border-zinc-800 text-white h-14 rounded-2xl focus:border-blue-500/50 transition-all font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Units</label>
                                            <span className="text-[9px] text-zinc-600 font-black uppercase italic">Optional</span>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                value={formData.units}
                                                onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                                                placeholder={isFetchingNav ? "Calculating..." : "Auto-fill"}
                                                className={`bg-zinc-800/50 border-zinc-800 text-white h-14 rounded-2xl focus:border-blue-500/50 transition-all font-bold ${isFetchingNav ? 'opacity-50' : ''}`}
                                            />
                                            {isFetchingNav && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <RefreshCw size={18} className="animate-spin text-blue-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Purchase NAV</label>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={formData.purchase_nav}
                                            onChange={(e) => setFormData({ ...formData, purchase_nav: e.target.value })}
                                            placeholder="Auto-fetched"
                                            className="bg-zinc-800/50 border-zinc-800 text-white h-14 rounded-2xl focus:border-blue-500/50 transition-all font-bold"
                                            disabled={isFetchingNav}
                                        />
                                    </div>
                                </div>

                                {!formData.units && !isFetchingNav && selectedFund && formData.invested_amount && formData.purchase_date && (
                                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/5 p-3 rounded-xl animate-pulse">
                                        <Activity size={12} />
                                        Units will be calculated automatically on save.
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        variant="outline"
                                        className="flex-1 border-zinc-800 hover:bg-zinc-800 text-zinc-400 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isAdding || !selectedFund}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black h-14 rounded-2xl shadow-xl shadow-blue-600/20 uppercase tracking-widest text-xs"
                                    >
                                        {isAdding ? 'Adding...' : 'Add Position'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {positionToDelete && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPositionToDelete(null)} />
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl p-8">
                        <div className="bg-rose-500/10 w-16 h-16 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                            <Trash2 size={28} />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight mb-3">Delete Position?</h3>
                        <p className="text-zinc-500 font-medium mb-8 leading-relaxed">This action will permanently remove this transaction from your portfolio. This cannot be undone.</p>
                        <div className="flex gap-4">
                            <Button
                                onClick={() => setPositionToDelete(null)}
                                variant="outline"
                                className="flex-1 border-zinc-800 text-zinc-400 h-12 rounded-xl font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeletePosition}
                                disabled={isDeleting}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black h-12 rounded-xl"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
