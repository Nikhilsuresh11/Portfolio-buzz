import React, { useState, useEffect } from 'react'
import { Clock, Newspaper, X, Sparkles, TrendingUp, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { buildApiUrl, buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { Button } from "@/components/ui/button"
import { WatchlistLoader } from './ui/watchlist-loader'

interface Article {
  title: string
  url: string
  link?: string
  source: string
  published_at: string
  summary?: string
  image_url?: string
}

interface Props {
  ticker?: string | null
  watchlistId?: string | null
  onClose?: () => void
  isModal?: boolean
}

export default function RelatedNews({ ticker, watchlistId, onClose }: Props) {
  const [news, setNews] = useState<Article[]>([])
  const [marketInsights, setMarketInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { userEmail } = useAuth()

  useEffect(() => {
    const fetchNewsAndInsights = async () => {
      setLoading(true)
      try {
        let newsUrl: string

        if (ticker) {
          // 1. Specific Stock Selected: Fetch news for it
          newsUrl = buildPublicApiUrl(`news/7?stock_name=${ticker}&ticker=${ticker}`)
          setMarketInsights([])
        } else if (userEmail) {
          // 2. Watchlist Mode: Fetch market insights + general news

          // A. Fetch Watchlist Tickers first (to generate insights)
          const watchlistUrl = buildApiUrl(userEmail, `watchlist?watchlist_id=${watchlistId || ''}`)
          const watchlistRes = await fetch(watchlistUrl, { headers: getApiHeaders() })
          const watchlistData = await watchlistRes.json()

          if (watchlistData.success && watchlistData.data && watchlistData.data.length > 0) {
            const tickers = watchlistData.data.map((s: any) => s.ticker)

            // Fire and forget insight generation (or await if fast enough)
            // We'll await it to show it at top
            try {
              const insightsUrl = buildApiUrl(userEmail, 'key-insights/watchlist')
              const insightsRes = await fetch(insightsUrl, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({ tickers })
              })
              const insightsData = await insightsRes.json()
              if (insightsData.success && insightsData.data && insightsData.data.bullets) {
                setMarketInsights(insightsData.data.bullets)
              }
            } catch (e) {
              console.error("Failed to fetch insights", e)
            }
          }

          // B. Fetch General Watchlist News
          newsUrl = buildApiUrl(userEmail, `watchlist/news${watchlistId ? `?watchlist_id=${watchlistId}` : ''}`)

        } else {
          setLoading(false)
          return
        }

        const res = await fetch(newsUrl, { headers: getApiHeaders() })
        const data = await res.json()

        if (data.success) {
          if (ticker) {
            // Response from /api/news endpoint
            if (data.data?.articles && Array.isArray(data.data.articles)) {
              setNews(data.data.articles)
            } else if (Array.isArray(data.data)) {
              setNews(data.data)
            } else {
              setNews([])
            }
          } else {
            // Watchlist response - flatten news from multiple stocks
            if (data.data && typeof data.data === 'object') {
              const allNews = Object.values(data.data).flat() as Article[]
              setNews(allNews.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()))
            } else {
              setNews([])
            }
          }
        }
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNewsAndInsights()
  }, [ticker, watchlistId, userEmail])

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Newspaper size={20} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            {ticker ? `${ticker} News` : 'Market News'}
          </h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-gray-400 hover:text-white">
            <X size={16} />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-0 bg-transparent relative">
        {loading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 overflow-hidden">
            <div className="scale-50 md:scale-75">
              <WatchlistLoader />
            </div>
          </div>
        ) : (
          <>
            {/* Market Insights Section - Only show when no specific ticker selected and we have insights */}
            {!ticker && marketInsights.length > 0 && (
              <div className="mb-6 mx-5 mt-5 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Market Pulse</h4>
                </div>
                <ul className="space-y-3">
                  {marketInsights.map((insight, idx) => {
                    const cleanText = insight.replace(/^• /, '');
                    const parts = cleanText.split('**');
                    return (
                      <li key={idx} className="text-sm text-zinc-300 leading-relaxed pl-3 border-l-2 border-blue-500/30">
                        {parts.map((part, i) =>
                          i % 2 === 1 ? <strong key={i} className="text-blue-200 font-semibold">{part}</strong> : part
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {news.length > 0 ? (
              news.map((article, i) => (
                <a
                  key={i}
                  href={article.url || article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-4 p-5 border-b border-white/5 hover:bg-white/5 transition-colors no-underline block"
                >
                  <div className="flex-1 flex flex-col gap-2">
                    <h4 className="text-sm font-medium text-gray-200 leading-snug group-hover:text-blue-200 transition-colors line-clamp-3">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium text-blue-400/80">{article.source}</span>
                      <span className="text-gray-600">•</span>
                      <span className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        {new Date(article.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {article.image_url && (
                    <div
                      className="w-20 h-20 rounded-lg bg-cover bg-center bg-neutral-900 shrink-0 border border-white/5"
                      style={{ backgroundImage: `url(${article.image_url})` }}
                    />
                  )}
                </a>
              ))
            ) : (
              <div className="p-10 text-center text-gray-500 text-sm">
                {ticker || marketInsights.length > 0
                  ? "No additional recent news found."
                  : "No recent news found based on your watchlist."
                }
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

