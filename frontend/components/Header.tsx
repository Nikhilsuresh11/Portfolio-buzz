import { Bell, Menu, ChevronDown, Layout, Folder, Settings, LogOut, HeartHandshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from '@/lib/auth'
import { useRouter } from 'next/router'
import { usePortfolio } from '@/lib/portfolio-context'

export default function Header({ user }: { user?: string | null }) {
  const router = useRouter()
  const { currentPortfolio, portfolios, setCurrentPortfolio } = usePortfolio()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const getPageTitle = () => {
    const path = router.pathname
    if (path === '/portfolio') return 'Portfolio Overview'
    if (path === '/portfolio/summary') return 'Portfolio Summary'
    if (path === '/positions') return 'My Positions'
    if (path === '/watchlist') return 'Watchlist'
    if (path === '/research') return 'Stock Research'
    if (path === '/settings') return 'Settings'
    if (path === '/notifications') return 'Notifications'
    return 'Dashboard'
  }

  return (
    <header className="flex h-16 items-center gap-4 bg-white/5 border-b border-white/10 px-6 backdrop-blur-md sticky top-0 z-40 w-full rounded-2xl mb-6 shadow-lg shadow-black/20">
      {/* Mobile Menu Trigger */}
      <Button variant="ghost" size="icon" className="md:hidden text-white/70 hover:text-white hover:bg-white/10">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>

      <div className="flex-1 flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-white/90">{getPageTitle()}</h1>
        {currentPortfolio && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-white/60 tracking-wide uppercase">
              {currentPortfolio.portfolio_name}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Quick Link */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 border border-white/5"
          onClick={() => router.push('/notifications')}
        >
          <Bell className="h-5 w-5 text-blue-400" />
          <span className="sr-only">Notifications</span>
        </Button>
        {/* Portfolio Switcher Quick Access (Visible on Desktop) */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-3 bg-white/5 hover:bg-white/10 text-white/80 border border-white/5">
                <Folder size={16} className="text-blue-400" />
                <span className="text-sm font-medium">{currentPortfolio?.portfolio_name || 'Switch'}</span>
                <ChevronDown size={14} className="text-white/40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-[#111] border-white/10 text-white p-1">
              <DropdownMenuLabel className="text-xs font-semibold text-white/40 px-2 py-1.5 uppercase tracking-wider">
                Switch Portfolio
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              {portfolios.map((portfolio) => (
                <DropdownMenuItem
                  key={portfolio.portfolio_id}
                  className={`flex items-center justify-between focus:bg-white/10 focus:text-white cursor-pointer rounded-md px-2 py-2 mb-0.5 ${currentPortfolio?.portfolio_id === portfolio.portfolio_id ? 'bg-blue-600/20 text-blue-400' : ''
                    }`}
                  onClick={() => setCurrentPortfolio(portfolio)}
                >
                  <div className="flex items-center gap-3">
                    <Folder size={14} className={currentPortfolio?.portfolio_id === portfolio.portfolio_id ? 'text-blue-400' : 'text-white/40'} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{portfolio.portfolio_name}</span>
                      {portfolio.is_default && <span className="text-[10px] text-blue-400/60 uppercase font-bold tabular-nums">Default</span>}
                    </div>
                  </div>
                  {currentPortfolio?.portfolio_id === portfolio.portfolio_id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                className="focus:bg-blue-600 focus:text-white cursor-pointer rounded-md text-blue-400 font-medium"
                onClick={() => router.push('/settings')}
              >
                <div className="flex items-center gap-3">
                  <Layout size={14} />
                  <span>Manage Portfolios</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
