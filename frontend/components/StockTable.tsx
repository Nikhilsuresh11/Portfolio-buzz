import React, { useState, useMemo } from 'react'
import { Wand2, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WatchlistLoader } from './ui/watchlist-loader'

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
    historical_returns?: {
      '1y'?: { change_percent: number; price: number };
      '3y'?: { change_percent: number; price: number };
      '5y'?: { change_percent: number; price: number };
    }
  }>
  onSelect: (ticker: string) => void
  onAnalyze: (ticker: string) => void
  onRemove: (ticker: string) => void
  selectedTicker?: string | null
  deletingTicker?: string | null
  isLoading?: boolean // Add this for partial loading
}

const getCurrencySymbol = (currency?: string) => {
  if (currency === 'INR') return '₹'
  if (currency === 'EUR') return '€'
  if (currency === 'GBP') return '£'
  return '$'
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

type SortKey = 'change' | '1y' | '3y' | '5y' | 'none';

export default function StockTable({ rows, onSelect, onAnalyze, onRemove, selectedTicker, deletingTicker, isLoading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedRows = useMemo(() => {
    if (sortKey === 'none') return rows;

    return [...rows].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortKey === 'change') {
        valA = a.changePercent || 0;
        valB = b.changePercent || 0;
      } else if (sortKey === '1y') {
        valA = a.historical_returns?.['1y']?.change_percent || 0;
        valB = b.historical_returns?.['1y']?.change_percent || 0;
      } else if (sortKey === '3y') {
        valA = a.historical_returns?.['3y']?.change_percent || 0;
        valB = b.historical_returns?.['3y']?.change_percent || 0;
      } else if (sortKey === '5y') {
        valA = a.historical_returns?.['5y']?.change_percent || 0;
        valB = b.historical_returns?.['5y']?.change_percent || 0;
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [rows, sortKey, sortOrder]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <div className="flex-1 overflow-hidden flex flex-col">
        <table className="w-full border-collapse text-left table-fixed">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm">
            <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <th className="px-3 py-3 bg-transparent text-left pl-4 w-[240px]">Company</th>
              <th className="px-3 py-3 bg-transparent text-right w-[100px]">Price</th>
              <th
                className="px-3 py-3 bg-transparent text-right w-[100px] cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('change')}
              >
                Change
              </th>
              <th
                className="px-3 py-3 bg-transparent text-right w-[90px] cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('1y')}
              >
                1Y
              </th>
              <th
                className="px-3 py-3 bg-transparent text-right w-[90px] cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('3y')}
              >
                3Y
              </th>
              <th
                className="px-3 py-3 bg-transparent text-right w-[90px] cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('5y')}
              >
                5Y
              </th>
              <th className="px-3 py-3 bg-transparent text-right w-[90px]">Range</th>
              <th className="px-3 py-3 bg-transparent text-right pr-4 w-[100px]">Actions</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide relative min-h-[400px]">
          {isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center transition-all duration-300">
              <div className="scale-50 md:scale-75">
                <WatchlistLoader />
              </div>
            </div>
          ) : (
            <table className="w-full border-collapse text-left table-fixed">
              <tbody className="divide-y divide-white/5">
                {sortedRows.map((r) => {
                  const dayChange = r.change || 0
                  const dayPct = r.changePercent || 0
                  const isSelected = selectedTicker === r.ticker
                  const isPositive = dayChange >= 0
                  const tickerPrefix = r.ticker.substring(0, 2).toUpperCase()

                  // Extract historical returns
                  const returns1y = r.historical_returns?.['1y']
                  const returns3y = r.historical_returns?.['3y']
                  const returns5y = r.historical_returns?.['5y']

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
                      <td className="px-3 py-4 pl-4 w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center 
                          text-white font-bold text-sm shadow-md
                          ${getRandomColor(r.ticker)}
                        `}>
                            {tickerPrefix}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-100 text-sm">{r.ticker}</div>
                            <div className="text-gray-400 text-xs truncate">{r.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-4 text-right font-bold text-[15px] text-gray-200 tabular-nums w-[100px]">
                        {getCurrencySymbol(r.currency)}{(r.price || 0).toFixed(2)}
                      </td>

                      {/* Change */}
                      <td className="px-3 py-4 text-right w-[100px]">
                        <div className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-semibold
                        ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
                      `}>
                          {isPositive ? <ArrowUp size={14} strokeWidth={2.5} /> : <ArrowDown size={14} strokeWidth={2.5} />}
                          {Math.abs(dayPct).toFixed(2)}%
                        </div>
                      </td>


                      {/* 1Y Return */}
                      <td className="px-3 py-4 text-right text-sm w-[90px]">
                        {returns1y ? (
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-semibold ${returns1y.change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {returns1y.change_percent >= 0 ? '+' : ''}{returns1y.change_percent}%
                            </span>
                            <span className="text-xs text-gray-500">{getCurrencySymbol(r.currency)}{returns1y.price}</span>
                          </div>
                        ) : <span className="text-gray-600 text-xs">-</span>}
                      </td>

                      {/* 3Y Return */}
                      <td className="px-3 py-4 text-right text-sm w-[90px]">
                        {returns3y ? (
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-semibold ${returns3y.change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {returns3y.change_percent >= 0 ? '+' : ''}{returns3y.change_percent}%
                            </span>
                            <span className="text-xs text-gray-500">{getCurrencySymbol(r.currency)}{returns3y.price}</span>
                          </div>
                        ) : <span className="text-gray-600 text-xs">-</span>}
                      </td>

                      {/* 5Y Return */}
                      <td className="px-3 py-4 text-right text-sm w-[90px]">
                        {returns5y ? (
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-semibold ${returns5y.change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {returns5y.change_percent >= 0 ? '+' : ''}{returns5y.change_percent}%
                            </span>
                            <span className="text-xs text-gray-500">{getCurrencySymbol(r.currency)}{returns5y.price}</span>
                          </div>
                        ) : <span className="text-gray-600 text-xs">-</span>}
                      </td>

                      {/* Day Range */}
                      <td className="px-3 py-4 text-right text-sm w-[90px]">
                        {r.low && r.high ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500">{r.low.toFixed(1)}</span>
                            <span className="text-xs text-gray-300">{r.high.toFixed(1)}</span>
                          </div>
                        ) : <span className="text-gray-600 text-xs">-</span>}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-4 text-right pr-4 w-[100px]">
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
                            disabled={deletingTicker === r.ticker}
                          >
                            {deletingTicker === r.ticker ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} strokeWidth={2} />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Your watchlist is empty. Click the search icon to add stocks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
