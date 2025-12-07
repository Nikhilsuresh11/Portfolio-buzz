import Link from 'next/link'
import { Home, TrendingUp, Star, Newspaper, Settings, Search } from 'lucide-react'

interface SidebarProps {
    onSearchClick?: () => void
}

export default function Sidebar({ onSearchClick }: SidebarProps) {
    return (
        <aside style={sidebarStyle} aria-label="Main navigation">
            <nav style={navStyle}>
                <Link href="/" passHref legacyBehavior>
                    <a title="Home" style={iconStyle}>
                        <Home size={20} strokeWidth={2} />
                    </a>
                </Link>

                <button
                    onClick={onSearchClick}
                    title="Search Stocks"
                    style={{ ...iconStyle, border: 'none' }}
                >
                    <Search size={20} strokeWidth={2} />
                </button>

                <a href="#" title="Portfolio" style={iconStyle}>
                    <TrendingUp size={20} strokeWidth={2} />
                </a>
                <a href="#" title="Watchlist" style={iconStyle}>
                    <Star size={20} strokeWidth={2} />
                </a>
                <a href="#" title="News" style={iconStyle}>
                    <Newspaper size={20} strokeWidth={2} />
                </a>
                <Link href="/settings" passHref legacyBehavior>
                    <a title="Settings" style={iconStyle}>
                        <Settings size={20} strokeWidth={2} />
                    </a>
                </Link>
            </nav>
        </aside>
    )
}

const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: 72,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    background: '#000000',
    backdropFilter: 'blur(12px)',
    borderRight: '1px solid rgba(248, 250, 252, 0.08)',
    boxShadow: '2px 0 16px rgba(0, 0, 0, 0.3)',
    zIndex: 70,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}

const navStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
}

const iconStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    background: 'rgba(30, 41, 59, 0.4)',
    textDecoration: 'none',
    color: '#94a3b8',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
}
