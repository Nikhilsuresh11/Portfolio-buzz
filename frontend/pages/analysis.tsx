import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { getUser } from '../lib/auth'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from 'lucide-react'

export default function Analysis() {
  const router = useRouter()
  const [ticker, setTicker] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = getUser()
    setUser(userData)
    // Enforce dark mode
    document.documentElement.setAttribute('data-theme', 'dark')

    const sel = localStorage.getItem('pb_selected')
    setTicker(sel)
    // For demo, load simple placeholder or fetch from backend when available
    if (sel) {
      setAnalysis(`• Key insight 1 for ${sel}\n• Key insight 2 for ${sel}\n\n(Connect to news backend to generate full report)`)
    } else {
      router.push('/')
    }
  }, [router])

  const download = () => {
    if (!ticker || !analysis) return
    const blob = new Blob([`PORTFOLIO BUZZ - ANALYSIS\n\nStock: ${ticker}\n\n${analysis}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ticker}_analysis.txt`
    a.click()
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen relative p-6 bg-gradient-to-br from-[#000] to-[#1A2428] text-white">
      <Header user={user?.name || 'User'} />

      <div className="max-w-4xl mx-auto w-full z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/watchlist')} className="rounded-full hover:bg-white/10">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Analysis — <span className="text-blue-400">{ticker}</span></h1>
          </div>
          <Button onClick={download} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
            <Download size={16} /> Download Report
          </Button>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl min-h-[500px]">
          <pre className="whitespace-pre-wrap font-mono text-gray-300 leading-relaxed text-sm">
            {analysis}
          </pre>
        </div>
      </div>
      {/* Background ambient light effects */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
    </div>
  );
}
