import { useState } from 'react'
import { parseEther } from 'ethers'
import { Lock, X } from 'lucide-react'
import { useContracts } from '../../hooks/useContracts'
import { useWallet } from '../../hooks/useWallet'

interface Props { onClose: () => void; walletBalance: string }

export function DepositModal({ onClose, walletBalance }: Props) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { treasury } = useContracts()
  const { isConnected } = useWallet()

  const handleDeposit = async () => {
    if (!treasury || !amount) return
    try {
      setLoading(true); setError(null)
      const tx = await treasury.deposit({ value: parseEther(amount) })
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
          DEPOSIT TO VAULT
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Your balance is encrypted on-chain. Only you can decrypt it.
        </p>

        <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          ETH Amount
        </label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.01"
          className="w-full px-4 py-3 rounded font-mono text-lg mb-1 outline-none"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-active)',
            color: 'var(--text-primary)',
          }}
        />
        <p className="text-xs font-mono mb-5" style={{ color: 'var(--text-muted)' }}>
          MAX: {walletBalance} ETH
        </p>

        {/* Privacy notice */}
        <div className="rounded p-4 mb-5 flex gap-3"
          style={{ background: 'var(--amber-glow)', border: '1px solid var(--amber-dim)' }}>
          <Lock size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--amber)' }} />
          <p className="text-xs font-mono leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            This amount will be encrypted using Zama FHE before storing on-chain.
            Nobody — including the contract owner — can see your balance.
          </p>
        </div>

        {error && <p className="text-xs font-mono mb-3" style={{ color: 'var(--red)' }}>{error}</p>}
        {txHash && (
          <p className="text-xs font-mono mb-3" style={{ color: 'var(--jade)' }}>
            Tx submitted: {txHash.slice(0, 18)}…
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded font-mono text-sm tracking-widest transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            CANCEL
          </button>
          <button
            onClick={handleDeposit}
            disabled={!isConnected || loading || !amount}
            className="flex-1 py-3 rounded font-mono text-sm tracking-widest transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: 'var(--amber)', color: '#0A0B0D', fontWeight: 700 }}
          >
            {loading ? 'DEPOSITING…' : 'DEPOSIT'}
          </button>
        </div>
      </div>
    </div>
  )
}
