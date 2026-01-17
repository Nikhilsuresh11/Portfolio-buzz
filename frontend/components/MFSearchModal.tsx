import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Plus, Loader2, ArrowUpRight, TrendingUp } from 'lucide-react'
import { buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface MutualFund {
    scheme_code: string
    scheme_name: string
    type: string
}

interface MFSearchModalProps {
    isOpen: boolean
    onClose: () => void
    onAddFund: (schemeCode: string) => Promise<any>
}

export default function MFSearchModal({ isOpen, onClose, onAddFund }: MFSearchModalProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<MutualFund[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [addingScheme, setAddingScheme] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
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
            setError(null)
            setAddingScheme(null)
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
        const searchFunds = async () => {
            if (query.trim().length < 2) {
                setResults([])
                return
            }

            setLoading(true)
            setError(null)
            try {
                const url = buildPublicApiUrl(`mf/search?q=${encodeURIComponent(query)}`)
                const res = await fetch(url, {
                    headers: getApiHeaders()
                })

                const data = await res.json()
                if (data.success && data.data.results) {
                    setResults(data.data.results)
                } else {
                    setResults([])
                    if (data.error) {
                        setError(data.error)
                    }
                }
            } catch (error) {
                console.error('Search error:', error)
                setError('Failed to search funds. Please try again.')
                setResults([])
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(searchFunds, 500) // Reduced debounce for better feel
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
                handleAdd(results[selectedIndex].scheme_code)
            }
        }
    }

    const handleAdd = async (schemeCode: string) => {
        setAddingScheme(schemeCode)
        try {
            await onAddFund(schemeCode)
            onClose()
        } catch (error) {
            console.error('Error adding fund:', error)
            setError('Failed to add fund. Please try again.')
        } finally {
            setAddingScheme(null)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[300] flex items-start justify-center pt-20 px-4 sm:pt-40">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

            <div
                ref={modalRef}
                className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Search Header */}
                <div className="relative group/search">
                    <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                        <Search className="w-6 h-6 text-zinc-500 group-focus-within/search:text-blue-500 transition-colors" />
                    </div>
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Explore mutual funds..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-zinc-900/50 border-none text-white text-xl font-bold placeholder:text-zinc-600 h-24 pl-18 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none border-b border-zinc-800/50"
                    />
                    <div className="absolute inset-y-0 right-8 flex items-center gap-4">
                        {loading && <Loader2 className="animate-spin text-blue-400" size={20} />}
                        <button
                            onClick={onClose}
                            className="p-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[500px] overflow-y-auto scrollbar-hide py-4">
                    {error && (
                        <div className="p-12 text-center">
                            <div className="text-rose-400 font-bold mb-2 uppercase tracking-widest text-xs">Search Error</div>
                            <div className="text-zinc-500">{error}</div>
                        </div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && !error && (
                        <div className="p-12 text-center">
                            <div className="text-zinc-500 font-bold mb-2 uppercase tracking-widest text-xs">No Data Found</div>
                            <div className="text-zinc-600">No mutual funds matched "{query}"</div>
                        </div>
                    )}

                    {query.length < 2 && (
                        <div className="p-12 text-center">
                            <div className="bg-zinc-900/50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-700">
                                <TrendingUp size={32} />
                            </div>
                            <h4 className="text-white font-black text-xl mb-2 tracking-tight">Financial Search</h4>
                            <p className="text-zinc-500 font-medium">Type fund house or scheme name to discover investments.</p>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="px-4 space-y-1">
                            {results.map((fund, index) => (
                                <div
                                    key={fund.scheme_code}
                                    className={`
                                        group flex items-center justify-between p-5 rounded-[1.5rem] cursor-pointer transition-all
                                        ${selectedIndex === index ? 'bg-blue-600 shadow-xl shadow-blue-600/20' : 'hover:bg-zinc-800/80'}
                                    `}
                                    onClick={() => handleAdd(fund.scheme_code)}
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className={`text-[10px] uppercase font-black tracking-widest mb-1 ${selectedIndex === index ? 'text-blue-100' : 'text-zinc-500'}`}>
                                            Code: {fund.scheme_code}
                                        </div>
                                        <div className={`text-base font-black truncate uppercase tracking-tight ${selectedIndex === index ? 'text-white' : 'text-white group-hover:text-blue-400'}`}>
                                            {fund.scheme_name}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-black uppercase tracking-tighter ${selectedIndex === index ? 'bg-blue-500/50' : ''}`}>
                                            {fund.type || 'GROWTH'}
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={addingScheme === fund.scheme_code}
                                            className={`
                                                h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all
                                                ${selectedIndex === index
                                                    ? 'bg-white text-blue-600 hover:bg-zinc-100'
                                                    : 'bg-zinc-800 text-white hover:bg-blue-600'}
                                            `}
                                        >
                                            {addingScheme === fund.scheme_code ? (
                                                <Loader2 className="animate-spin" size={14} />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Plus size={14} /> Add
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Guide */}
                <div className="p-6 bg-zinc-900 border-t border-zinc-800/50 flex items-center justify-between text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-zinc-800 rounded-lg text-zinc-300 border border-zinc-700/50 min-w-[24px] text-center">ESC</kbd>
                        <span>to exit</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-zinc-800 rounded-lg text-zinc-300 border border-zinc-700/50 min-w-[24px] text-center">↑↓</kbd>
                            <span>Navigate</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-zinc-800 rounded-lg text-zinc-300 border border-zinc-700/50 min-w-[24px] text-center">ENTER</kbd>
                            <span>Select</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .pl-18 { padding-left: 4.5rem; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    )
}
