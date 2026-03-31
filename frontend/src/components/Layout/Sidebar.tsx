import { LayoutDashboard, Vault, Vote, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/' },
  { icon: Vault,           label: 'Treasury',   path: '/treasury' },
  { icon: Vote,            label: 'Governance', path: '/governance' },
  { icon: Shield,          label: 'Auditor',    path: '/auditor' },
]

export default function Sidebar({ currentPath, onNavigate }: {
  currentPath: string
  onNavigate: (path: string) => void
}) {
  const [blockNumber, setBlockNumber] = useState<number>(0)

  useEffect(() => {
    setBlockNumber(10539615 + Math.floor(Math.random() * 100))
    const interval = setInterval(() => setBlockNumber(n => n + 1), 12000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: '#111318',
      borderRight: '1px solid #1E2330',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <img src="/logo.png" alt="ShieldDAO" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '18px',
            color: '#E8EAF0',
            letterSpacing: '-0.02em',
          }}>ShieldDAO</span>
        </div>
        <div style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '9px',
          color: '#F5A623',
          letterSpacing: '0.15em',
          opacity: 0.8,
        }}>CONFIDENTIAL GOVERNANCE</div>
      </div>

      <div style={{ height: '1px', background: '#1E2330', margin: '0 16px 16px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = currentPath === path
          return (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 12px',
                marginBottom: '4px',
                background: active ? 'rgba(245,166,35,0.08)' : 'transparent',
                border: 'none',
                borderLeft: active ? '3px solid #F5A623' : '3px solid transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                color: active ? '#F5A623' : '#6B7A99',
                fontFamily: 'Syne, sans-serif',
                fontWeight: active ? 600 : 400,
                fontSize: '14px',
                letterSpacing: '0.01em',
                textAlign: 'left',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.color = '#E8EAF0'
                  e.currentTarget.style.background = '#1C2028'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.color = '#6B7A99'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #1E2330' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '7px', height: '7px',
            borderRadius: '50%',
            background: '#2ECC71',
            boxShadow: '0 0 6px rgba(46,204,113,0.6)',
          }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#2ECC71' }}>
            Sepolia
          </span>
        </div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3D4A63' }}>
          Block #{blockNumber.toLocaleString()}
        </div>
      </div>
    </aside>
  )
}
