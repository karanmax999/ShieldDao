import { useState, useEffect, useCallback } from 'react'
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { Contract } from 'ethers'
import { useWallet } from '../hooks/useWallet'
import { useContracts } from '../hooks/useContracts'
import { useDAO } from '../context/DAOContext'
import { CyberCard } from '../components/UI/CyberCard'
import { DecodingText } from '../components/UI/DecodingText'
import { Button } from '../components/UI/button'
import { cn } from '../lib/utils'
import { CONTRACTS } from '../config/contracts'

interface MemberRow {
  address: string
  accessGranted: boolean
  auditResult: number | null
  lastAuditTime: string | null
}

export default function Auditor() {
  const { dao } = useDAO()
  const { readProvider, address, isConnected } = useWallet()
  const { auditorAccess: auditorWrite } = useContracts()
  const [members, setMembers]           = useState<MemberRow[]>([])
  const [loading, setLoading]           = useState(false)
  
  // Roles
  const [roles, setRoles] = useState({
    admin: '',
    auditor: '',
    gateway: '',
    isAuditor: false,
    isAdmin: false,
    isGateway: false
  })

  const [auditingAddr, setAuditingAddr] = useState<string | null>(null)
  const [revealAddr, setRevealAddr]     = useState<string | null>(null)
  const [revealAmount, setRevealAmount] = useState('')
  const [txHash, setTxHash]             = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [isPending, setIsPending]       = useState(false)
  const [pendingMember, setPendingMember] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const auditorRead = new Contract(dao.auditorAddress, CONTRACTS.auditorAccess.abi, readProvider)
      const treasuryRead = new Contract(dao.treasuryAddress, CONTRACTS.treasury.abi, readProvider)

      // Get all members from MemberAdded events
      const addedFilter   = treasuryRead.filters.MemberAdded()
      const removedFilter = treasuryRead.filters.MemberRemoved()
      const [added, removed] = await Promise.all([
        treasuryRead.queryFilter(addedFilter),
        treasuryRead.queryFilter(removedFilter),
      ])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addedSet   = new Set(added.map((e: any) => (e.args?.member as string ?? '').toLowerCase()))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const removedSet = new Set(removed.map((e: any) => (e.args?.member as string ?? '').toLowerCase()))
      const activeAddrs = [...addedSet].filter(a => !removedSet.has(a))

      const [pending, pMember, admin, activeAuditor, gateway] = await Promise.all([
        auditorRead.isDecryptionPending(),
        auditorRead.pendingMember(),
        auditorRead.admin(),
        auditorRead.auditor(),
        auditorRead.gateway()
      ])

      setIsPending(pending)
      setPendingMember(pMember === '0x0000000000000000000000000000000000000000' ? null : pMember)
      
      const userAddr = address?.toLowerCase() || ''
      setRoles({
        admin: admin.toLowerCase(),
        auditor: activeAuditor.toLowerCase(),
        gateway: gateway.toLowerCase(),
        isAdmin: userAddr === admin.toLowerCase(),
        isAuditor: userAddr === activeAuditor.toLowerCase(),
        isGateway: userAddr === gateway.toLowerCase() || userAddr === admin.toLowerCase()
      })

      // Build rows
      const rows: MemberRow[] = await Promise.all(activeAddrs.map(async (addr) => {
        const [granted, result] = await Promise.all([
          auditorRead.auditorGrants(addr),
          auditorRead.auditResults(addr),
        ])
        // Get AuditRevealed events for this member
        const revealFilter = auditorRead.filters.AuditRevealed(addr)
        const reveals = await auditorRead.queryFilter(revealFilter)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lastReveal = reveals.length > 0 ? reveals[reveals.length - 1] : null
        return {
          address: addr as string,
          accessGranted: granted,
          auditResult: Number(result) > 0 ? Number(result) : null,
          lastAuditTime: lastReveal ? new Date(Number((lastReveal as any).args?.balance ?? 0)).toLocaleTimeString() : null,
        }
      }))
      setMembers(rows)
    } catch (e) {
      console.error('Failed to load auditor data:', e)
    } finally {
      setLoading(false)
    }
  }, [readProvider])

  useEffect(() => { load() }, [load])

  const requestAudit = async (memberAddr: string) => {
    if (!auditorWrite) return
    try {
      setAuditingAddr(memberAddr); setError(null); setTxHash(null)
      const tx = await auditorWrite.requestAudit(memberAddr, { gasLimit: 300_000n })
      setTxHash(tx.hash)
      await tx.wait()
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Unauthorized')) setError('Only the registered auditor can call requestAudit.')
      else if (msg.includes('AccessNotGranted')) setError('Access not granted for this member.')
      else if (msg.includes('DecryptionPending')) setError('A decryption is already pending.')
      else if (msg.includes('user rejected')) setError('Rejected in MetaMask.')
      else setError(msg.slice(0, 120))
    } finally { setAuditingAddr(null) }
  }

  const revealAudit = async () => {
    if (!auditorWrite || !revealAddr || !revealAmount) return
    try {
      setError(null); setTxHash(null)
      const amountWei = BigInt(Math.floor(parseFloat(revealAmount) * 1e18))
      const tx = await auditorWrite.revealAudit(revealAddr, amountWei, { gasLimit: 200_000n })
      setTxHash(tx.hash)
      await tx.wait()
      setRevealAddr(null); setRevealAmount('')
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg.includes('user rejected') ? 'Rejected.' : msg.slice(0, 120))
    }
  }

  return (
    <div className="py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red/10 border border-red/20 shadow-[0_0_15px_rgba(231,76,60,0.1)]">
            <Shield size={22} className="text-red" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary tracking-tight">Compliance Audit</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest leading-none">Selective disclosure via on-chain FHE ACL</span>
               {isConnected && (
                 <div className={cn(
                   "px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-tighter",
                   roles.isAdmin ? "bg-amber/10 text-amber border border-amber/20" : 
                   roles.isAuditor ? "bg-jade/10 text-jade border border-jade/20" :
                   "bg-white/5 text-text-muted border border-white/10"
                 )}>
                   {roles.isAdmin ? "ADMIN CONTROL" : roles.isAuditor ? "DESIGNATED AUDITOR" : "STANDARD MEMBER"}
                 </div>
               )}
            </div>
          </div>
        </div>
        
        <Button onClick={load} disabled={loading} variant="outline" className="h-9 px-4 font-mono text-[10px] gap-2">
          <RefreshCw size={12} className={cn(loading && "animate-spin")} />
          {loading ? 'SYNCING…' : 'REFRESH'}
        </Button>
      </div>

      {/* How it works */}
      <CyberCard variant="red" className="relative group">
         <div className="flex items-center gap-2 mb-8">
            <Lock size={14} className="text-red/60" />
            <h3 className="font-mono text-[10px] text-red uppercase tracking-[0.2em]">Decryption Protocol: selective-disclosure-v1</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { step: '01', title: 'ACL GRANT', desc: 'Admin authorizes the Auditor cryptographically for a specific handle.' },
             { step: '02', title: 'INTENT SIGNAL', desc: 'Auditor requests decryption. Awaiting Coprocessor decryption.' },
             { step: '03', title: 'ON-CHAIN REVEAL', desc: 'Gateway delivers plaintext. Stored in public auditResults mapping.' },
           ].map(({ step, title, desc }) => (
             <div key={step} className="space-y-2 border-l border-white/5 pl-4 hover:border-red/30 transition-colors">
               <div className="font-mono text-2xl font-bold text-white/5 group-hover:text-red/10 transition-colors leading-none">{step}</div>
               <div className="font-display font-bold text-xs text-text-primary uppercase tracking-wider">{title}</div>
               <div className="font-mono text-[10px] text-text-muted leading-relaxed uppercase">{desc}</div>
             </div>
           ))}
         </div>
      </CyberCard>

      {/* Pending decryption status */}
      {isPending && pendingMember && (
        <CyberCard variant="amber">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-6 flex items-center justify-center bg-amber/20 rounded border border-amber/30">
                  <div className="w-1 h-3 bg-amber animate-[pulse_1s_infinite]" />
                </div>
                <div>
                  <p className="font-mono text-[11px] text-amber font-bold uppercase tracking-widest">Decryption pending</p>
                  <p className="font-mono text-[9px] text-text-muted truncate max-w-[200px] uppercase">TARGET: {pendingMember}</p>
                </div>
              </div>

              {roles.isGateway ? (
                <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
                  <input 
                    value={revealAmount} 
                    onChange={e => { setRevealAddr(pendingMember); setRevealAmount(e.target.value) }} 
                    placeholder="AMOUNT" 
                    type="number" 
                    className="bg-transparent border-none outline-none font-mono text-xs text-amber placeholder:text-amber/30 w-24 px-2"
                  />
                  <Button onClick={revealAudit} className="h-8 px-4 text-[10px] bg-amber text-bg-primary font-bold uppercase">Commit Reveal</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                   <Lock size={12} className="text-text-muted" />
                   <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">GATED: Gateway clearance required</span>
                </div>
              )}
            </div>
        </CyberCard>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-[10px] uppercase animate-pulse">
           ⚠️ SYSTEM_ERROR: {error}
        </div>
      )}
      
      {txHash && (
        <div className="flex items-center gap-2 font-mono text-[10px] text-jade uppercase bg-jade/5 border border-jade/10 p-3 rounded-lg">
          <CheckCircle size={14} />
          TX_EXECUTED: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">{txHash.slice(0, 16)}...</a>
        </div>
      )}

      {/* Member table */}
      <CyberCard className="overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          {['Identity', 'Access', 'Encrypted State', 'Actions'].map(h => (
            <span key={h} className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em]">{h}</span>
          ))}
        </div>
        
        <div className="divide-y divide-white/5">
          {members.length === 0 && !loading && (
            <div className="py-20 text-center opacity-30">
               <DecodingText text="Scanning for active agents..." interval={50} />
            </div>
          )}
          {members.map(m => (
            <div key={m.address} className="grid grid-cols-4 gap-4 px-6 py-5 items-center hover:bg-white/[0.01] transition-colors">
              <div className="font-mono text-xs text-text-primary flex items-center gap-2">
                {m.address.slice(0, 8)}...{m.address.slice(-6)}
                {address && m.address.toLowerCase() === address.toLowerCase() && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber/10 text-amber border border-amber/20 text-[8px] font-bold">YOU</span>
                )}
              </div>
              
              <div>
                {m.accessGranted ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-jade/10 border border-jade/20 rounded-full text-jade font-mono text-[9px] uppercase">
                    <CheckCircle size={10} /> Authorized
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red/10 border border-red/20 rounded-full text-red/60 font-mono text-[9px] uppercase">
                    <AlertTriangle size={10} /> Restricted
                  </div>
                )}
              </div>

              <div className="font-mono text-[11px]">
                {auditingAddr === m.address ? (
                   <DecodingText text="ANALYZING..." className="text-amber" interval={100} />
                ) : m.auditResult !== null ? (
                  <span className="text-jade font-bold text-xs tracking-tight">{(m.auditResult / 1e18).toFixed(6)} ETH</span>
                ) : (
                  <span className="text-text-muted opacity-40">██████████</span>
                )}
              </div>

              <div>
                {m.accessGranted && isConnected && !isPending && roles.isAuditor && (
                  <Button 
                    onClick={() => requestAudit(m.address)} 
                    disabled={auditingAddr !== null}
                    variant="ghost" 
                    className="h-8 text-[9px] gap-2 border border-amber/20 text-amber hover:bg-amber/10 px-4"
                  >
                    <Eye size={12} /> SYNC AUDIT
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CyberCard>
    </div>
  )
}
