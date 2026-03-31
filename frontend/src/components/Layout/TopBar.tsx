import { Wallet, AlertTriangle } from 'lucide-react'
import { useWallet } from '../../hooks/useWallet'

export default function TopBar() {
  const { address, isConnected, isWrongNetwork, connect, switchToSepolia, error } = useWallet()

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div style={{
      height: '60px',
      borderBottom: '1px solid #1E2330',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      background: '#0A0B0D',
      flexShrink: 0,
    }}>
      <div style={{
        fontFamily: 'Space Mono, monospace',
        fontSize: '11px',
        color: '#3D4A63',
        letterSpacing: '0.08em',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <img src="/logo.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain', opacity: 0.5 }} />
        SHIELDDAO / CONFIDENTIAL GOVERNANCE
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {error && (
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#E74C3C' }}>
            {error.slice(0, 60)}
          </span>
        )}

        {isWrongNetwork && (
          <button
            onClick={switchToSepolia}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px',
              background: 'rgba(231,76,60,0.1)',
              border: '1px solid rgba(231,76,60,0.4)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              color: '#E74C3C',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.1)' }}
          >
            <AlertTriangle size={12} />
            SWITCH TO SEPOLIA
          </button>
        )}

        {isConnected && address ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px',
            background: 'rgba(46,204,113,0.08)',
            border: '1px solid rgba(46,204,113,0.2)',
            borderRadius: '8px',
          }}>
            <div style={{
              width: '7px', height: '7px',
              borderRadius: '50%',
              background: '#2ECC71',
              boxShadow: '0 0 6px rgba(46,204,113,0.8)',
            }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#2ECC71' }}>
              {shortAddr(address)}
            </span>
          </div>
        ) : (
          <button
            onClick={connect}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 20px',
              background: 'transparent',
              border: '1px solid #F5A623',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '12px',
              color: '#F5A623',
              letterSpacing: '0.05em',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Wallet size={14} />
            CONNECT WALLET
          </button>
        )}
      </div>
    </div>
  )
}
