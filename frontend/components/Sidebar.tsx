import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, TrendingUp, Star, Newspaper, Settings, Search, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
    onSearchClick?: () => void
    onResearchClick?: () => void
}

export default function Sidebar({ onSearchClick, onResearchClick }: SidebarProps) {
    const router = useRouter()

    // Helper to check active state
    const isActive = (path: string) => router.pathname === path

    const NavItem = ({ href, icon: Icon, title, onClick, active }: any) => {
        const content = (
            <div className={cn(
                "w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer",
                active
                    ? "bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-900/20"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            )}
                title={title}
            >
                <Icon size={20} strokeWidth={2} />
            </div>
        )

        if (onClick) {
            return <button onClick={onClick} className="border-0 bg-transparent p-0">{content}</button>
        }

        return <Link href={href} legacyBehavior><a className="no-underline">{content}</a></Link>
    }

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[72px] flex flex-col gap-4 items-center pt-7 pb-5 bg-black/60 backdrop-blur-xl border-r border-white/10 shadow-2xl z-50">
            <nav className="flex flex-col gap-4 mt-5 w-full items-center">
                <NavItem href="/watchlist" icon={Home} title="Home" active={isActive('/watchlist')} />

                <NavItem onClick={onSearchClick} icon={Search} title="Search Stocks" />

                <NavItem onClick={onResearchClick} icon={FlaskConical} title="Deep Research" />

                <div className="w-8 h-px bg-white/10 my-1" />

                <NavItem href="#" icon={TrendingUp} title="Portfolio" />
                <NavItem href="#" icon={Star} title="Watchlist" />
                <NavItem href="#" icon={Newspaper} title="News" />

                <div className="mt-auto flex flex-col gap-4 items-center w-full">
                    <NavItem href="/settings" icon={Settings} title="Settings" active={isActive('/settings')} />
                </div>
            </nav>
        </aside>
    )
}
