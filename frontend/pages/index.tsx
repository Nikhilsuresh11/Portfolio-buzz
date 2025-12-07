import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import StockTable from '../components/StockTable'
import RelatedNews from '../components/RelatedNews'
import StockSearchModal from '../components/StockSearchModal'
import WelcomeModal from '../components/WelcomeModal'
import AnalysisModal from '../components/AnalysisModal'
import { getToken, getUser } from '../lib/auth'

type Stock = {
    ticker: string;
    name: string;
    shares?: number;
    price?: number;
    change?: number;
    changePercent?: number;
    currency?: string;
}

export default function Home() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [watchlist, setWatchlist] = useState<Stock[]>([])
    const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
    const [analysisTicker, setAnalysisTicker] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check authentication
        const token = getToken()
        const userData = getUser()

        if (!token || !userData) {
            router.push('/auth/login')
            return
        }

        setUser(userData)
        fetchWatchlistData()

        // Apply saved theme or default to dark
        const savedTheme = localStorage.getItem('pb_theme') as 'light' | 'dark' | null
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme)
        } else {
            document.documentElement.setAttribute('data-theme', 'dark')
            localStorage.setItem('pb_theme', 'dark')
        }
    }, [])

    const fetchWatchlistData = async () => {
        try {
            const token = getToken()
            if (!token) return

            const headers = { 'Authorization': `Bearer ${token}` }

            // Fetch watchlist and prices in parallel
            const [watchlistRes, pricesRes] = await Promise.all([
                fetch('http://localhost:5000/api/watchlist', { headers }),
                fetch('http://localhost:5000/api/watchlist/price', { headers })
            ])

            const watchlistData = await watchlistRes.json()
            const pricesData = await pricesRes.json()

            if (watchlistData.success) {
                let stocks = watchlistData.data as Stock[]

                // Merge prices if available
                if (pricesData.success && pricesData.data) {
                    stocks = stocks.map(stock => {
                        const priceInfo = pricesData.data[stock.ticker]
                        if (priceInfo) {
                            return {
                                ...stock,
                                price: priceInfo.price,
                                change: priceInfo.change,
                                changePercent: priceInfo.change_percent,
                                currency: priceInfo.currency
                            }
                        }
                        return stock
                    })
                }

                setWatchlist(stocks)

                // If watchlist is empty, show welcome modal
                if (stocks.length === 0) {
                    const hasShown = sessionStorage.getItem('welcome_shown')
                    if (!hasShown) {
                        setIsWelcomeOpen(true)
                        sessionStorage.setItem('welcome_shown', 'true')
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching watchlist data:', error)
        } finally {
            setLoading(false)
        }
    }

    const addStock = async (ticker: string) => {
        try {
            const token = getToken()
            if (!token) return

            const res = await fetch('http://localhost:5000/api/watchlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ticker })
            })

            const data = await res.json()
            if (data.success) {
                // Refresh data to get prices for the new stock
                fetchWatchlistData()
                setSelectedTicker(ticker)
            }
        } catch (error) {
            console.error('Error adding stock:', error)
        }
    }

    const removeStock = async (ticker: string) => {
        try {
            const token = getToken()
            if (!token) return

            const res = await fetch(`http://localhost:5000/api/watchlist/${ticker}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await res.json()
            if (data.success) {
                setWatchlist(prev => prev.filter(s => s.ticker !== ticker))
                if (selectedTicker === ticker) {
                    setSelectedTicker(null)
                }
            }
        } catch (error) {
            console.error('Error removing stock:', error)
        }
    }

    const handleAnalyze = (ticker: string) => {
        setAnalysisTicker(ticker)
        setIsAnalysisOpen(true)
    }

    if (loading) return null // Or a loading spinner

    return (
        <div className="app-root">
            <Sidebar onSearchClick={() => setIsSearchOpen(true)} />

            <main className="main-col">
                <Header user={user?.name || 'User'} />

                <div className="content-grid">
                    <div className="watchlist-section">
                        <StockTable
                            rows={watchlist}
                            onSelect={setSelectedTicker}
                            onAnalyze={handleAnalyze}
                            onRemove={removeStock}
                            selectedTicker={selectedTicker}
                        />
                    </div>

                    <div className="news-section">
                        <RelatedNews
                            ticker={selectedTicker}
                            onClose={() => setSelectedTicker(null)}
                        />
                    </div>
                </div>
            </main>

            <StockSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onAddStock={addStock}
                watchlist={watchlist}
            />

            <WelcomeModal
                isOpen={isWelcomeOpen}
                onClose={() => setIsWelcomeOpen(false)}
                onAddStock={addStock}
                watchlist={watchlist}
            />

            <AnalysisModal
                ticker={analysisTicker}
                open={isAnalysisOpen}
                onClose={() => setIsAnalysisOpen(false)}
            />

            <style jsx>{`
        .app-root {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .main-col {
          flex: 1;
          margin-left: 72px; /* Sidebar width */
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .content-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          padding: 24px;
          overflow: hidden;
        }

        .watchlist-section {
          overflow-y: auto;
          padding-right: 8px;
        }

        .news-section {
          height: 100%;
          overflow: hidden;
          border-radius: 16px;
          background: rgba(30, 41, 59, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .news-section {
            display: none; /* Hide news on smaller screens or make it a modal */
          }

          /* If a stock is selected, we could show news in a modal or overlay on mobile */
        }
      `}</style>
        </div>
    )
}
