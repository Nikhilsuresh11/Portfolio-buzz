import React, { useState, useEffect } from 'react'
import { ExternalLink, Clock, Newspaper, X } from 'lucide-react'
import { getToken } from '../lib/auth'

interface Article {
  title: string
  link: string
  source: string
  published_at: string
  summary?: string
  image_url?: string
}

interface Props {
  ticker?: string | null
  onClose?: () => void
  isModal?: boolean
}

export default function RelatedNews({ ticker, onClose }: Props) {
  const [news, setNews] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      try {
        const token = getToken()
        const headers: HeadersInit = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        // If ticker is provided, fetch news for that ticker
        // Otherwise fetch general watchlist news
        const url = ticker
          ? `http://localhost:5000/api/watchlist/news?ticker=${ticker}`
          : `http://localhost:5000/api/watchlist/news`

        const res = await fetch(url, { headers })
        const data = await res.json()

        if (data.success) {
          // Handle different response structures depending on endpoint
          if (ticker && Array.isArray(data.data)) {
            setNews(data.data)
          } else if (data.data && typeof data.data === 'object') {
            // Flatten news from multiple stocks if needed, or just take the first batch
            const allNews = Object.values(data.data).flat() as Article[]
            setNews(allNews.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()))
          } else {
            setNews([])
          }
        }
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [ticker])

  return (
    <div className="news-container">
      <div className="news-header">
        <div className="header-content">
          <Newspaper size={20} className="header-icon" />
          <h3>{ticker ? `${ticker} News` : 'Market News'}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="news-list">
        {loading ? (
          <div className="loading">Loading news...</div>
        ) : news.length > 0 ? (
          news.map((article, i) => (
            <a
              key={i}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="news-item"
            >
              <div className="news-content">
                <h4 className="news-title">{article.title}</h4>
                <div className="news-meta">
                  <span className="source">{article.source}</span>
                  <span className="dot">•</span>
                  <span className="time">
                    <Clock size={12} style={{ marginRight: 4 }} />
                    {new Date(article.published_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {article.image_url && (
                <div className="news-image" style={{ backgroundImage: `url(${article.image_url})` }} />
              )}
            </a>
          ))
        ) : (
          <div className="empty-state">
            No news available for {ticker || 'your watchlist'}
          </div>
        )}
      </div>

      <style jsx>{`
        .news-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: rgba(30, 41, 59, 0.2);
          border-left: 1px solid rgba(248, 250, 252, 0.08);
          backdrop-filter: blur(10px);
        }

        .news-header {
          padding: 20px;
          border-bottom: 1px solid rgba(248, 250, 252, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.3);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          color: #3b82f6;
        }

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #f8fafc;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }

        .news-list {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .news-item {
          display: flex;
          gap: 16px;
          padding: 20px;
          text-decoration: none;
          border-bottom: 1px solid rgba(248, 250, 252, 0.05);
          transition: background 0.2s ease;
        }

        .news-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .news-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .news-title {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.5;
          color: #e2e8f0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .news-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #94a3b8;
        }

        .source {
          font-weight: 500;
          color: #3b82f6;
        }

        .time {
          display: flex;
          align-items: center;
        }

        .news-image {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          background-size: cover;
          background-position: center;
          background-color: rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .loading, .empty-state {
          padding: 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}
