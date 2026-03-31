import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function AddressDisplay({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`

  const copy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 font-mono text-sm transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      title={address}
    >
      {short}
      {copied
        ? <Check size={12} style={{ color: 'var(--jade)' }} />
        : <Copy size={12} />}
    </button>
  )
}
