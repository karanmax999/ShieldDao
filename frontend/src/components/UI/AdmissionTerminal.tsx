import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, ChevronRight, Zap, Loader2 } from 'lucide-react'
import { CyberCard } from './CyberCard'
import { Button } from './button'
import { TerminalLog, type TerminalLogHandle } from './TerminalLog'

interface AdmissionTerminalProps {
  address?: string | null
  onEnlist: () => void
}

export const AdmissionTerminal = ({ address, onEnlist }: AdmissionTerminalProps) => {
  const [status, setStatus] = useState<'unauthorized' | 'pending' | 'done'>('unauthorized')
  const logRef = useRef<TerminalLogHandle>(null)

  const handleEnlist = async () => {
    if (!address) return
    setStatus('pending')
    
    logRef.current?.addLog(`Initializing guest enrollment for ${address.slice(0, 8)}...`, 'info')
    
    setTimeout(() => {
      logRef.current?.addLog("Generating non-interactive zero-knowledge proof...", "pending")
    }, 800)

    setTimeout(() => {
      logRef.current?.addLog("Identity proof generated. Encrypting metadata...", "pending")
    }, 1800)

    setTimeout(() => {
      try {
        const saved = localStorage.getItem('shield_pending_enlistments')
        const reqs = saved ? JSON.parse(saved) : []
        if (!reqs.includes(address)) {
          reqs.push(address)
          localStorage.setItem('shield_pending_enlistments', JSON.stringify(reqs))
        }
        window.dispatchEvent(new CustomEvent('shield_new_enlistment'))
        
        logRef.current?.addLog("Broadcast successful. Awaiting Operator authorization.", "success")
        setStatus('done')
        onEnlist()
      } catch (e) {}
    }, 3500)
  }

  return (
    <CyberCard variant={status === 'unauthorized' ? 'amber' : 'jade'} className="relative overflow-hidden group">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#F5A623_1px,transparent_1px)] [background-size:20px_20px]" />
      
      <div className="relative z-10 flex flex-col items-center text-center py-12 px-6">
        <div className="mb-8 relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-amber/20 blur-3xl rounded-full"
          />
          <div className="relative p-5 rounded-2xl bg-bg-card border border-amber/20 shadow-[0_0_30px_rgba(245,166,35,0.1)]">
            {status === 'unauthorized' ? (
              <Shield size={40} className="text-amber" />
            ) : (
              <Zap size={40} className="text-jade animate-pulse" />
            )}
          </div>
        </div>

        <h2 className="font-display font-black text-3xl text-text-primary mb-3 tracking-tighter uppercase">
          {status === 'unauthorized' ? 'Identity Unverified' : 'Admission Pending'}
        </h2>
        
        <p className="font-mono text-xs text-text-muted max-w-sm mb-10 uppercase tracking-widest leading-loose">
          {status === 'unauthorized' 
            ? "Your terminal signature was not found in the sovereign registry. Gated FHE modules are currently inaccessible."
            : "Your enlistment request has been broadcast to the DAO validators. Awaiting homomorphic verification."
          }
        </p>

        <div className="w-full max-w-sm space-y-4">
          <AnimatePresence mode="wait">
            {status === 'unauthorized' ? (
              <motion.div
                key="unauthorized"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Button 
                  onClick={handleEnlist}
                  className="w-full py-8 rounded-2xl bg-amber hover:bg-amber-dim text-bg-primary font-black text-sm tracking-[0.2em] shadow-[0_0_20px_rgba(245,166,35,0.2)] flex items-center justify-center gap-3 group/btn"
                >
                  REPORT FOR DUTY
                  <ChevronRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="pending"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-jade/5 border border-jade/20 flex flex-col items-center gap-4"
              >
                <div className="flex items-center gap-3 text-jade font-mono text-[10px] tracking-[0.2em]">
                  <Loader2 size={14} className="animate-spin" />
                  REQUEST BROADCASTED
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-jade to-transparent"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8">
            <TerminalLog ref={logRef} className="bg-black/60 min-h-[160px]" />
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
             <div className="flex items-center gap-2 text-[9px] font-mono text-text-muted uppercase">
               <AlertTriangle size={10} className="text-amber" />
               Threshold FHE Active
             </div>
             <div className="w-1 h-1 rounded-full bg-white/10" />
             <div className="flex items-center gap-2 text-[9px] font-mono text-text-muted uppercase">
               Registry Scan: {status === 'unauthorized' ? 'Failed' : 'Queued'}
             </div>
          </div>
        </div>
      </div>
    </CyberCard>
  )
}
