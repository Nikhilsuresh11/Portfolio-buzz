import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Plus, Loader2 } from 'lucide-react'
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

        const debounce = setTimeout(searchFunds, 1000)  // Wait 1 second after user stops typing
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
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div
                ref={modalRef}
                className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300"
            >
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
                    <Search className="text-zinc-400" size={20} />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Search mutual funds..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {loading && <Loader2 className="animate-spin text-blue-500" size={18} />}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="text-zinc-400" size={20} />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {error && (
                        <div className="p-4 text-center text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && !error && (
                        <div className="p-8 text-center text-zinc-500">
                            No funds found for "{query}"
                        </div>
                    )}

                    {query.length < 2 && (
                        <div className="p-8 text-center text-zinc-500">
                            Type at least 2 characters to search
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="divide-y divide-zinc-800">
                            {results.map((fund, index) => (
                                <div
                                    key={fund.scheme_code}
                                    className={`
                                        p-4 flex items-center justify-between cursor-pointer transition-colors
                                        ${selectedIndex === index ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}
                                    `}
                                    onClick={() => handleAdd(fund.scheme_code)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white text-sm truncate">
                                            {fund.scheme_name}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-0.5">
                                            Code: {fund.scheme_code}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={addingScheme === fund.scheme_code}
                                        className="ml-4 bg-blue-500 hover:bg-blue-600 text-white h-8 px-3"
                                    >
                                        {addingScheme === fund.scheme_code ? (
                                            <Loader2 className="animate-spin" size={14} />
                                        ) : (
                                            <>
                                                <Plus size={14} className="mr-1" />
                                                Add
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
                    <span>Search by fund name or AMC</span>
                    <span className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">↑↓</kbd>
                        <span>Navigate</span>
                        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Enter</kbd>
                        <span>Select</span>
                        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Esc</kbd>
                        <span>Close</span>
                    </span>
                </div>
            </div>
        </div>
    )
}
