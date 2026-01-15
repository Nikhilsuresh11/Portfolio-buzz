import React, { useState, useEffect } from 'react'
import { Plus, Check, TrendingUp, ArrowRight, Loader2 } from 'lucide-react'
import { buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Stock {
  ticker: string
  name: string
  exchange?: string
  sector?: string
}

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  onAddStock: (ticker: string) => void
  watchlist: Stock[]
}

export default function WelcomeModal({ isOpen, onClose, onAddStock, watchlist }: WelcomeModalProps) {
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [addedStocks, setAddedStocks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      fetchTrendingStocks()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const fetchTrendingStocks = async () => {
    try {
      const url = buildPublicApiUrl('search/default?limit=6');
      const res = await fetch(url, {
        headers: getApiHeaders()
      })

      const data = await res.json()
      if (data.success) {
        setTrendingStocks(data.data)
      }
    } catch (error) {
      console.error('Error fetching trending stocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = (ticker: string) => {
    onAddStock(ticker)
    setAddedStocks(prev => new Set(prev).add(ticker))
  }

  const isStockInWatchlist = (ticker: string) => {
    return watchlist.some(s => s.ticker === ticker) || addedStocks.has(ticker)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-[600px] max-w-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative animate-in zoom-in-95 duration-300">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/20 blur-[60px] pointer-events-none" />

        <div className="p-10 relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/30 ring-1 ring-blue-500/30">
              <TrendingUp size={40} className="text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-3">Welcome to Portfolio Buzz</h2>
            <p className="text-gray-400 text-lg">Start by adding popular stocks to your watchlist to track their performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {loading ? (
              <div className="col-span-2 flex justify-center py-10">
                <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
              </div>
            ) : (
              trendingStocks.map(stock => {
                const added = isStockInWatchlist(stock.ticker)
                return (
                  <div
                    key={stock.ticker}
                    className={`
                                    flex items-center justify-between p-4 rounded-xl border transition-all duration-300
                                    ${added ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}
                                `}
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-white text-base">{stock.ticker}</span>
                      <span className="text-sm text-gray-400 truncate w-32">{stock.name}</span>
                    </div>
                    <Button
                      size="icon"
                      onClick={() => !added && handleAdd(stock.ticker)}
                      disabled={added}
                      className={`
                                        h-10 w-10 rounded-xl transition-all
                                        ${added ? 'bg-emerald-500 text-white hover:bg-emerald-600 opacity-100' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 shadow-md shadow-blue-600/20'}
                                    `}
                    >
                      {added ? <Check size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                    </Button>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-center">
            <Button
              className="w-full h-14 text-lg font-semibold bg-white text-black hover:bg-gray-100 rounded-xl shadow-xl shadow-white/5 transform transition-transform active:scale-95"
              onClick={onClose}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
