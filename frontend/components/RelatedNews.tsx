import React, { useState, useEffect } from 'react'
import { Clock, Newspaper, X } from 'lucide-react'
import { getToken } from '../lib/auth'
import { config } from '../config'
import { Button } from "@/components/ui/button"

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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      try {
        const token = getToken()
        const headers: HeadersInit = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        // If ticker is provided, fetch news specifically for that ticker
        // Otherwise fetch general watchlist news
        let url: string
        if (ticker) {
          // Fetch news for specific ticker from /api/news endpoint (7 days default)
          url = `${config.API_BASE_URL}/api/news/7?stock_name=${ticker}&ticker=${ticker}`
        } else {
          // Fetch specific watchlist news if ID is provided, otherwise default
          url = `${config.API_BASE_URL}/api/watchlist/news${watchlistId ? `?watchlist_id=${watchlistId}` : ''}`
        }

        const res = await fetch(url, { headers })
        const data = await res.json()

        if (data.success) {
          // Handle different response structures
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

    fetchNews()
  }, [ticker, watchlistId])

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

      <div className="flex-1 overflow-y-auto scrollbar-hide p-0 bg-transparent">
        {loading ? (
          <div className="p-10 text-center text-gray-500 text-sm animate-pulse">Loading market insights...</div>
        ) : news.length > 0 ? (
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
            No recent news found based on your watchlist.
          </div>
        )}
      </div>
    </div>
  )
}
