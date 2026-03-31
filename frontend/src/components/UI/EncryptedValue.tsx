interface Props {
  value: string | null
  label?: string
  size?: 'sm' | 'lg'
}

export function EncryptedValue({ value, label, size = 'lg' }: Props) {
  const isLarge = size === 'lg'

  if (value === null) {
    return (
      <div>
        {label && (
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
        )}
        <p className={`encrypted-value ${isLarge ? 'text-3xl' : 'text-base'}`}>
          ████████████
        </p>
        <p className="text-xs font-mono mt-1" style={{ color: 'var(--amber)' }}>
          ENCRYPTED — REQUEST DECRYPT
        </p>
      </div>
    )
  }

  return (
    <div>
      {label && (
        <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      )}
      <p className={`font-mono font-bold ${isLarge ? 'text-3xl' : 'text-base'}`} style={{ color: 'var(--amber)' }}>
        {value}
      </p>
      <p className="text-xs font-mono mt-1" style={{ color: 'var(--jade)' }}>
        DECRYPTED ✓
      </p>
    </div>
  )
}
