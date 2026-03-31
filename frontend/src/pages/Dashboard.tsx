import { useState, useEffect, useCallback } from 'react'
import { Shield, Lock, Zap, FileText, Users, Vote, ExternalLink, ArrowRight } from 'lucide-react'
import { CyberCard } from '../components/UI/CyberCard'
import { DecodingText } from '../components/UI/DecodingText'
import { useContracts } from '../hooks/useContracts'
import { useDAO } from '../context/DAOContext'
import { useWallet } from '../hooks/useWallet'
import { OperatorTerminal } from '../components/UI/OperatorTerminal'
import { FeaturesSection } from '../components/UI/FeaturesSection'
import { cn } from '../lib/utils'

export default function Dashboard() {
  const { treasuryRead, governance } = useContracts()
  const { address, isConnected } = useWallet()
  const { dao } = useDAO()
  
  const [adminAddress, setAdminAddress] = useState<string | null>(null)
  const [stats, setStats] = useState({
    memberCount: 0,
    proposalCount: 0,
    activeProposals: 0,
    loading: true
  })

  const loadStats = useCallback(async () => {
    if (!treasuryRead) return
    try {
      // Fetch member count from Treasury events (simplified for demo)
      const addedFilter = treasuryRead.filters.MemberAdded()
      const addedEvents = await treasuryRead.queryFilter(addedFilter)
      
      let propCount = 0
      if (governance) {
         try {
           propCount = Number(await governance.proposalCount())
         } catch(e) {}
      }

      setStats({
        memberCount: addedEvents.length,
        proposalCount: propCount,
        activeProposals: propCount > 0 ? 1 : 0,
        loading: false
      })

      const admin = await treasuryRead.admin()
      setAdminAddress(admin)
    } catch (e) {
      console.error("Dashboard load error:", e)
      setStats(s => ({ ...s, loading: false }))
    }
  }, [treasuryRead, governance])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return (
    <div className="py-8 space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-bg-card border border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield size={240} className="text-amber" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { icon: Lock,   label: 'FHE Encrypted', color: 'text-amber' },
              { icon: Zap,    label: 'Sepolia Live',  color: 'text-jade' },
              { icon: Shield, label: 'Zama-Powered', color: 'text-amber' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className={cn(
                "flex items-center gap-2 px-3 py-1 transparent-glass border border-white/5 rounded-full font-mono text-[9px] uppercase tracking-widest",
                color
              )}>
                <Icon size={11} />
                {label}
              </div>
            ))}
          </div>

          <h1 className="font-display font-black text-5xl md:text-7xl text-text-primary leading-[0.95] tracking-tight mb-6">
            <span className="text-amber">PRIVATE</span><br />
            {dao.name.toUpperCase()}<br />
            TERMINAL
          </h1>

          <p className="font-mono text-sm text-text-muted leading-relaxed max-w-md mb-8">
            Confidential treasury management and homomorphic governance. 
            Powered by threshold FHE for absolute privacy in collective decision making.
          </p>

          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-primary bg-bg-card flex items-center justify-center text-[10px] font-bold text-amber">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
             </div>
             <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
               {stats.memberCount} MEMBERS ACTIVE
             </p>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TREASURY STATUS', value: 'CONFIDENTIAL', sub: 'Total balance encrypted', icon: Lock, color: 'text-amber' },
          { label: 'ACTIVE PROPOSALS', value: stats.activeProposals.toString(), sub: 'Awaiting decryption', icon: FileText, color: 'text-jade' },
          { label: 'MEMBERS PROTECTED', value: stats.memberCount.toString(), sub: 'FHE ACL Enforced', icon: Users, color: 'text-text-primary' },
          { label: 'NETWORK LATENCY', value: '2.4s', sub: 'Coprocessor Sync', icon: Zap, color: 'text-amber' },
        ].map((stat, i) => (
          <CyberCard key={i} className="group">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[9px] text-text-muted tracking-widest uppercase">{stat.label}</span>
              <stat.icon size={14} className="text-text-muted group-hover:text-amber transition-colors" />
            </div>
            <div className={cn("font-mono text-2xl font-bold mb-1", stat.color)}>
              {stat.value === 'CONFIDENTIAL' ? (
                <DecodingText text="███████" interval={200} />
              ) : stat.value}
            </div>
            <div className="font-mono text-[10px] text-text-muted uppercase">{stat.sub}</div>
          </CyberCard>
        ))}
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CyberCard variant="amber">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-lg text-text-primary">DAO BLUEPRINT</h3>
            <ExternalLink size={14} className="text-text-muted" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Treasury', addr: dao.treasuryAddress },
              { label: 'Governance', addr: dao.governanceAddress },
              { label: 'Auditor', addr: dao.auditorAddress },
            ].map(item => (
              <div key={item.label} className="flex justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="font-mono text-[10px] text-text-muted uppercase">{item.label}</span>
                <span className="font-mono text-[10px] text-amber/60 truncate ml-4">
                  {item.addr.slice(0, 10)}...{item.addr.slice(-6)}
                </span>
              </div>
            ))}
          </div>
        </CyberCard>

        <CyberCard variant="jade">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-lg text-text-primary">RECENT ACTIVITY</h3>
            <button className="font-mono text-[9px] text-jade uppercase hover:underline">History</button>
          </div>
          <div className="space-y-3">
             <div className="p-4 rounded-xl border border-jade/20 bg-jade/5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-jade/20">
                    <Vote size={16} className="text-jade" />
                  </div>
                  <div>
                    <p className="font-mono text-xs text-text-primary">Proposal #1 Active</p>
                    <p className="font-mono text-[9px] text-text-muted uppercase">Voting window open</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-jade opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
             </div>
             
             <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-text-muted">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="font-mono text-xs">New Member Joined</p>
                    <p className="font-mono text-[9px] uppercase tracking-widest">3 hours ago</p>
                  </div>
                </div>
             </div>
          </div>
        </CyberCard>
      </div>

      {/* Advanced Protocol Features */}
      <FeaturesSection />

      {/* Operator Terminal (Admin Only) */}
      {isConnected && address?.toLowerCase() === adminAddress?.toLowerCase() && (
        <section className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-red/10 border border-red/20 shadow-[0_0_10px_rgba(231,76,60,0.1)]">
              <Shield size={18} className="text-red" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-tight">Operator Command</h2>
              <p className="font-mono text-[10px] text-red/60 uppercase tracking-widest leading-none">Level 4 Clearance Authorized</p>
            </div>
          </div>
          <OperatorTerminal />
        </section>
      )}
    </div>
  )
}
