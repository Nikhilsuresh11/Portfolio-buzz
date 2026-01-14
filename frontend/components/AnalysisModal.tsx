import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from 'react'
import { getToken } from '../lib/auth'
import { config } from '../config'
import { Button } from "@/components/ui/button"
import { X, Loader2, Sparkles } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Article {
  title: string
  url?: string
  content: string
  source: string
  published_at: string
}

interface AnalysisModalProps {
  ticker?: string | null
  open: boolean
  onClose: () => void
  newsArticles?: Article[]  // Pre-fetched news from watchlist
}

interface AnalysisSection {
  title: string
  content: string
}

export default function AnalysisModal({ ticker, open, onClose, newsArticles = [] }: AnalysisModalProps) {
  const [analysis, setAnalysis] = useState<string>('')
  const [sections, setSections] = useState<AnalysisSection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && ticker) {
      document.body.style.overflow = 'hidden'
      fetchAnalysis(ticker, newsArticles)
    } else {
      document.body.style.overflow = ''
      setAnalysis('')
      setSections([])
      setError('')
    }
    return () => { document.body.style.overflow = '' }
  }, [open, ticker, newsArticles])

  // Parse markdown into sections based on H3 headers
  useEffect(() => {
    if (analysis) {
      const lines = analysis.split('\n')
      const parsedSections: AnalysisSection[] = []
      let currentSection: AnalysisSection | null = null

      lines.forEach(line => {
        // Check if line is an H3 header (### Title) - for numbered sections like "1. EXECUTIVE SUMMARY"
        if (line.startsWith('### ')) {
          if (currentSection) {
            parsedSections.push(currentSection)
          }
          currentSection = {
            title: line.replace('### ', '').trim(),
            content: ''
          }
        } else if (currentSection) {
          currentSection.content += line + '\n'
        }
      })

      if (currentSection) {
        parsedSections.push(currentSection)
      }

      setSections(parsedSections.length > 0 ? parsedSections : [{ title: 'Analysis', content: analysis }])
    }
  }, [analysis])

  const fetchAnalysis = async (stockTicker: string, articles: Article[]) => {
    setLoading(true)
    setError('')
    try {
      const token = getToken()

      // Format articles for AI context
      const newsContext = articles.map(article => ({
        title: article.title,
        content: article.content,
        source: article.source,
        published_at: article.published_at
      }))

      const res = await fetch(`${config.API_BASE_URL}/api/ai-insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_name: stockTicker.split('.')[0],
          ticker: stockTicker,
          news_articles: newsContext
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
        className="w-[900px] max-w-full bg-black rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/10 bg-black">
          <div className="flex items-center gap-3">
            <Sparkles className="text-blue-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{ticker} AI Insights</h2>
              <p className="text-sm text-gray-400 mt-1">Powered by advanced AI analysis</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10">
            <X size={20} />
          </Button>
        </div>

        {/* Content - Scrollable with hidden scrollbar */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 bg-black">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 min-h-[400px]">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              <p>Analyzing stock data...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-400 min-h-[400px]">
              {error}
            </div>
          ) : sections.length > 0 ? (
            <Accordion type="multiple" defaultValue={["item-0"]} className="w-full">
              {sections.map((section, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
                  <AccordionTrigger className="text-left text-blue-400 hover:text-blue-300 font-semibold text-base">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed">
                      <ReactMarkdown
                        components={{
                          h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mb-4 mt-6 first:mt-0" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-blue-400 mb-3 mt-5" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-blue-300 mb-2 mt-4" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-4 text-gray-300" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 mb-4 space-y-2 marker:text-blue-500" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 mb-4 space-y-2 marker:text-blue-500" {...props} />,
                          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4" {...props} />,
                          code: ({ node, ...props }) => <code className="bg-white/10 rounded px-1 py-0.5 font-mono text-xs text-blue-300" {...props} />,
                        }}
                      >
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : null}
        </div>
      </div>
    </div>
  )
}
