import '../styles/globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { MessageLoading } from '@/components/ui/message-loading'
import { AuthProvider } from '../lib/auth-context'
import { PortfolioProvider } from '../lib/portfolio-context'

import Sidebar from '../components/Sidebar'

function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isStandalonePage = router.pathname === '/' || router.pathname.startsWith('/auth')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  if (isStandalonePage) return <>{children}</>

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
    </div>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleStart = () => setLoading(true)
    const handleComplete = () => setLoading(false)

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

  return (
    <>
      <AuthProvider>
        <PortfolioProvider>
          <Layout>
            {loading && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <MessageLoading />
              </div>
            )}
            <Component {...pageProps} />
          </Layout>
          <ToastContainer position="top-right" theme="dark" />
        </PortfolioProvider>
      </AuthProvider>
    </>
  )
}
