import React from 'react'
import { Wand2, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  rows: Array<{
    ticker: string;
    name: string;
    price?: number;
    change?: number;
    changePercent?: number;
    currency?: string;
    shares?: number;
    volume?: number;
    high?: number;
    low?: number;
    open?: number;
    prev_close?: number;
  }>
  onSelect: (ticker: string) => void
  onAnalyze: (ticker: string) => void
  onRemove: (ticker: string) => void
  selectedTicker?: string | null
}

const getCurrencySymbol = (currency?: string) => {
  if (currency === 'INR') return '₹'
  if (currency === 'EUR') return '€'
  if (currency === 'GBP') return '£'
  return '$'
}

const formatVolume = (num?: number) => {
  if (!num) return '-'
  if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(1) + "B"
  if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(1) + "M"
  if (num >= 1.0e+3) return (num / 1.0e+3).toFixed(1) + "K"
  return num.toString()
}

const getRandomColor = (ticker: string) => {
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-emerald-500 to-emerald-600',
    'bg-gradient-to-br from-amber-500 to-amber-600',
  ]
  const index = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

export default function StockTable({ rows, onSelect, onAnalyze, onRemove, selectedTicker }: Props) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-4 bg-transparent">Company</th>
              <th className="px-6 py-4 bg-transparent text-right">Price</th>
              <th className="px-6 py-4 bg-transparent text-right">Change</th>
              <th className="px-6 py-4 bg-transparent text-right">Volume</th>
              <th className="px-6 py-4 bg-transparent text-right">Day Range</th>
              <th className="px-6 py-4 bg-transparent text-right w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => {
              const dayChange = r.change || 0
              const dayPct = r.changePercent || 0
              const isSelected = selectedTicker === r.ticker
              const isPositive = dayChange >= 0
              const tickerPrefix = r.ticker.substring(0, 2).toUpperCase()

              return (
                <tr
                  key={r.ticker}
                  onClick={() => onSelect(r.ticker)}
                  className={`
                    group cursor-pointer transition-colors duration-200
                    ${isSelected ? 'bg-blue-500/10' : 'hover:bg-white/5'}
                  `}
                >
                  {/* Company Column */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center 
                        text-white font-bold text-sm shadow-md
                        ${getRandomColor(r.ticker)}
                      `}>
                        {tickerPrefix}
                      </div>
                      <div>
                        <div className="font-bold text-gray-100 text-sm">{r.ticker}</div>
                        <div className="text-gray-400 text-xs">{r.name}</div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-5 text-right font-bold text-[15px] text-gray-200 tabular-nums">
                    {getCurrencySymbol(r.currency)}{(r.price || 0).toFixed(2)}
                  </td>

                  {/* Change */}
                  <td className="px-6 py-5 text-right">
                    <div className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-semibold
                      ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
                    `}>
                      {isPositive ? <ArrowUp size={14} strokeWidth={2.5} /> : <ArrowDown size={14} strokeWidth={2.5} />}
                      {Math.abs(dayPct).toFixed(2)}%
                    </div>
                  </td>

                  {/* Volume */}
                  <td className="px-6 py-5 text-right text-sm text-gray-300 font-medium tabular-nums">
                    {formatVolume(r.volume)}
                  </td>

                  {/* Day Range */}
                  <td className="px-6 py-5 text-right text-sm text-gray-400 tabular-nums">
                    {r.low && r.high ? (
                      <span>
                        {r.low.toFixed(1)} - {r.high.toFixed(1)}
                      </span>
                    ) : '-'}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAnalyze(r.ticker)
                        }}
                        title="AI Insights"
                      >
                        <Wand2 size={16} strokeWidth={2} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemove(r.ticker)
                        }}
                        title="Remove"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Your watchlist is empty. Click the search icon to add stocks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
