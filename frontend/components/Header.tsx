export default function Header({ user }: { user?: string | null }) {
  return (
    <header style={headerContainerStyle}>
      <div style={leftSectionStyle}>
        <div>
          <h1 style={titleStyle}>Portfolio Buzz</h1>
          <p style={subtitleStyle}>Real-time market intelligence</p>
        </div>
      </div>

      <div style={rightSectionStyle}>
        <div style={userBadgeStyle}>
          <div style={avatarStyle}>
            {user ? user[0].toUpperCase() : 'U'}
          </div>
          <span style={userNameStyle}>{user || 'Guest'}</span>
        </div>
      </div>
    </header>
  )
}

const headerContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px 32px',
  background: '#1a1f2e',
  borderRadius: 16,
  border: '1px solid rgba(248, 250, 252, 0.08)',
  marginBottom: 24,
  backdropFilter: 'blur(10px)',
}

const leftSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
  color: '#f8fafc',
  letterSpacing: '-0.03em',
  lineHeight: 1.2,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  marginTop: 4,
  fontSize: 14,
  color: '#64748b',
  fontWeight: 500,
}

const rightSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
}

const userBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 16px',
  background: 'rgba(30, 41, 59, 0.6)',
  borderRadius: 10,
  border: '1px solid rgba(248, 250, 252, 0.08)',
}

const avatarStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.02em',
}

const userNameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#e2e8f0',
}
