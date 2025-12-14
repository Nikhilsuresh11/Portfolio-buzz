import { useEffect, useState } from 'react'
import RelatedNews from './RelatedNews'
import { getToken } from '../lib/auth'
import { config } from '../config'
import { Button } from "@/components/ui/button"
import { X, Loader2, Sparkles, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AnalysisModal({ ticker, open, onClose }: { ticker?: string | null, open: boolean, onClose: () => void }) {
  const [tab, setTab] = useState<'insights' | 'news'>('insights')
  const [analysis, setAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && ticker) {
      document.body.style.overflow = 'hidden'
      fetchAnalysis(ticker)
    } else {
      document.body.style.overflow = ''
      setTab('insights')
      setAnalysis('')
      setError('')
    }
    return () => { document.body.style.overflow = '' }
  }, [open, ticker])

  const fetchAnalysis = async (stockTicker: string) => {
    setLoading(true)
    setError('')
    try {
      const token = getToken()
      const res = await fetch(`${config.API_BASE_URL}/api/ai-insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_name: stockTicker.split('.')[0], // Simple heuristic for name
          ticker: stockTicker
        })
      })

      const data = await res.json()
      if (data.success) {
        setAnalysis(data.data.analysis)
      } else {
        setError(data.error || 'Failed to generate insights')
      }
    } catch (err) {
      setError('Failed to connect to analysis service')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200">
      <div
        className="w-[900px] max-w-full bg-[#1e293b] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/10 bg-[#0f172a]">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{ticker} Analysis</h2>
            <p className="text-sm text-gray-400 mt-1">AI-powered insights and related news</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10">
            <X size={20} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 bg-[#0f172a] border-b border-white/5">
          <Button
            variant={tab === 'insights' ? 'secondary' : 'ghost'}
            onClick={() => setTab('insights')}
            className={cn(
              "gap-2",
              tab === 'insights' ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" : "text-gray-400 hover:text-white"
            )}
          >
            <Sparkles size={16} /> AI Insights
          </Button>
          <Button
            variant={tab === 'news' ? 'secondary' : 'ghost'}
            onClick={() => setTab('news')}
            className={cn(
              "gap-2",
              tab === 'news' ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" : "text-gray-400 hover:text-white"
            )}
          >
            <Newspaper size={16} /> News
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#1e293b] min-h-[400px]">
          {tab === 'insights' ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-full min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                  <p>Analyzing stock data...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-red-400">
                  {error}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300 font-normal">
                  {analysis}
                </pre>
              )}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl h-full overflow-hidden">
              <RelatedNews isModal={true} ticker={ticker} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
