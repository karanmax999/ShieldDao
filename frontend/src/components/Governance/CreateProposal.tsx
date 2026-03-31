import { useState } from 'react'
import { X } from 'lucide-react'
import { useContracts } from '../../hooks/useContracts'
import { useWallet } from '../../hooks/useWallet'

interface Props { onClose: () => void }

export function CreateProposal({ onClose }: Props) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { governance } = useContracts()
  const { isConnected } = useWallet()

  const handleSubmit = async () => {
    if (!governance || !description) return
    try {
      setLoading(true); setError(null)
      const tx = await governance.propose(description, '0x0000000000000000000000000000000000000000', '0x', 0)
      setTxHash(tx.hash)
      await tx.wait()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create proposal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10,11,13,0.85)' }}>
      <div className="w-full max-w-lg rounded-lg p-6 relative"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)' }}>
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>

        <h2 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
          CREATE PROPOSAL
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Voting window: 100 blocks · Quorum: 1 yes vote
        </p>

        <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Fund dev grant for Q1 2025…"
          className="w-full px-4 py-3 rounded font-mono text-sm mb-5 outline-none resize-none"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-active)',
            color: 'var(--text-primary)',
          }}
        />

        {error && <p className="text-xs font-mono mb-3" style={{ color: 'var(--red)' }}>{error}</p>}
        {txHash && <p className="text-xs font-mono mb-3" style={{ color: 'var(--jade)' }}>Tx: {txHash.slice(0,18)}…</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded font-mono text-sm tracking-widest hover:opacity-70"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isConnected || loading || !description}
            className="flex-1 py-3 rounded font-mono text-sm tracking-widest font-bold hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--amber)', color: '#0A0B0D' }}
          >
            {loading ? 'SUBMITTING…' : 'CREATE'}
          </button>
        </div>
      </div>
    </div>
  )
}
