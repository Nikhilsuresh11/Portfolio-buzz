import Link from 'next/link'
import { Home, TrendingUp, Star, Newspaper, Settings } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside style={sidebarStyle} aria-label="Main navigation">
      <nav style={navStyle}>
        <Link href="/" passHref legacyBehavior>
          <a title="Home" style={iconStyle}>
            <Home size={20} strokeWidth={2} />
          </a>
        </Link>
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
  width: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  alignItems: 'center',
  paddingTop: 28,
  paddingBottom: 20,
  paddingLeft: 16,
  paddingRight: 16,
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
  gap: 14,
  marginTop: 20,
}

const iconStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,
  background: 'rgba(30, 41, 59, 0.6)',
  textDecoration: 'none',
  color: '#f8fafc',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
}
