import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function RelatedNews({ isModal = false }: { isModal?: boolean }) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const newsItems = [
    {
      id: 1,
      title: 'Nokia Signs 5G Patent Deal',
      source: 'MarketWatch',
      tag: 'AAP',
      time: '2h',
      summary: 'Nokia announced a multi-year patent license agreement with Vivo.',
      fullContent: 'Nokia Corporation announced today a comprehensive multi-year patent license agreement with Vivo, one of China\'s leading smartphone manufacturers. The deal covers Nokia\'s extensive portfolio of 5G technology patents.'
    },
    {
      id: 2,
      title: 'US-Iran Escalation',
      source: 'Bloomberg',
      tag: 'AAP',
      time: '4h',
      summary: 'Markets react to geopolitical tensions and Fed policy.',
      fullContent: 'Global markets experienced heightened volatility today as investors digested escalating tensions between the United States and Iran, coupled with the Federal Reserve\'s latest policy statements.'
    },
    {
      id: 3,
      title: 'Jobs Growth Strong',
      source: 'CNBC',
      tag: 'AAP',
      time: '5h',
      summary: 'Employment data shows stronger than expected growth.',
      fullContent: 'The latest employment report revealed robust job growth that exceeded economist expectations, adding 250,000 new positions last month.'
    }
  ]

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const finalContainerStyle: React.CSSProperties = isModal ? {
    ...containerStyle,
    position: 'relative',
    right: 'auto',
    top: 'auto',
    width: '100%',
    maxHeight: 'none',
    background: 'transparent',
    border: 'none',
    padding: 0,
  } : containerStyle

  return (
    <div style={finalContainerStyle}>
      <h3 style={headerStyle}>Related News</h3>
      <div style={newsListStyle}>
        {newsItems.map((item) => (
          <div key={item.id} style={cardStyle} onClick={() => toggleExpand(item.id)}>
            <div style={cardHeaderStyle}>
              <span style={tagStyle}>{item.tag}</span>
              <span style={timeStyle}>{item.time}</span>
            </div>

            <h4 style={titleStyle}>{item.title}</h4>
            <p style={sourceStyle}>{item.source}</p>

            <p style={textStyle}>
              {expandedId === item.id ? item.fullContent : item.summary}
            </p>

            <div style={expandButtonStyle}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>
                {expandedId === item.id ? 'Less' : 'More'}
              </span>
              <ChevronDown
                size={14}
                style={{
                  transform: expandedId === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: '#3b82f6'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  right: 7,
  top: 24,
  width: 320,
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  background: '#1a1f2e',
  borderRadius: 16,
  border: '1px solid rgba(248, 250, 252, 0.08)',
  padding: 20,
}

const headerStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 16,
  fontSize: 16,
  fontWeight: 700,
  color: '#f8fafc',
  letterSpacing: '-0.01em',
}

const newsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(51, 65, 85, 0.3)',
  border: '1px solid rgba(248, 250, 252, 0.06)',
  borderRadius: 10,
  padding: 14,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
}

const tagStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: '#3b82f6',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: 'rgba(59, 130, 246, 0.1)',
  padding: '3px 6px',
  borderRadius: 4,
}

const timeStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  fontWeight: 500,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 4,
  fontSize: 13,
  fontWeight: 600,
  color: '#f8fafc',
  lineHeight: 1.3,
}

const sourceStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 8,
  fontSize: 11,
  color: '#94a3b8',
  fontWeight: 500,
}

const textStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 8,
  fontSize: 12,
  color: '#cbd5e1',
  lineHeight: 1.5,
}

const expandButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  justifyContent: 'flex-end',
}
