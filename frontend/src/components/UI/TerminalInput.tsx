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
          'relative flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-primary/60 border border-border transition-all duration-300 group focus-within:shadow-[0_0_30px_rgba(255,255,255,0.02)]',
          variantFocus[variant],
          className
        )}
      >
        {/* Holographic Overlay */}
        <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-focus-within:opacity-10 transition-opacity bg-gradient-to-br from-white via-transparent to-white" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity animate-pulse" />
        
        <span className={cn('font-mono text-sm select-none z-10', prefixColor[variant])}>
          {prefix}
        </span>
        <input
          {...props}
          className="flex-1 bg-transparent border-none outline-none text-text-primary font-mono text-sm placeholder:text-text-muted/50 z-10"
        />
        {/* Bouncing Cursor Effect */}
        <div className="w-[8px] h-[14px] bg-jade/40 animate-pulse group-focus-within:block hidden" />
      </div>
    </div>
  )
}
