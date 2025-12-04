import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import StockTable from '../components/StockTable'
import RelatedNews from '../components/RelatedNews'
import AnalysisModal from '../components/AnalysisModal'

type Stock = { ticker: string; name?: string; shares?: number; price?: number }

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)
  const [watchlist, setWatchlist] = useState<Stock[]>([])

  useEffect(() => {
    const u = localStorage.getItem('pb_user')
    setUser(u)

    // Apply saved theme or default to dark
    const savedTheme = localStorage.getItem('pb_theme') as 'light' | 'dark' | null
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('pb_theme', 'dark')
    }

    const w = localStorage.getItem('pb_watchlist')
    setWatchlist(w ? JSON.parse(w) : [
      { ticker: 'GOOGL', name: 'Alphabet Inc', shares: 20, price: 142.38 },
      { ticker: 'AAPL', name: 'Apple Inc', shares: 5, price: 185.85 },
      { ticker: 'GMED', name: 'Globus Medical', shares: 40, price: 51.83 }
    ])
  }, [])

  const addStock = (ticker: string) => {
    if (watchlist.find(s => s.ticker === ticker)) return
    const next = [{ ticker, name: ticker, shares: 1, price: 100 }, ...watchlist]
    setWatchlist(next)
    localStorage.setItem('pb_watchlist', JSON.stringify(next))
  }

  const removeStock = (ticker: string) => {
    const next = watchlist.filter(s => s.ticker !== ticker)
    setWatchlist(next)
    localStorage.setItem('pb_watchlist', JSON.stringify(next))
  }

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

  const analyze = (ticker: string) => {
    setSelectedTicker(ticker)
    setDrawerOpen(true)
  }

  return (
    <div className="app-root">
      <Sidebar />
      <main className="main-col" style={{ marginRight: 360 }}>
        <Header user={user} />

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <StockTable rows={watchlist} onAnalyze={analyze} onRemove={removeStock} />
          </div>
        </div>
      </main>

      <RelatedNews />

      {/* Analysis modal */}
      <AnalysisModal ticker={selectedTicker} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
