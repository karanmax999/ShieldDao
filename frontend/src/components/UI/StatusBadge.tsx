type Status = 'Active' | 'Passed' | 'Failed' | 'PendingDecryption'

const CONFIG: Record<Status, { label: string; color: string; bg: string; pulse?: boolean }> = {
  Active:            { label: 'ACTIVE',           color: 'var(--amber)', bg: 'var(--amber-glow)', pulse: true },
  PendingDecryption: { label: 'DECRYPTING',        color: 'var(--amber)', bg: 'var(--amber-glow)', pulse: true },
  Passed:            { label: 'PASSED',            color: 'var(--jade)',  bg: 'rgba(46,204,113,0.1)' },
  Failed:            { label: 'FAILED',            color: 'var(--red)',   bg: 'rgba(231,76,60,0.1)' },
}

export function StatusBadge({ status }: { status: Status }) {
  const c = CONFIG[status]
  return (
    <span
      className="text-xs font-mono px-2 py-0.5 rounded tracking-widest"
      style={{
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.color}`,
        animation: c.pulse ? 'pulse-amber 2s ease-in-out infinite' : undefined,
      }}
    >
      {c.label}
    </span>
  )
}
