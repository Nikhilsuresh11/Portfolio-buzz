import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth-context'
import { usePortfolio } from '../lib/portfolio-context'
import { buildPublicApiUrl, getApiHeaders } from '../lib/api-helpers'
import { Search, Loader2, Building2, Send, Sparkles, PieChart } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface Message {
    id: string
    type: 'user' | 'assistant'
    content: string
    classification?: 'company_fundamental' | 'generic_company_question' | 'portfolio_queries'
    timestamp: Date
    format?: 'html' | 'text'
}

export default function ResearchPage() {
    const router = useRouter()
    const { userEmail, isLoading: isAuthLoading } = useAuth()
    const { currentPortfolio } = usePortfolio()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedClassification, setSelectedClassification] = useState<'company_fundamental' | 'generic_company_question' | 'portfolio_queries'>('generic_company_question')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (!isAuthLoading && !userEmail) {
            router.push('/')
            return
        }
        document.documentElement.setAttribute('data-theme', 'dark')
        inputRef.current?.focus()
    }, [router, isAuthLoading, userEmail])

    useEffect(() => {
        console.log('Current Portfolio:', currentPortfolio)
    }, [currentPortfolio])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: input.trim(),
            classification: selectedClassification,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            console.log('Sending request to copilot API...')
            console.log('currentPortfolio:', currentPortfolio)

            // Use the same pattern as positions.tsx
            const portfolioId = currentPortfolio?.portfolio_id || 'default'
            console.log('portfolio_id will be:', portfolioId)

            // Build conversation history - ALL messages in chronological order
            const conversationHistory = []
            for (let i = 0; i < messages.length; i++) {
                if (messages[i].type === 'user') {
                    const userMsg = messages[i]
                    const assistantMsg = messages[i + 1]

                    conversationHistory.push({
                        query: userMsg.content,
                        answer: assistantMsg?.type === 'assistant' ? assistantMsg.content : ''
                    })
                }
            }

            const payload = {
                query: userMessage.content,
                classification: selectedClassification,
                user_email: userEmail,
                portfolio_id: portfolioId,
                previous_conversation: conversationHistory // ALL conversation history in chronological order
            }

            console.log('Payload:', payload)

            const response = await fetch(buildPublicApiUrl('copilot'), {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify(payload)
            })

            console.log('Response status:', response.status)
            const data = await response.json()
            console.log('Response data:', data)

            if (data.success) {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'assistant',
                    content: data.data.answer || data.data.response || 'No response',
                    timestamp: new Date(),
                    format: data.data.format || 'text'
                }
                setMessages(prev => [...prev, assistantMessage])
            } else {
                throw new Error(data.error || 'Failed to get response')
            }
        } catch (error) {
            console.error('Error:', error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: `<p style="color: #ef4444;">Error: ${error instanceof Error ? error.message : 'Something went wrong'}</p>`,
                timestamp: new Date(),
                format: 'html'
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const classifications = [
        {
            id: 'generic_company_question' as const,
            icon: Search,
            placeholder: 'Ask about markets, PE ratios, investing...'
        },
        {
            id: 'company_fundamental' as const,
            icon: Building2,
            placeholder: 'Analyze RELIANCE stock fundamentals...'
        },
        {
            id: 'portfolio_queries' as const,
            icon: PieChart,
            placeholder: 'How is my portfolio performing?'
        }
    ]

    const hasMessages = messages.length > 0

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* Header - Always Visible */}
            {hasMessages && (
                <div className="flex-none px-6 pt-6 pb-4 border-b border-zinc-900">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                            AI Copilot
                        </h1>
                        <p className="text-zinc-500 text-xs italic">Analyze stocks, evaluate fundamentals, and get portfolio insights powered by AI</p>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!hasMessages ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="max-w-2xl mx-auto px-4 w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="relative bg-black border border-gray-800 rounded-2xl px-4 pb-4 pt-2 focus-within:border-cyan-500/50 transition-colors shadow-2xl">
                                    <div className="flex items-start gap-3 mb-3">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={classifications.find(c => c.id === selectedClassification)?.placeholder}
                                            className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[24px] max-h-[120px] text-base py-1 overflow-hidden"
                                            rows={1}
                                            disabled={isLoading}
                                            style={{
                                                height: 'auto',
                                                minHeight: '24px'
                                            }}
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement
                                                target.style.height = 'auto'
                                                target.style.height = target.scrollHeight + 'px'
                                            }}
                                        />

                                        <Button
                                            type="submit"
                                            disabled={!input.trim() || isLoading}
                                            className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </div>

                                    {/* Sample Queries */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {(selectedClassification === 'generic_company_question' ? ['What is PE ratio?', 'How to evaluate a stock?'] :
                                            selectedClassification === 'company_fundamental' ? ['Analyse Reliance', 'Is HDFC Bank a good buy?'] :
                                                ['How is my portfolio?', 'What are my top holdings?']).map((sample) => (
                                                    <button
                                                        key={sample}
                                                        type="button"
                                                        onClick={() => {
                                                            setInput(sample)
                                                            if (inputRef.current) {
                                                                inputRef.current.style.height = 'auto'
                                                                inputRef.current.style.height = '32px'
                                                                inputRef.current.focus()
                                                            }
                                                        }}
                                                        className="text-[11px] font-medium px-3 py-1 rounded-full bg-zinc-900 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all border border-zinc-800 hover:border-cyan-500/30"
                                                    >
                                                        {sample}
                                                    </button>
                                                ))}
                                    </div>

                                    {/* Classification Icons - Below textarea */}
                                    <div className="flex gap-2">
                                        {classifications.map((c) => {
                                            const Icon = c.icon
                                            const isSelected = selectedClassification === c.id
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => setSelectedClassification(c.id)}
                                                    className={`p-2.5 rounded-xl transition-all ${isSelected
                                                        ? 'bg-cyan-500/20 text-cyan-400'
                                                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                                                        }`}
                                                    title={c.id === 'generic_company_question' ? 'General Query' : c.id === 'company_fundamental' ? 'Company Analysis' : 'My Portfolio'}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Messages - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-4">
                            <div className="max-w-4xl mx-auto py-6 space-y-6">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                    >
                                        {message.type === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[80%] rounded-2xl px-5 py-4 ${message.type === 'user'
                                                ? 'bg-cyan-500/10 border border-cyan-500/30'
                                                : 'bg-zinc-900/30 border border-zinc-800'
                                                }`}
                                        >
                                            {message.format === 'html' ? (
                                                <div
                                                    className="prose prose-invert prose-sm max-w-none
                                                    prose-headings:text-white prose-headings:font-semibold
                                                    prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-4 prose-h3:first:mt-0
                                                    prose-h4:text-base prose-h4:mb-2 prose-h4:mt-3
                                                    prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-3
                                                    prose-strong:text-cyan-400 prose-strong:font-semibold
                                                    prose-ul:my-2 prose-li:text-gray-300 prose-li:my-1
                                                    prose-table:border-collapse prose-table:w-full prose-table:my-4
                                                    prose-th:bg-gray-800 prose-th:text-white prose-th:font-semibold prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-gray-700
                                                    prose-td:p-3 prose-td:border prose-td:border-gray-800 prose-td:text-gray-300"
                                                    dangerouslySetInnerHTML={{ __html: message.content }}
                                                />
                                            ) : (
                                                <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                                                    {message.content}
                                                </p>
                                            )}
                                            <div className="text-xs text-gray-500 mt-2">
                                                {message.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>

                                        {message.type === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-sm font-semibold">
                                                    {userEmail?.[0]?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-4 justify-start">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                                                <span className="text-gray-400 text-sm">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Bottom Input Bar */}
                        <div className="flex-none bg-black px-4 py-4">
                            <div className="max-w-4xl mx-auto">
                                <form onSubmit={handleSubmit}>
                                    <div className="relative bg-black border border-gray-800 rounded-2xl px-3 pb-3 pt-2 focus-within:border-cyan-500/50 transition-colors">
                                        <div className="flex items-start gap-3 mb-2">
                                            <textarea
                                                ref={inputRef}
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder={classifications.find(c => c.id === selectedClassification)?.placeholder}
                                                className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[24px] max-h-[120px] py-1 overflow-hidden"
                                                rows={1}
                                                disabled={isLoading}
                                                style={{
                                                    height: 'auto',
                                                    minHeight: '24px'
                                                }}
                                                onInput={(e) => {
                                                    const target = e.target as HTMLTextAreaElement
                                                    target.style.height = 'auto'
                                                    target.style.height = target.scrollHeight + 'px'
                                                }}
                                            />

                                            <Button
                                                type="submit"
                                                disabled={!input.trim() || isLoading}
                                                className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Send className="w-5 h-5" />
                                                )}
                                            </Button>
                                        </div>

                                        {/* Sample Queries */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {(selectedClassification === 'generic_company_question' ? ['What is PE ratio?', 'How to evaluate a stock?'] :
                                                selectedClassification === 'company_fundamental' ? ['Analyse Reliance', 'Is HDFC Bank a good buy?'] :
                                                    ['How is my portfolio?', 'What are my top holdings?']).map((sample) => (
                                                        <button
                                                            key={sample}
                                                            type="button"
                                                            onClick={() => {
                                                                setInput(sample)
                                                                if (inputRef.current) {
                                                                    inputRef.current.style.height = 'auto'
                                                                    inputRef.current.style.height = '32px'
                                                                    inputRef.current.focus()
                                                                }
                                                            }}
                                                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all border border-zinc-800 hover:border-cyan-500/30"
                                                        >
                                                            {sample}
                                                        </button>
                                                    ))}
                                        </div>

                                        {/* Classification Icons - Below textarea */}
                                        <div className="flex gap-2">
                                            {classifications.map((c) => {
                                                const Icon = c.icon
                                                const isSelected = selectedClassification === c.id
                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => setSelectedClassification(c.id)}
                                                        className={`p-2 rounded-lg transition-all ${isSelected
                                                            ? 'bg-cyan-500/20 text-cyan-400'
                                                            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                                                            }`}
                                                        title={c.id === 'generic_company_question' ? 'General Query' : c.id === 'company_fundamental' ? 'Company Analysis' : 'My Portfolio'}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
