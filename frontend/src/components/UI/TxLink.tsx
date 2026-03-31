import { ExternalLink } from 'lucide-react'

export function TxLink({ hash, label = 'View tx' }: { hash: string; label?: string }) {
  return (
    <a
      href={`https://sepolia.etherscan.io/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs font-mono transition-colors hover:opacity-80"
      style={{ color: 'var(--amber)' }}
    >
      {label} <ExternalLink size={10} />
    </a>
  )
}
