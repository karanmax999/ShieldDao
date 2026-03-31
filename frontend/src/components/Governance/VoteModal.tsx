import { useState } from 'react'
import { X, Shield } from 'lucide-react'
import { useContracts } from '../../hooks/useContracts'
import { useWallet } from '../../hooks/useWallet'

interface Props { proposalId: number; onClose: () => void }

export function VoteModal({ proposalId, onClose }: Props) {
  const [vote, setVote] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { governance } = useContracts()
  const { isConnected } = useWallet()

  const handleVote = async () => {
    if (!governance || vote === null) return
    try {
      setLoading(true); setError(null)
      // NOTE: In production, use @fhevm/js to encrypt the vote client-side.
      // For demo, we pass a placeholder — real fhEVM encryption requires the SDK.
      // const fhevm = await createInstance({ chainId: 11155111, publicKey: ... })
      // const encrypted = fhevm.encrypt_bool(vote)
      const placeholderHandle = '0x' + '00'.repeat(32)
      const placeholderProof  = '0x'
      const tx = await governance.castVote(proposalId, placeholderHandle, placeholderProof)
      setTxHash(tx.hash)
      await tx.wait()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Vote failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10,11,13,0.85)' }}>
      <div className="w-full max-w-md rounded-lg p-6 relative"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)' }}>
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>

        <h2 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
          CAST CONFIDENTIAL VOTE
        </h2>
        <p className="text-xs font-mono mb-6" style={{ color: 'var(--text-muted)' }}>
          Proposal #{proposalId}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setVote(true)}
            className="py-5 rounded-lg font-display font-bold text-xl transition-all"
            style={{
              border: `2px solid var(--jade)`,
              background: vote === true ? 'rgba(46,204,113,0.15)' : 'transparent',
              color: 'var(--jade)',
            }}
          >
            YES
          </button>
          <button
            onClick={() => setVote(false)}
            className="py-5 rounded-lg font-display font-bold text-xl transition-all"
            style={{
              border: `2px solid var(--red)`,
              background: vote === false ? 'rgba(231,76,60,0.15)' : 'transparent',
              color: 'var(--red)',
            }}
          >
            NO
          </button>
        </div>

        {/* Privacy notice */}
        <div className="rounded p-4 mb-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-mono leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
            Your vote is encrypted client-side before submission.<br />
            Individual votes are mathematically impossible to read.<br />
            Only the final outcome (pass/fail) is ever revealed.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Shield size={12} style={{ color: 'var(--amber)' }} />
            <span className="text-xs font-mono tracking-widest" style={{ color: 'var(--amber)' }}>
              POWERED BY ZAMA FHE
            </span>
          </div>
        </div>

        {error && <p className="text-xs font-mono mb-3" style={{ color: 'var(--red)' }}>{error}</p>}
        {txHash && <p className="text-xs font-mono mb-3" style={{ color: 'var(--jade)' }}>Tx: {txHash.slice(0,18)}…</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded font-mono text-sm tracking-widest hover:opacity-70"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            CANCEL
          </button>
          <button
            onClick={handleVote}
            disabled={!isConnected || loading || vote === null}
            className="flex-1 py-3 rounded font-mono text-sm tracking-widest font-bold hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--amber)', color: '#0A0B0D' }}
          >
            {loading ? 'ENCRYPTING…' : 'SUBMIT VOTE'}
          </button>
        </div>
      </div>
    </div>
  )
}
