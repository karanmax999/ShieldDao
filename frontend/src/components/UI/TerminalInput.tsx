import React from 'react'
import { cn } from '../../lib/utils'

interface TerminalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  prefix?: string
  variant?: 'default' | 'amber' | 'jade' | 'red'
}

export const TerminalInput = ({
  label,
  prefix = '>',
  variant = 'default',
  className,
  ...props
}: TerminalInputProps) => {
  const variantFocus = {
    default: 'focus-within:border-border-active focus-within:ring-border-active/20',
    amber: 'focus-within:border-amber/50 focus-within:ring-amber/30',
    jade: 'focus-within:border-jade/50 focus-within:ring-jade/30',
    red: 'focus-within:border-red/50 focus-within:ring-red/30',
  }

  const prefixColor = {
    default: 'text-text-muted',
    amber: 'text-amber',
    jade: 'text-jade',
    red: 'text-red',
  }

  return (
    <div className="w-full">
      {label && (
        <label className="font-mono text-[10px] text-text-muted mb-2 block uppercase tracking-widest leading-none">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-primary/60 border border-border transition-all duration-200',
          variantFocus[variant],
          className
        )}
      >
        <span className={cn('font-mono text-sm select-none', prefixColor[variant])}>
          {prefix}
        </span>
        <input
          {...props}
          className="flex-1 bg-transparent border-none outline-none text-text-primary font-mono text-sm placeholder:text-text-muted/50"
        />
      </div>
    </div>
  )
}
