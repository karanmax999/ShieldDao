import { useState } from 'react'
import { parseEther } from 'ethers'
import { X } from 'lucide-react'
import { useContracts } from '../../hooks/useContracts'
import { useWallet } from '../../hooks/useWallet'

interface Props { onClose: () => void }

export function WithdrawModal({ onClose }: Props) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { treasury } = useContracts()
  const { isConnected } = useWallet()

  const handleWithdraw = async () => {
    if (!treasury || !amount) return
    try {
      setLoading(true); setError(null)
      const tx = await treasury.withdraw(parseEther(amount))
      setTxHash(tx.hash)
      await tx.wait()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
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
          WITHDRAW FROM VAULT
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Overflow-safe: if amount exceeds balance, effective withdrawal is zero.
        </p>

        <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          ETH Amount
        </label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.005"
          className="w-full px-4 py-3 rounded font-mono text-lg mb-5 outline-none"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-active)',
            color: 'var(--text-primary)',
          }}
        />

        {error && <p className="text-xs font-mono mb-3" style={{ color: 'var(--red)' }}>{error}</p>}
        {txHash && (
          <p className="text-xs font-mono mb-3" style={{ color: 'var(--jade)' }}>
            Tx submitted: {txHash.slice(0, 18)}…
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded font-mono text-sm tracking-widest hover:opacity-70"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            CANCEL
          </button>
          <button
            onClick={handleWithdraw}
            disabled={!isConnected || loading || !amount}
            className="flex-1 py-3 rounded font-mono text-sm tracking-widest hover:opacity-80 disabled:opacity-40"
            style={{ color: 'var(--amber)', border: '1px solid var(--amber)', background: 'transparent', fontWeight: 700 }}
          >
            {loading ? 'WITHDRAWING…' : 'WITHDRAW'}
          </button>
        </div>
      </div>
    </div>
  )
}
