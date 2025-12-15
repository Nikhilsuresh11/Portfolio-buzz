import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Plus, Check, Loader2 } from 'lucide-react'
import { getToken } from '../lib/auth'
import { config } from '../config'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Stock {
    ticker: string
    name: string
    exchange?: string
    sector?: string
    price?: number
    change?: number
    changePercent?: number
}

interface StockSearchModalProps {
    isOpen: boolean
    onClose: () => void
    onAddStock: (ticker: string) => void
    watchlist: Stock[]
}

export default function StockSearchModal({ isOpen, onClose, onAddStock, watchlist }: StockSearchModalProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Stock[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
            setQuery('')
            setResults([])
        }

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleGlobalKeyDown)

        return () => {
            document.body.style.overflow = 'unset'
            window.removeEventListener('keydown', handleGlobalKeyDown)
        }
    }, [isOpen, onClose])

    useEffect(() => {
        const searchStocks = async () => {
            if (query.trim().length < 1) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const token = getToken()
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                const res = await fetch(`${config.API_BASE_URL}/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=10`, {
                    headers
                })

                const data = await res.json()
                if (data.success) {
                    setResults(data.data)
                }
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(searchStocks, 300)
        return () => clearTimeout(debounce)
    }, [query])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (selectedIndex >= 0 && results[selectedIndex]) {
                handleAdd(results[selectedIndex].ticker)
            }
        } else if (e.key === 'Escape') {
            onClose()
        }
    }

    const handleAdd = (ticker: string) => {
        onAddStock(ticker)
        // Don't close immediately to allow adding multiple
    }

    const isStockInWatchlist = (ticker: string) => {
        return watchlist.some(s => s.ticker === ticker)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-24 transition-opacity" onClick={onClose}>
            <div
                className="w-full max-w-xl bg-black rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200"
                ref={modalRef}
                onClick={e => e.stopPropagation()}
            >
                <div className="relative flex items-center px-4 py-3 border-b border-white/10 bg-black">
                    <Search className="h-5 w-5 text-gray-400 absolute left-4" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search stocks (e.g. RELIANCE, TCS)..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 pl-10 h-9 text-base"
                    />
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-white ml-2">
                        <X size={18} />
                    </Button>
                </div>

                <div className="max-h-[400px] overflow-y-auto bg-black">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="divide-y divide-white/5">
                            {results.map((stock, index) => {
                                const inWatchlist = isStockInWatchlist(stock.ticker)
                                const isSelected = index === selectedIndex
                                return (
                                    <li
                                        key={stock.ticker}
                                        className={`flex items-center justify-between px-5 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/10' : 'hover:bg-white/5'
                                            }`}
                                        onClick={() => !inWatchlist && handleAdd(stock.ticker)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-white">{stock.ticker}</span>
                                            <span className="text-sm text-gray-400">{stock.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="secondary" className="bg-black/20 text-gray-400 font-normal border-0">
                                                {stock.exchange || 'NSE'}
                                            </Badge>
                                            {inWatchlist ? (
                                                <span className="flex items-center text-sm text-emerald-500 font-medium">
                                                    <Check size={14} className="mr-1" /> Added
                                                </span>
                                            ) : (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 bg-blue-500/10 hover:bg-blue-500 hover:text-white rounded-md">
                                                    <Plus size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : query.length > 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No stocks found for "{query}"
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            Type to search for Indian stocks to add to your watchlist.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
