import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth-context'
import { buildApiUrl, getApiHeaders } from '../lib/api-helpers'
import { PageLoader } from '@/components/ui/page-loader'
import { Bell, Calendar, Info, Trash2, ArrowRight, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

interface Notification {
    _id: string;
    user_email: string;
    ticker: string;
    name: string;
    change_percent: number;
    price: number;
    prev_close: number;
    type: string;
    status: string;
    timestamp: string;
    title: string;
    message: string;
}

export default function Notifications() {
    const router = useRouter()
    const { userEmail, isLoading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState<Notification[]>([])

    useEffect(() => {
        if (!authLoading && !userEmail) {
            router.push('/')
            return
        }

        if (userEmail) {
            fetchNotifications()
        }
    }, [authLoading, userEmail, router])

    const fetchNotifications = async () => {
        if (!userEmail) return

        try {
            setLoading(true)
            const url = buildApiUrl(userEmail, 'notifications?limit=100')
            const response = await fetch(url, {
                headers: getApiHeaders()
            })
            const data = await response.json()

            if (data.success) {
                setNotifications(data.data)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading && notifications.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center h-full min-h-screen">
                <PageLoader
                    messages={[
                        "Loading notifications...",
                        "Fetching your alerts...",
                        "Almost ready..."
                    ]}
                    subtitle="Checking for updates"
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-black">
            <div className="flex-none p-6 md:p-8 pb-0 z-10 max-w-[1200px] mx-auto w-full">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Bell className="text-blue-500" />
                        Notifications
                    </h1>
                    <p className="text-neutral-400">View recent alerts and email notifications sent to your inbox</p>
                </div>
            </div>

            <div className="flex-1 px-6 md:px-8 pb-6 md:pb-8 overflow-y-auto scrollbar-hide max-w-[1200px] mx-auto w-full">

                {notifications.length > 0 ? (
                    <div className="space-y-4">
                        {notifications.map((notif) => (
                            <div
                                key={notif._id}
                                className="group bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.07] backdrop-blur-sm rounded-2xl p-5 transition-all duration-300 shadow-xl"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${notif.type === 'price_drop' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {notif.type === 'price_drop' ? <TrendingDown size={24} /> : <Info size={24} />}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                                {notif.title}
                                            </h3>
                                            <span className="text-xs text-neutral-500 flex items-center gap-1.5 whitespace-nowrap bg-white/5 px-2 py-1 rounded-md">
                                                <Calendar size={12} />
                                                {format(new Date(notif.timestamp), 'MMM dd, yyyy • HH:mm')}
                                            </span>
                                        </div>

                                        <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                                            {notif.message}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                                                <span className="text-neutral-500">Stock:</span>
                                                <span className="text-white font-medium">{notif.ticker}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                                                <span className="text-neutral-500">Price:</span>
                                                <span className="text-white font-medium">₹{notif.price.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
                                                <span className="text-red-400 font-medium">{notif.change_percent.toFixed(2)}%</span>
                                            </div>
                                            <div className="ml-auto flex items-center gap-2">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-green-500/80 bg-green-500/10 px-2 py-0.5 rounded">
                                                    Email {notif.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-2xl border-dashed">
                        <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Bell className="text-neutral-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No notifications yet</h3>
                        <p className="text-neutral-500 text-center max-w-sm mb-6">
                            When your watchlist stocks experience significant price changes, you'll find the alerts here.
                        </p>
                        <Button
                            onClick={() => router.push('/watchlist')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Go to Watchlist
                        </Button>
                    </div>
                )}
            </div>

            {/* Background ambient light effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
        </div>
    )
}
