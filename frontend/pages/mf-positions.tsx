import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth-context'
import { usePortfolio } from '../lib/portfolio-context'
import { buildApiUrl, buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { Plus, Trash2, RefreshCw, Search, Calendar, Package, X, ChevronDown, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoader } from '@/components/ui/page-loader'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    const [isSearching, setIsSearching] = useState(false)

    // Delete Modal State
    const [positionToDelete, setPositionToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Transactions Modal State
    const [selectedFundForTxns, setSelectedFundForTxns] = useState<string | null>(null)

    const fundFilter = router.query.fund as string

    // Grouping logic
    const displayPositions = useMemo(() => {
        const map = new Map<string, any>()
        positions.forEach(p => {
            if (map.has(p.scheme_code)) {
                const existing = map.get(p.scheme_code)
                existing.units += p.units
                existing.invested_amount += p.invested_amount
                existing.purchase_avg_nav = existing.invested_amount / existing.units
                existing.txn_count = (existing.txn_count || 1) + 1
            } else {
                map.set(p.scheme_code, { ...p, txn_count: 1, purchase_avg_nav: p.purchase_nav })
            }
        })
        return Array.from(map.values())
    }, [positions])

    // Get individual transactions for a specific fund
    const transactionsForSelectedFund = useMemo(() => {
        if (!selectedFundForTxns) return []
        return positions.filter(p => p.scheme_code === selectedFundForTxns)
            .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
    }, [positions, selectedFundForTxns])

    const selectedFundDetails = useMemo(() => {
        if (!selectedFundForTxns) return null
        return displayPositions.find(p => p.scheme_code === selectedFundForTxns)
    }, [displayPositions, selectedFundForTxns])

    // Handle initial fund from query
    useEffect(() => {
        if (fundFilter && positions.length > 0) {
            const found = positions.find(p =>
                p.scheme_name.toLowerCase().includes(fundFilter.toLowerCase()) ||
                p.fund_house.toLowerCase().includes(fundFilter.toLowerCase())
            )
            if (found) {
                setSelectedFundForTxns(found.scheme_code)
            }
        }
    }, [fundFilter, positions])

    // Extract unique existing holdings for the dropdown
    const existingHoldings = useMemo(() => {
        const uniqueFunds = new Map()
        positions.forEach(p => {
            if (!uniqueFunds.has(p.scheme_code)) {
                uniqueFunds.set(p.scheme_code, {
                    scheme_code: p.scheme_code,
                    scheme_name: p.scheme_name,
                    fund_house: p.fund_house
                })
            }
        })
        return Array.from(uniqueFunds.values())
    }, [positions])

    // Auto-calculate units by fetching NAV on purchase date
    useEffect(() => {
        const calculateUnits = async () => {
            if (selectedFund && formData.purchase_date && formData.invested_amount) {
                setIsFetchingNav(true)
                try {
                    const url = buildPublicApiUrl(`mf/${selectedFund.scheme_code}/nav-on-date?date=${formData.purchase_date}`)
                    const res = await fetch(url)
                    const data = await res.json()

                    if (data.success && data.data?.nav) {
                        const nav = data.data.nav
                        const amount = parseFloat(formData.invested_amount)
                        const units = (amount / nav).toFixed(4)
                        setFormData(prev => ({ ...prev, units, purchase_nav: nav.toString() }))
                    }
                } catch (error) {
                    console.error('Error fetching NAV on date:', error)
                } finally {
                    setIsFetchingNav(false)
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

    // Debounced search for funds
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        // Debounce the search - wait 1 second after user stops typing
        const timeoutId = setTimeout(() => {
            handleSearchFunds(searchQuery)
        }, 1000)

        return () => clearTimeout(timeoutId)
    }, [searchQuery])

    useEffect(() => {
        if (!authLoading && !userEmail) {
            router.push('/')
        } else if (userEmail && !currentPortfolio && !portfolioLoading) {
            router.push('/select-portfolio')
        } else if (userEmail && currentPortfolio) {
            fetchPositions()
        }
    }, [authLoading, userEmail, currentPortfolio, portfolioLoading, router])

    const fetchPositions = async () => {
        if (!userEmail || !currentPortfolio) return

        try {
            setLoading(true)
            const url = buildApiUrl(userEmail, `mf-portfolio/${currentPortfolio.portfolio_id}/positions-summary`)
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

    const handleSearchFunds = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        try {
            setIsSearching(true)
            const url = buildPublicApiUrl(`mf/search?q=${encodeURIComponent(query)}`)
            const res = await fetch(url)
            const data = await res.json()
            // Fix: API returns {data: {results: [...]}} not {results: [...]}
            const results = data.data?.results || data.results || []
            setSearchResults(results)
        } catch (error) {
            console.error('Error searching funds:', error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const handleSelectFund = async (fund: any) => {
        setSelectedFund(fund)
        setSearchQuery(fund.scheme_name)
        setSearchResults([])
    }

    const handleAddPosition = async () => {
        if (!selectedFund || !userEmail || !currentPortfolio) return
        if (!formData.units || !formData.purchase_date || !formData.invested_amount || !formData.purchase_nav) {
            alert('Please fill all fields')
            return
        }

        setIsAdding(true)
        try {
            const url = buildApiUrl(userEmail, `mf-portfolio/${currentPortfolio.portfolio_id}/positions`)
            const res = await fetch(url, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    scheme_code: selectedFund.scheme_code,
                    scheme_name: selectedFund.scheme_name,
                    units: parseFloat(formData.units),
                    purchase_date: formData.purchase_date,
                    invested_amount: parseFloat(formData.invested_amount),
                    purchase_nav: parseFloat(formData.purchase_nav)
                })
            })

            const data = await res.json()
            if (data.success) {
                await fetchPositions()
                setIsAddModalOpen(false)
                setSelectedFund(null)
                setSearchQuery('')
                setFormData({ units: '', purchase_date: '', invested_amount: '', purchase_nav: '' })
            } else {
                alert(data.error || 'Failed to add position')
            }
        } catch (error) {
            console.error('Error adding position:', error)
            alert('Failed to add position')
        } finally {
            setIsAdding(false)
        }
    }

    const handleDeletePosition = async (positionId: string) => {
        if (!userEmail || !currentPortfolio) return

        setIsDeleting(true)
        try {
            const url = buildApiUrl(userEmail, `mf-portfolio/${currentPortfolio.portfolio_id}/positions/${positionId}`)
            const res = await fetch(url, {
                method: 'DELETE',
                headers: getApiHeaders()
            })

            const data = await res.json()
            if (data.success) {
                await fetchPositions()
                setPositionToDelete(null)
            } else {
                alert(data.error || 'Failed to delete position')
            }
        } catch (error) {
            console.error('Error deleting position:', error)
            alert('Failed to delete position')
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading && positions.length === 0) {
        return (
            <div className="flex-1 overflow-auto flex items-center justify-center min-h-screen">
                <PageLoader
                    messages={[
                        "Loading your MF positions...",
                        "Fetching transaction history...",
                        "Almost ready..."
                    ]}
                    subtitle="Preparing your mutual fund data"
                />
            </div>
        )
    }

    const totalInvested = positions.reduce((sum, p) => sum + p.invested_amount, 0)

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black">
            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                            MF Positions
                        </h1>
                        <p className="text-zinc-400">Track and manage all your mutual fund transactions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="bg-zinc-900/50 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all h-9 w-9 p-0 rounded-lg"
                        >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
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
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 overflow-hidden max-w-[1600px] mx-auto w-full" style={{ paddingTop: '0px' }}>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                        <p className="text-zinc-500 text-xs mb-2">Total Transactions</p>
                        <p className="text-2xl font-bold text-white">{positions.length}</p>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                        <p className="text-zinc-500 text-xs mb-2">Total Invested</p>
                        <p className="text-2xl font-bold text-white">₹{totalInvested.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl rounded-2xl p-5">
                        <p className="text-zinc-500 text-xs mb-2">Unique Funds</p>
                        <p className="text-2xl font-bold text-white">{displayPositions.length}</p>
                    </div>
                </div>

                {/* Table */}
                {displayPositions.length === 0 ? (
                    <div className="bg-zinc-900/20 border border-zinc-800/40 backdrop-blur-xl rounded-2xl p-16 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 text-zinc-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">No positions yet</h3>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                            Start building your mutual fund portfolio by adding your first position
                        </p>
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-0.5 inline-block">
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-black hover:bg-zinc-900 text-white gap-2 font-semibold text-sm h-9 px-5 rounded-[11px]"
                            >
                                <Plus size={16} />
                                Add First Position
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col h-[600px]">
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Sticky Header */}
                            <table className="w-full border-collapse text-left table-fixed">
                                <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm">
                                    <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        <th className="w-[40%] px-6 py-4 text-left">Fund House / Name</th>
                                        <th className="w-[12%] px-6 py-4 text-right">Units</th>
                                        <th className="w-[12%] px-6 py-4 text-right">Avg NAV</th>
                                        <th className="w-[12%] px-6 py-4 text-right">Current NAV</th>
                                        <th className="w-[12%] px-6 py-4 text-right">Total Invested</th>
                                        <th className="w-[12%] px-6 py-4 text-right">Orders</th>
                                    </tr>
                                </thead>
                            </table>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                <table className="w-full border-collapse text-left table-fixed">
                                    <tbody className="divide-y divide-white/5">
                                        {displayPositions.map((position) => (
                                            <tr
                                                key={position.scheme_code}
                                                onClick={() => setSelectedFundForTxns(position.scheme_code)}
                                                className="group hover:bg-white/5 transition-all cursor-pointer"
                                            >
                                                <td className="w-[40%] px-6 py-5">
                                                    <div className="text-xs text-zinc-500 font-semibold mb-1 uppercase tracking-wider">{position.fund_house}</div>
                                                    <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors line-clamp-1">{position.scheme_name}</div>
                                                </td>
                                                <td className="w-[12%] px-6 py-5 text-right">
                                                    <div className="font-bold text-white text-sm">{position.units.toLocaleString('en-IN', { minimumFractionDigits: 3 })}</div>
                                                    <div className="text-xs text-zinc-500 font-semibold">Total Units</div>
                                                </td>
                                                <td className="w-[12%] px-6 py-5 text-right">
                                                    <div className="font-semibold text-zinc-300 text-sm">₹{position.purchase_avg_nav.toFixed(2)}</div>
                                                    <div className="text-xs text-zinc-500 font-semibold">Average Cost</div>
                                                </td>
                                                <td className="w-[12%] px-6 py-5 text-right">
                                                    <div className="font-bold text-white text-sm">₹{position.current_nav?.toFixed(2) || '0.00'}</div>
                                                    <div className="text-xs text-zinc-500 font-semibold">Market NAV</div>
                                                </td>
                                                <td className="w-[12%] px-6 py-5 text-right">
                                                    <div className="font-bold text-white text-sm">₹{position.invested_amount.toLocaleString('en-IN')}</div>
                                                    <div className="text-xs text-zinc-500 font-semibold">Total Capital</div>
                                                </td>
                                                <td className="w-[12%] px-6 py-5 text-right">
                                                    <div className="font-bold text-white text-sm">{position.txn_count}</div>
                                                    <div className="text-xs text-zinc-500 font-semibold">Transactions</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Position Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900/95 border border-zinc-800 backdrop-blur-xl rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center sticky top-0 bg-zinc-900/95 backdrop-blur-xl z-10">
                            <h2 className="text-xl font-black text-white tracking-tight">Add MF Position</h2>
                            <Button
                                onClick={() => {
                                    setIsAddModalOpen(false)
                                    setSelectedFund(null)
                                    setSearchQuery('')
                                    setFormData({ units: '', purchase_date: '', invested_amount: '', purchase_nav: '' })
                                }}
                                className="bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white h-10 w-10 p-0 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Fund Selection - Only show if no fund selected */}
                            {!selectedFund ? (
                                <div>
                                    <label className="block text-sm font-black text-zinc-400 mb-3 uppercase tracking-[0.1em]">Select Fund</label>

                                    {/* Existing Holdings Dropdown */}
                                    {existingHoldings.length > 0 && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button className="w-full bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 text-white justify-between h-12 px-5 rounded-xl mb-3 font-bold transition-all">
                                                    <span className="text-sm">Add to existing holding</span>
                                                    <ChevronDown size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[600px] bg-zinc-900 border-zinc-800 rounded-xl p-2">
                                                {existingHoldings.map((fund) => (
                                                    <DropdownMenuItem
                                                        key={fund.scheme_code}
                                                        onClick={() => handleSelectFund(fund)}
                                                        className="cursor-pointer hover:bg-zinc-800 text-white p-4 rounded-xl mb-1 last:mb-0"
                                                    >
                                                        <div>
                                                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">{fund.fund_house}</div>
                                                            <div className="font-bold text-sm">{fund.scheme_name}</div>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}

                                    {/* Search Input */}
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                        <Input
                                            type="text"
                                            placeholder="Search for a new fund..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-zinc-800/50 border-zinc-700 text-white pl-12 h-12 rounded-xl font-semibold placeholder:text-zinc-600"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <RefreshCw size={16} className="text-blue-400 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Results */}
                                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                                        <div className="mt-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-center text-zinc-500 text-sm">
                                            No results found for "{searchQuery}"
                                        </div>
                                    )}

                                    {searchResults.length > 0 && (
                                        <div className="mt-3 bg-zinc-800/50 border border-zinc-700 rounded-xl max-h-60 overflow-y-auto scrollbar-hide">
                                            {searchResults.map((fund) => (
                                                <div
                                                    key={fund.scheme_code}
                                                    onClick={() => handleSelectFund(fund)}
                                                    className="p-4 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 last:border-0 transition-all"
                                                >
                                                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">{fund.fund_house}</div>
                                                    <div className="text-sm font-bold text-white">{fund.scheme_name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <>
                                    {/* Selected Fund Display */}
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">{selectedFund.fund_house}</div>
                                                <div className="text-base font-black text-white">{selectedFund.scheme_name}</div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setSelectedFund(null)
                                                    setSearchQuery('')
                                                    setFormData({ units: '', purchase_date: '', invested_amount: '', purchase_nav: '' })
                                                }}
                                                className="bg-transparent hover:bg-blue-500/10 text-blue-400 h-8 w-8 p-0 rounded-lg"
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="p-3 bg-black-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 mb-4">
                                        <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-300">
                                            <span className="font-bold">Auto-calculation:</span> Enter the invested amount and purchase date. Units and NAV will be calculated automatically.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 mb-2 uppercase tracking-[0.1em]">Invested Amount</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={formData.invested_amount}
                                                onChange={(e) => setFormData({ ...formData, invested_amount: e.target.value })}
                                                className="bg-zinc-800/50 border-zinc-700 text-white h-12 rounded-xl font-bold text-base"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 mb-2 uppercase tracking-[0.1em]">Purchase Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                                <Input
                                                    type="date"
                                                    value={formData.purchase_date}
                                                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                                    className="bg-zinc-800/50 border-zinc-700 text-white pl-12 h-12 rounded-xl font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auto-calculated fields (read-only) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 mb-2 uppercase tracking-[0.1em] flex items-center gap-2">
                                                Purchase NAV
                                                {isFetchingNav && <span className="text-xs text-blue-400 normal-case tracking-normal">(fetching...)</span>}
                                                {formData.purchase_nav && <span className="text-xs text-emerald-400 normal-case tracking-normal">✓ Calculated</span>}
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                placeholder="Auto-calculated"
                                                value={formData.purchase_nav}
                                                readOnly
                                                className="bg-zinc-800/30 border-zinc-700/50 text-zinc-400 h-12 rounded-xl font-bold text-base cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-black text-zinc-400 mb-2 uppercase tracking-[0.1em] flex items-center gap-2">
                                                Units
                                                {formData.units && <span className="text-xs text-emerald-400 normal-case tracking-normal">✓ Calculated</span>}
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                placeholder="Auto-calculated"
                                                value={formData.units}
                                                readOnly
                                                className="bg-zinc-800/30 border-zinc-700/50 text-zinc-400 h-12 rounded-xl font-bold text-base cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            onClick={() => {
                                                setIsAddModalOpen(false)
                                                setSelectedFund(null)
                                                setSearchQuery('')
                                                setFormData({ units: '', purchase_date: '', invested_amount: '', purchase_nav: '' })
                                            }}
                                            className="flex-1 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 text-white h-12 rounded-xl font-bold text-base transition-all"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddPosition}
                                            disabled={isAdding || !formData.units || !formData.purchase_nav}
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl font-bold text-base shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isAdding ? 'Adding...' : !formData.units || !formData.purchase_nav ? 'Calculating...' : 'Add Position'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions Modal */}
            {selectedFundForTxns && selectedFundDetails && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-800 flex-none">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="text-xs text-zinc-500 font-semibold mb-1 uppercase tracking-wider">{selectedFundDetails.fund_house}</div>
                                    <h2 className="text-xl font-bold text-white mb-2">{selectedFundDetails.scheme_name}</h2>
                                    <div className="text-xs text-zinc-500 font-semibold">
                                        {selectedFundDetails.txn_count} transactions • Total Units: <span className="text-white">{selectedFundDetails.units.toLocaleString('en-IN', { minimumFractionDigits: 3 })}</span> • Total Invested: <span className="text-white">₹{selectedFundDetails.invested_amount.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setSelectedFundForTxns(null)}
                                    className="bg-transparent hover:bg-zinc-800 text-zinc-400 h-8 w-8 p-0 rounded-lg"
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-hidden">
                            <div className="h-full overflow-y-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm">
                                        <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                            <th className="px-6 py-4 text-left">Purchase Date</th>
                                            <th className="px-6 py-4 text-right">Units</th>
                                            <th className="px-6 py-4 text-right">Purchase NAV</th>
                                            <th className="px-6 py-4 text-right">Invested</th>
                                            <th className="px-6 py-4 text-right">Current NAV</th>
                                            <th className="px-6 py-4 text-right">Current Value</th>
                                            <th className="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {transactionsForSelectedFund.map((txn) => {
                                            const currentValue = txn.units * (txn.current_nav || 0)
                                            const returns = currentValue - txn.invested_amount
                                            const returnsPercent = (returns / txn.invested_amount) * 100

                                            return (
                                                <tr key={txn.position_id} className="group hover:bg-zinc-800/30 transition-all">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-zinc-500" />
                                                            <span className="text-sm font-semibold text-white">
                                                                {new Date(txn.purchase_date).toLocaleDateString('en-IN', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-bold text-white text-sm">{txn.units.toLocaleString('en-IN', { minimumFractionDigits: 3 })}</div>
                                                        <div className="text-xs text-zinc-500 font-semibold">units</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-semibold text-zinc-300 text-sm">₹{txn.purchase_nav.toFixed(4)}</div>
                                                        <div className="text-xs text-zinc-500 font-semibold">per unit</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-bold text-white text-sm">₹{txn.invested_amount.toLocaleString('en-IN')}</div>
                                                        <div className="text-xs text-zinc-500 font-semibold">invested</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-semibold text-zinc-300 text-sm">₹{txn.current_nav?.toFixed(4) || '0.0000'}</div>
                                                        <div className="text-xs text-zinc-500 font-semibold">current</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-bold text-white text-sm">₹{currentValue.toLocaleString('en-IN')}</div>
                                                        <div className={`text-xs font-semibold ${returns >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {returns >= 0 ? '+' : ''}{returnsPercent.toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Button
                                                            onClick={() => setPositionToDelete(txn.position_id)}
                                                            className="bg-transparent hover:bg-red-500/10 text-red-400 h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {positionToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-3">Delete Transaction?</h3>
                        <p className="text-zinc-400 mb-6">This action cannot be undone. The transaction will be permanently removed from your portfolio.</p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setPositionToDelete(null)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white h-11 rounded-xl font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleDeletePosition(positionToDelete)}
                                disabled={isDeleting}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white h-11 rounded-xl font-semibold"
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
