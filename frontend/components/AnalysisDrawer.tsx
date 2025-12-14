import { useEffect, useState } from 'react'
import { X, Copy, Download, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function AnalysisDrawer({ ticker, open, onClose }: { ticker?: string | null, open: boolean, onClose: () => void }) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && ticker) {
      setLoading(true)
      // Immediately show placeholder analysis so drawer opens without delay
      const demo = `• ${ticker} — AI Quick Insight\n\n1. Market Position: Strong uptrend detected in the last 5 sessions aligned with sector growth.\n2. Fundamental: Quarterly earnings exceeded expectations by 5%, driven by operational efficiency.\n3. Risk Factors: Global supply chain constraints may impact short-term inventory levels.\n4. Analyst Consensus: Buy rating maintained with a revised target price (+12%).\n\n(This is a generated placeholder for demo purposes)`

      // Simulate typing effect or delay if needed, but for now instant
      setTimeout(() => {
        setAnalysis(demo)
        setLoading(false)
      }, 600)
    } else {
      setAnalysis(null)
      setLoading(false)
    }
  }, [open, ticker])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 bottom-0 w-[400px] max-w-full bg-[#1e293b] border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0f172a]">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{ticker} Report</h3>
            <div className="text-xs text-blue-400 font-medium mt-1">AI GENERATED INSIGHTS</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10">
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-40 gap-3 text-gray-500">
              <Loader2 className="animate-spin text-blue-500" />
              <span className="text-sm">Generating insights...</span>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-xl p-5 shadow-inner">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 leading-relaxed font-normal">
                {analysis}
              </pre>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-[#0f172a] flex gap-3">
          <Button
            className="flex-1 bg-white/10 hover:bg-white/20 text-white gap-2"
            onClick={() => { if (ticker) navigator.clipboard?.writeText(analysis || ''); }}
          >
            <Copy size={16} /> Copy
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white gap-2"
            onClick={() => { if (ticker) { const blob = new Blob([analysis || ''], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${ticker}_analysis.txt`; a.click(); } }}
          >
            <Download size={16} /> Download
          </Button>
        </div>
      </aside>
    </>
  )
}
