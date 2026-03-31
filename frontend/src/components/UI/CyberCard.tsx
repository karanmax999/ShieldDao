import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface CyberCardProps {
  children: React.ReactNode
  variant?: 'default' | 'amber' | 'jade' | 'red'
  glow?: boolean
  accent?: boolean
  className?: string
}

export const CyberCard = ({
  children,
  className,
  variant = 'default',
  glow = true,
  accent = true,
}: CyberCardProps) => {
  const variantStyles = {
    default: 'border-border hover:border-border-active',
    amber: 'border-amber/20 hover:border-amber/40',
    jade: 'border-jade/20 hover:border-jade/40',
    red: 'border-red/20 hover:border-red/40',
  }

  const glowStyles = {
    default: 'hover:shadow-[0_0_20px_rgba(30,35,48,0.3)]',
    amber: 'hover:shadow-[0_0_20px_rgba(245,166,35,0.1)]',
    jade: 'hover:shadow-[0_0_20px_rgba(46,204,113,0.1)]',
    red: 'hover:shadow-[0_0_20px_rgba(231,76,60,0.1)]',
  }

  const accentColors = {
    default: 'bg-border-active',
    amber: 'bg-amber',
    jade: 'bg-jade',
    red: 'bg-red',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative rounded-2xl border bg-bg-card/40 backdrop-blur-md p-6 transition-all duration-300 overflow-hidden group',
        variantStyles[variant],
        glow && glowStyles[variant],
        className
      )}
    >
      {/* Holographic Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-white via-transparent to-white" />
      
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

      {/* Corner Accents */}
      {accent && (
        <>
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className={cn('absolute top-0 left-0 w-12 h-[2px]', accentColors[variant], "shadow-[0_0_10px_currentColor]")} 
          />
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className={cn('absolute top-0 left-0 w-[2px] h-12', accentColors[variant], "shadow-[0_0_10px_currentColor]")} 
          />
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className={cn('absolute bottom-0 right-0 w-12 h-[2px]', accentColors[variant], "shadow-[0_0_10px_currentColor]")} 
          />
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className={cn('absolute bottom-0 right-0 w-[2px] h-12', accentColors[variant], "shadow-[0_0_10px_currentColor]")} 
          />
        </>
      )}

      {/* Scanning Line Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent absolute top-0 animate-scan-v" />
      </div>

      {/* Noise Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
