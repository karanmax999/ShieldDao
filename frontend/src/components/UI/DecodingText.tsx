import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface DecodingTextProps {
  text: string
  className?: string
  interval?: number
  duration?: number
  startOnViewport?: boolean
  chars?: string
}

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%@#$&*'

export const DecodingText = ({
  text,
  className,
  interval = 50,
  duration = 1000,
  startOnViewport = true,
  chars = DEFAULT_CHARS,
}: DecodingTextProps) => {
  const [displayText, setDisplayText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const startAnimation = () => {
    if (isAnimating) return
    setIsAnimating(true)
    startTimeRef.current = Date.now()

    const step = () => {
      const now = Date.now()
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      const result = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' '
          const charProgress = index / text.length
          if (progress > charProgress + 0.2 || progress === 1) {
            return char
          }
          return chars[Math.floor(Math.random() * chars.length)]
        })
        .join('')

      setDisplayText(result)

      if (progress < 1) {
        timerRef.current = setTimeout(step, interval)
      } else {
        setIsAnimating(false)
      }
    }

    step()
  }

  useEffect(() => {
    if (!startOnViewport) {
      startAnimation()
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [text])

  return (
    <motion.span
      onViewportEnter={() => startOnViewport && startAnimation()}
      className={cn('font-mono', className)}
    >
      {displayText || text.replace(/[^\s]/g, '█')}
    </motion.span>
  )
}
