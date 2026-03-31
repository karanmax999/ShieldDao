import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface LogEntry {
  id: string
  text: string
  type: 'info' | 'success' | 'error' | 'pending'
  timestamp: Date
}

export interface TerminalLogHandle {
  addLog: (text: string, type?: LogEntry['type']) => void
  clear: () => void
}

export const TerminalLog = forwardRef<TerminalLogHandle, { className?: string }>((props, ref) => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [
      ...prev,
      { id: Math.random().toString(36).slice(2), text, type, timestamp: new Date() }
    ].slice(-50)) // Keep last 50 logs
  }

  const clear = () => setLogs([])

  useImperativeHandle(ref, () => ({ addLog, clear }))

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className={cn("bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md flex flex-col font-mono text-[10px]", props.className)}>
      <div className="bg-white/5 px-4 py-2 border-bottom border-white/5 flex items-center gap-2">
        <Terminal size={12} className="text-text-muted" />
        <span className="text-text-muted uppercase tracking-widest font-bold">Secure Terminal Log</span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar min-h-[120px] max-h-[200px]">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <div className="text-text-muted opacity-30 italic">Awaiting connection...</div>
          ) : (
            logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3"
              >
                <div className="mt-1">
                  {log.type === 'pending' && <Loader2 size={10} className="text-amber animate-spin" />}
                  {log.type === 'info' && <Shield size={10} className="text-sky-500" />}
                  {log.type === 'success' && <CheckCircle2 size={10} className="text-jade" />}
                  {log.type === 'error' && <AlertCircle size={10} className="text-red-500" />}
                </div>
                <div className="flex-1">
                  <span className="text-white/20 mr-2 whitespace-nowrap">
                    [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  <span className={cn(
                    log.type === 'info' && "text-text-secondary",
                    log.type === 'success' && "text-jade font-bold",
                    log.type === 'error' && "text-red-400",
                    log.type === 'pending' && "text-amber"
                  )}>
                    {log.text}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})

TerminalLog.displayName = 'TerminalLog'
