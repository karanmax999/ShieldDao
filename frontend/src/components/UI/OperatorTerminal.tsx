import { useState, useEffect, useCallback } from 'react'
import { Users, UserPlus, Activity, RefreshCw, CheckCircle2 } from 'lucide-react'
import { CyberCard } from './CyberCard'
import { Button } from './button'
import { useContracts } from '../../hooks/useContracts'
import { cn } from '../../lib/utils'

interface RosterMember {
  address: string
  since: string
}

export const OperatorTerminal = () => {
  const { treasuryRead, treasury } = useContracts()
  const [roster, setRoster] = useState<RosterMember[]>([])
  const [requests, setRequests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [txLoading, setTxLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!treasuryRead) return
    setLoading(true)
    try {
      // Load active members from events
      const filter = treasuryRead.filters.MemberAdded()
      const events = await treasuryRead.queryFilter(filter)
      const members = await Promise.all(events.map(async (e: any) => {
        const block = await e.getBlock()
        return {
          address: e.args.member,
          since: new Date(block.timestamp * 1000).toLocaleDateString()
        }
      }))
      setRoster(members.reverse())

      // Load simulated requests from localStorage
      const saved = localStorage.getItem('shield_pending_enlistments')
      if (saved) {
        const reqs = JSON.parse(saved) as string[]
        // Filter out those who are already members
        const filtered = reqs.filter(addr => !members.some(m => m.address.toLowerCase() === addr.toLowerCase()))
        setRequests(filtered)
        localStorage.setItem('shield_pending_enlistments', JSON.stringify(filtered))
      }
    } catch (e) {
      console.error("Operator data load error:", e)
    } finally {
      setLoading(false)
    }
  }, [treasuryRead])

  useEffect(() => {
    loadData()
    // Listen for custom "enlist" events in the same tab for demo
    const handleEnlist = () => loadData()
    window.addEventListener('shield_new_enlistment', handleEnlist)
    return () => window.removeEventListener('shield_new_enlistment', handleEnlist)
  }, [loadData])

  const approve = async (addr: string) => {
    if (!treasury) return
    try {
      setTxLoading(addr)
      const tx = await treasury.addMember(addr)
      await tx.wait()
      loadData()
    } catch (e) {
      console.error("Admission failed:", e)
    } finally {
      setTxLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Enrollment Queue */}
      <CyberCard variant="amber">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <UserPlus size={18} className="text-amber" />
            <h3 className="font-display font-bold text-lg text-text-primary uppercase tracking-tight">Enrollment Queue</h3>
          </div>
          <span className="font-mono text-[10px] bg-amber/10 text-amber px-2 py-0.5 rounded border border-amber/20">
            {requests.length} PENDING
          </span>
        </div>

        <div className="space-y-3 min-h-[200px]">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-30">
              <Activity size={32} className="mb-2" />
              <p className="font-mono text-[10px] uppercase tracking-widest">No active requests</p>
            </div>
          ) : (
            requests.map(addr => (
              <div key={addr} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-amber/30 transition-all">
                <div className="font-mono text-xs text-text-primary">
                  {addr.slice(0, 12)}...{addr.slice(-8)}
                </div>
                <Button 
                  onClick={() => approve(addr)}
                  disabled={!!txLoading}
                  className="bg-amber text-bg-primary font-bold text-[10px] px-4 py-2 rounded-lg"
                >
                  {txLoading === addr ? "SIGNING..." : "AUTHORIZE"}
                </Button>
              </div>
            ))
          )}
        </div>
      </CyberCard>

      {/* Roster Feed */}
      <CyberCard>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-text-primary" />
            <h3 className="font-display font-bold text-lg text-text-primary uppercase tracking-tight">Active Roster</h3>
          </div>
          <button onClick={loadData} disabled={loading}>
            <RefreshCw size={14} className={cn("text-text-muted", loading && "animate-spin")} />
          </button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {roster.map(m => (
            <div key={m.address} className="flex items-center justify-between p-3 rounded-lg border border-white/[0.03] hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={12} className="text-jade" />
                <span className="font-mono text-[10px] text-text-secondary">{m.address.slice(0, 8)}...{m.address.slice(-6)}</span>
              </div>
              <span className="font-mono text-[9px] text-text-muted">{m.since}</span>
            </div>
          ))}
        </div>
      </CyberCard>
    </div>
  )
}
