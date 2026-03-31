import { useState, useEffect, useCallback, useRef } from 'react'
import { Users, UserPlus, Activity, RefreshCw, CheckCircle2 } from 'lucide-react'
import { CyberCard } from './CyberCard'
import { Button } from './button'
import { TerminalLog, type TerminalLogHandle } from './TerminalLog'
import { useContracts } from '../../hooks/useContracts'
import { cn } from '../../lib/utils'
import { EventLog } from 'ethers'

interface RosterMember {
  address: string
  role: string
  since: string
}

export const OperatorTerminal = () => {
  const { treasury, treasuryRead } = useContracts()
  const [roster, setRoster] = useState<RosterMember[]>([])
  const [requests, setRequests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [txLoading, setTxLoading] = useState<string | null>(null)
  const logRef = useRef<TerminalLogHandle>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Instantly load pending from local storage (off-chain queue)
      const saved = localStorage.getItem('shield_pending_enlistments')
      let pendingReqs: string[] = []
      if (saved) {
        pendingReqs = JSON.parse(saved)
        setRequests(pendingReqs) // Show immediately for snappy UX
      }

      // 2. Load on-chain members
      if (treasuryRead) {
        try {
          const filter = treasuryRead.filters.MemberAdded()
          const events = await treasuryRead.queryFilter(filter)
          
          const members = events
            .filter((e): e is EventLog => e instanceof EventLog)
            .map(e => ({
              address: e.args[0] as string,
              role: 'MEMBER',
              since: 'RECENT'
            }))
            
          setRoster(members)

          // 3. Filter out requests that are already approved members
          if (pendingReqs.length > 0) {
            const memberAddresses = members.map(m => m.address.toLowerCase())
            const activeRequests = pendingReqs.filter(r => !memberAddresses.includes(r.toLowerCase()))
            setRequests(activeRequests)
            
            // Clean up old requests from storage
            if (activeRequests.length !== pendingReqs.length) {
               localStorage.setItem('shield_pending_enlistments', JSON.stringify(activeRequests))
            }
          }
        } catch (contractErr) {
          console.warn("Failed to query on-chain members (RPC may be rate limited).", contractErr)
        }
      }
    } catch (e) {
      console.error("Failed to parse operator data:", e)
    } finally {
      setLoading(false)
    }
  }, [treasuryRead])

  useEffect(() => {
    loadData()
    // Listen for new requests from the same session
    const handleNew = () => loadData()
    window.addEventListener('shield_new_enlistment', handleNew)
    return () => window.removeEventListener('shield_new_enlistment', handleNew)
  }, [loadData])

  const approve = async (addr: string) => {
    if (!treasury) return
    try {
      setTxLoading(addr)
      logRef.current?.addLog(`Authorizing enrollment for ${addr.slice(0, 8)}...`, 'info')
      
      const tx = await treasury.addMember(addr)
      logRef.current?.addLog(`Membership tx broadcasted. Awaiting Sepolia confirmation...`, 'pending')
      
      await tx.wait()
      logRef.current?.addLog(`Member ${addr.slice(0, 6)} successfully onboarded to ShieldDAO.`, 'success')
      
      // Clean up local storage
      const saved = localStorage.getItem('shield_pending_enlistments')
      if (saved) {
        const reqs = JSON.parse(saved)
        localStorage.setItem('shield_pending_enlistments', JSON.stringify(reqs.filter((r: string) => r.toLowerCase() !== addr.toLowerCase())))
      }
      
      loadData()
    } catch (e) {
      console.error("Admission failed:", e)
      logRef.current?.addLog(`Authorization failed. Check network status.`, 'error')
    } finally {
      setTxLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
      {/* Pending Requests */}
      <CyberCard variant="amber">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber/10 rounded-lg">
              <UserPlus size={20} className="text-amber" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-lg text-text-primary">ADMISSION QUEUE</h3>
              <p className="text-[10px] font-mono text-text-muted">PENDING AUTHORIZATION</p>
            </div>
          </div>
          <button onClick={loadData} disabled={loading} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted">
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        <div className="space-y-3 min-h-[200px]">
          {requests.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-black/20">
              <Activity size={24} className="text-text-muted/20 mb-3" />
              <p className="text-[11px] font-mono text-text-muted">NO PENDING REQUESTS</p>
            </div>
          ) : (
            requests.map((addr) => (
              <div key={addr} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber/30 transition-all group">
                <div className="space-y-1">
                  <p className="text-sm font-mono text-text-primary">{addr.slice(0, 8)}...{addr.slice(-6)}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber/10 text-amber border border-amber/20 rounded uppercase font-mono">GUEST</span>
                  </div>
                </div>
                <Button 
                  onClick={() => approve(addr)} 
                  disabled={!!txLoading}
                  className="bg-amber text-bg-primary hover:bg-amber/90 px-6 font-bold shadow-[0_0_20px_rgba(245,166,35,0.2)]"
                >
                  {txLoading === addr ? "SIGNING..." : "ADMIT"}
                </Button>
              </div>
            ))
          )}
        </div>
      </CyberCard>

      {/* Roster / Success Log */}
      <div className="space-y-6">
        <CyberCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-jade/10 rounded-lg">
              <Users size={20} className="text-jade" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-lg text-text-primary">ACTIVE ROSTER</h3>
              <p className="text-[10px] font-mono text-text-muted">{roster.length} MEMBERS VALIDATED</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {roster.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-transparent hover:border-jade/20 transition-all">
                <span className="text-[12px] font-mono text-text-muted">{m.address.slice(0, 10)}...</span>
                <CheckCircle2 size={14} className="text-jade" />
              </div>
            ))}
          </div>
        </CyberCard>
        
        <TerminalLog ref={logRef} className="max-h-[160px]" />
      </div>
    </div>
  )
}
