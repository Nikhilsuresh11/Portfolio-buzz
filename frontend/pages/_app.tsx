import '../styles/globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import type { AppProps } from 'next/app'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { AuthProvider } from '../lib/auth-context'
import { PortfolioProvider } from '../lib/portfolio-context'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { config } from '../config'

import Sidebar from '../components/Sidebar'
import StockSearchModal from '../components/StockSearchModal'

function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isStandalonePage = router.pathname === '/' || router.pathname.startsWith('/auth')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  if (isStandalonePage) return <>{children}</>

  const handleStockSelect = async (ticker: string) => {
    // Close the search modal
    setIsSearchOpen(false)
    // Navigate to watchlist page (or you can customize this behavior)
    router.push('/watchlist')
    return Promise.resolve()
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>

      {/* Global Stock Search Modal */}
      <StockSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddStock={handleStockSelect}
        watchlist={[]}
      />
    </div>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GoogleOAuthProvider clientId={config.GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <PortfolioProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
          <ToastContainer position="top-right" theme="dark" />
        </PortfolioProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}
