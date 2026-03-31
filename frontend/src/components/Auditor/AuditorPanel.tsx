import { useState } from 'react'
import { Shield, Info } from 'lucide-react'
import { AddressDisplay } from '../UI/AddressDisplay'
import { useContracts } from '../../hooks/useContracts'
import { useWallet } from '../../hooks/useWallet'
import { CONTRACTS } from '../../config/contracts'

// MOCK DATA — replace with contract reads (AuditorAccessGranted event scan)
const MOCK_MEMBERS = [
  { address: CONTRACTS.treasury.address, accessGranted: true,  auditResult: null },
]

export function AuditorPanel() {
  const [members] = useState(MOCK_MEMBERS)
  const [loading, setLoading] = useState<string | null>(null)
  const { auditorAccess } = useContracts()
  const { isConnected } = useWallet()

  const handleRequestAudit = async (addr: string) => {
    if (!auditorAccess) return
    try {
      setLoading(addr)
      const tx = await auditorAccess.requestAudit(addr)
      await tx.wait()
      alert('Audit requested. Gateway will call revealAudit with plaintext balance.')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Audit request failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-5xl mb-2" style={{ color: 'var(--text-primary)' }}>
          COMPLIANCE AUDIT
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Selective disclosure via on-chain FHE ACL
        </p>
      </div>

      {/* Info box */}
      <div className="rounded-lg p-5 mb-8 flex gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)' }}>
        <Info size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--amber)' }} />
        <div>
          <p className="font-display font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            How Selective Disclosure Works
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The Admin grants the Auditor FHE ACL access to specific member balance handles.
            The Auditor calls <span className="font-mono" style={{ color: 'var(--amber)' }}>requestAudit()</span> to
            signal intent. The fhEVM gateway decrypts the handle and delivers the plaintext via
            <span className="font-mono" style={{ color: 'var(--amber)' }}> revealAudit()</span>.
            All other balances remain encrypted and inaccessible.
          </p>
        </div>
      </div>

      {/* Contracts */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'AUDITOR ACCESS CONTRACT', addr: CONTRACTS.auditorAccess.address },
          { label: 'TREASURY CONTRACT',       addr: CONTRACTS.treasury.address },
        ].map(({ label, addr }) => (
          <div key={addr} className="rounded-lg p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <AddressDisplay address={addr} />
          </div>
        ))}
      </div>

      {/* Member list */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
          MEMBER AUDIT STATUS
        </p>
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                {['ADDRESS', 'ACCESS GRANTED', 'LAST AUDIT RESULT', 'ACTION'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-mono tracking-widest"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.address} style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <td className="px-5 py-4"><AddressDisplay address={m.address} /></td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{
                        color: m.accessGranted ? 'var(--jade)' : 'var(--red)',
                        background: m.accessGranted ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                        border: `1px solid ${m.accessGranted ? 'var(--jade)' : 'var(--red)'}`,
                      }}>
                      {m.accessGranted ? 'GRANTED' : 'REVOKED'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {m.auditResult !== null ? (
                      <span className="font-mono text-sm" style={{ color: 'var(--amber)' }}>
                        {m.auditResult} ETH
                      </span>
                    ) : (
                      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        No audit yet
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {m.accessGranted && isConnected && (
                      <button
                        onClick={() => handleRequestAudit(m.address)}
                        disabled={loading === m.address}
                        className="px-3 py-1.5 rounded font-mono text-xs tracking-widest hover:opacity-80 disabled:opacity-40"
                        style={{ color: 'var(--amber)', border: '1px solid var(--amber)', background: 'transparent' }}
                      >
                        {loading === m.address ? 'REQUESTING…' : 'REQUEST AUDIT'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zama badge */}
      <div className="flex items-center gap-2 mt-8">
        <Shield size={14} style={{ color: 'var(--amber)' }} />
        <span className="text-xs font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>
          FHE ACL ENFORCED BY ZAMA PROTOCOL · SEPOLIA TESTNET
        </span>
      </div>
    </div>
  )
}
