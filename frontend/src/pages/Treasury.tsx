import { useState, useEffect, useCallback } from 'react'
import { Shield, Vault, Lock, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/UI/button'
import { CyberCard } from '../components/UI/CyberCard'
import { DecodingText } from '../components/UI/DecodingText'
import { TerminalInput } from '../components/UI/TerminalInput'
import { AdmissionTerminal } from '../components/UI/AdmissionTerminal'
import { cn } from '../lib/utils'
import { Activity, Zap, Cpu, History, Globe, TrendingUp, Info } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { useContracts } from '../hooks/useContracts'
import { useTreasuryBalance } from '../hooks/useTreasuryBalance'
import { useDAO } from '../context/DAOContext'

const StatusDot = ({ active }: { active?: boolean }) => (
  <span className="relative flex h-2 w-2 mr-2">
    <span className={cn(
      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
      active ? "bg-jade" : "bg-red"
    )}></span>
    <span className={cn(
      "relative inline-flex rounded-full h-2 w-2",
      active ? "bg-jade" : "bg-red"
    )}></span>
  </span>
)

export default function Treasury() {
  const { isConnected, address } = useWallet()
  const { treasuryRead, treasury, dao } = { ...useContracts(), ...useDAO() }
  const { balance, loading: balanceLoading, refresh: refreshBalance } = useTreasuryBalance()
  
  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [adminAddress, setAdminAddress] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [txLoading, setTxLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Simulation states
  const [logs, setLogs] = useState<string[]>([
    "INITIALIZING_FHEVM_SYNC...",
    "DETECTING_ZAMA_COPROCESSOR_V2.4...",
    "ACL_HANDSHAKE_READY"
  ])

  const checkMembership = useCallback(async () => {
    if (!treasuryRead || !address) {
      setIsMember(null)
      return
    }
    try {
      const [memberStatus, admin] = await Promise.all([
        treasuryRead.members(address),
        treasuryRead.admin()
      ])
      setIsMember(memberStatus)
      setAdminAddress(admin)
    } catch (e) {
      console.error("Membership check failed", e)
      setIsMember(false)
    }
  }, [treasuryRead, address])

  useEffect(() => {
    checkMembership()
    
    // Simulation: Add random log entries
    const logInterval = setInterval(() => {
      const msgs = [
        "RE-ENCRYPTING_SECRET_HANDLE...",
        "HOMOMORPHIC_ADDITION_COMPLETE",
        "ZKP_VERIFICATION_PASSED",
        "SHROUD_PROTOCOL_STABLE"
      ]
      setLogs(prev => [msgs[Math.floor(Math.random() * msgs.length)], ...prev].slice(0, 10))
    }, 5000)
    return () => clearInterval(logInterval)
  }, [checkMembership])

  const handleDeposit = async () => {
    if (!treasury || !amount) return
    try {
      setTxLoading(true); setError(null)
      const tx = await treasury.deposit({ value: BigInt(Math.floor(parseFloat(amount) * 1e18)) })
      setTxHash(tx.hash)
      await tx.wait()
      refreshBalance()
      setAmount('')
    } catch (e: any) {
      setError(e.message?.slice(0, 80) || 'Transaction failed')
    } finally { setTxLoading(false) }
  }

  const handleWithdraw = async () => {
    if (!treasury || !amount) return
    try {
      setTxLoading(true); setError(null)
      const tx = await treasury.withdraw(BigInt(Math.floor(parseFloat(amount) * 1e18)))
      setTxHash(tx.hash)
      await tx.wait()
      refreshBalance()
      setAmount('')
    } catch (e: any) {
      setError(e.message?.slice(0, 80) || 'Transaction failed')
    } finally { setTxLoading(false) }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="py-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber/10 border border-amber/20">
            <Vault size={22} className="text-amber" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-text-primary tracking-tight">SECURE_ENCLAVE</h1>
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-[0.2em]">
              Network: <span className="text-amber/60">fhEVM Sepolia</span> Terminal
            </p>
          </div>
        </div>
        
        {txHash && (
          <motion.a 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-jade/5 border border-jade/20 text-jade font-mono text-[10px] hover:bg-jade/10 transition-colors flex items-center gap-2"
          >
            LAST TX: {txHash.slice(0, 10)}... ↗
          </motion.a>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance card */}
        <div className="lg:col-span-1 space-y-4">
          <CyberCard variant="amber" className="relative overflow-hidden">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
               <img src="/primitive.png" alt="" className="w-full h-full object-cover grayscale brightness-200" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-[10px] text-text-muted tracking-widest uppercase">Secret Balance</span>
                <div className="flex items-center gap-2">
                  {balanceLoading && <RefreshCw size={12} className="text-amber animate-spin" />}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber/10 border border-amber/20">
                    <Lock size={10} className="text-amber" />
                    <span className="font-mono text-[10px] text-amber">FHE SECURED</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="relative">
                  <div className="absolute -inset-4 bg-amber/5 blur-3xl rounded-full opacity-50 animate-pulse" />
                  <div className="relative font-mono text-4xl font-bold tracking-tighter text-text-primary min-h-[40px] flex items-center">
                    {isConnected ? (
                      balance !== null ? (
                        <DecodingText key={balance} text={`${balance} ETH`} duration={1500} />
                      ) : (
                        <div className="flex gap-1 overflow-hidden opacity-40">
                           {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="w-5 h-8 rounded-sm bg-amber/20 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="text-text-muted text-lg uppercase tracking-widest opacity-30 italic">No Terminal Handle</div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
                    {isConnected ? "Secure Logic Key: " : "Connect your terminal to decrypt balance"}
                  </p>
                  {isConnected && (
                     <span className="font-mono text-[9px] text-amber/40 uppercase truncate">
                      {address}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-start gap-2 text-text-muted">
                  <Shield size={14} className="text-amber/60 mt-0.5" />
                  <p className="font-mono text-[10px] leading-relaxed max-w-[160px] uppercase">
                    Selective re-encryption protocol v2.4 active.
                  </p>
                </div>
                <Button onClick={refreshBalance} variant="ghost" className="p-0 h-auto hover:bg-transparent">
                   <RefreshCw size={14} className={cn("text-text-muted hover:text-amber transition-colors", balanceLoading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </CyberCard>

          {/* Advanced FHE Status */}
          <CyberCard className="p-5 border-jade/20 bg-jade/5">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={14} className="text-jade" />
              <h3 className="font-mono text-[10px] text-jade uppercase tracking-[0.2em] font-bold">Coprocessor Health</h3>
            </div>
            <div className="space-y-4">
               {[
                 { label: "Gate Capacity", value: "98.4%", icon: Cpu },
                 { label: "Noise Budget", value: "RESTORED", icon: Shield },
                 { label: "Proof Latency", value: "< 240ms", icon: Activity }
               ].map(item => (
                 <div key={item.label} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                   <div className="flex items-center gap-2">
                     <item.icon size={11} className="text-text-muted" />
                     <span className="font-mono text-[9px] text-text-secondary uppercase">{item.label}</span>
                   </div>
                   <span className="font-mono text-[10px] text-jade font-bold">{item.value}</span>
                 </div>
               ))}
            </div>
          </CyberCard>

          {/* Operation History / Logs */}
          <CyberCard className="p-5 border-white/5 bg-black/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <History size={14} className="text-text-muted" />
                <h3 className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-bold">Operations Log</h3>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-jade animate-pulse" />
            </div>
            <div className="h-[120px] font-mono text-[8.5px] overflow-hidden flex flex-col-reverse gap-1.5 opacity-60">
               {logs.map((log, i) => (
                 <div key={i} className="flex gap-2">
                    <span className="text-amber/40">[{new Date().getSeconds()}s]</span>
                    <span className="text-text-muted">{log}</span>
                 </div>
               ))}
            </div>
          </CyberCard>

          {/* Advanced Analytics */}
          <CyberCard className="p-6 relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-[0.02] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <Globe size={180} />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <TrendingUp size={16} className="text-text-primary" />
                  <h3 className="font-mono text-[11px] text-text-primary uppercase tracking-[0.3em] font-bold">Node Distribution</h3>
                </div>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber w-[65%]" />
                      </div>
                      <span className="font-mono text-[10px] text-text-muted">EU_WEST (65%)</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-jade w-[35%]" />
                      </div>
                      <span className="font-mono text-[10px] text-text-muted">US_EAST (35%)</span>
                   </div>
                   <p className="font-mono text-[9px] text-text-muted leading-relaxed uppercase pt-2">
                     <Info size={10} className="inline mr-1 mb-0.5" />
                     Multi-shard FHE processing enabled across 12 decentralized validator nodes.
                   </p>
                </div>
             </div>
          </CyberCard>

          {/* New Advanced Functions Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 p-1 rounded-2xl border border-white/5">
             <div className="p-6 rounded-xl border border-white/5 hover:border-amber/20 transition-all cursor-not-allowed group">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="font-display font-bold text-sm text-text-muted group-hover:text-amber/60">CONFIDENTIAL TRANSFER</h4>
                   <Lock size={14} className="text-text-muted group-hover:text-amber/40" />
                </div>
                <p className="font-mono text-[9px] text-text-muted uppercase leading-relaxed">Cross-member private relayer. Awaiting governance approval.</p>
             </div>
             <div className="p-6 rounded-xl border border-white/5 hover:border-jade/20 transition-all cursor-not-allowed group">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="font-display font-bold text-sm text-text-muted group-hover:text-jade/60">FHE STAKING</h4>
                   <TrendingUp size={14} className="text-text-muted group-hover:text-jade/40" />
                </div>
                <p className="font-mono text-[9px] text-text-muted uppercase leading-relaxed">Secret yield generation v1. Beta testing in progress.</p>
             </div>
          </div>
        </div>

        {/* Deposit & Withdraw */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reactor Visual - CRAZY ADDITION */}
          <CyberCard className="relative h-[280px] overflow-hidden group border-amber/20 shadow-[0_0_60px_rgba(245,166,35,0.08)] bg-black/40">
             <div className="absolute inset-0 z-0">
                <img 
                  src="/cyber_vault_shroud_1774891307204.png" 
                  alt="Zama Reactor" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[20000ms] ease-linear"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-bg-primary/40" />
             </div>

             {/* Encryption Stream Overlay */}
             <div className="absolute inset-x-0 top-0 h-full pointer-events-none opacity-[0.05] font-mono text-[8px] text-amber flex gap-8 p-4 overflow-hidden select-none">
                {Array.from({ length: 3 }).map((_, col) => (
                  <div key={col} className="flex flex-col gap-1 animate-[terminal-scan_15s_linear_infinite]" style={{ animationDelay: `${col * -4.5}s` }}>
                    {Array.from({ length: 40 }).map((_, i) => (
                       <span key={i}>{Math.random().toString(16).slice(2, 12).toUpperCase()}</span>
                    ))}
                  </div>
                ))}
             </div>

             <div className="relative z-10 h-full flex flex-col justify-between p-8">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <h3 className="font-display font-black text-4xl text-white tracking-tighter italic">REACTOR_CORE</h3>
                      <div className="flex items-center gap-3">
                         <div className="w-16 h-0.5 bg-amber animate-pulse shadow-[0_0_10px_#F5A623]" />
                         <span className="font-mono text-[9px] text-amber uppercase tracking-[0.5em] font-bold">ZAMA_FHE_COPROCESSOR</span>
                      </div>
                   </div>
                   <div className="p-4 rounded-full bg-black/60 border border-amber/40 backdrop-blur-3xl animate-[spin_15s_linear_infinite]">
                      <Cpu size={32} className="text-amber shadow-[0_0_25px_rgba(245,166,35,0.8)]" />
                   </div>
                </div>

                <div className="flex items-end justify-between gap-8">
                   <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-center mb-1 px-1">
                         <p className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em]">Enclave Integrity</p>
                         <div className="flex items-center gap-2">
                            <Activity size={10} className="text-jade animate-pulse" />
                            <span className="font-mono text-[9px] text-jade font-bold">VERIFIED</span>
                         </div>
                      </div>
                      <div className="flex gap-1 h-1.5 px-0.5">
                         {Array.from({ length: 32 }).map((_, i) => (
                           <div key={i} className={cn("flex-1 rounded-full transition-all duration-1000", i < 24 ? "bg-amber" : "bg-white/10")} style={{ transitionDelay: `${i * 20}ms` }} />
                         ))}
                      </div>
                   </div>
                   <div className="text-right min-w-[100px] border-l border-white/10 pl-6">
                      <p className="font-mono text-[28px] font-bold text-white leading-none tracking-tighter">98.2%</p>
                      <p className="font-mono text-[8px] text-amber uppercase tracking-widest mt-2 font-bold">Enc_Efficiency</p>
                   </div>
                </div>
             </div>
          </CyberCard>
          {isMember === false && isConnected ? (
            <div className="space-y-4">
              <AdmissionTerminal address={address} onEnlist={() => console.log("Enlistment requested for:", address)} />
              {address?.toLowerCase() === adminAddress?.toLowerCase() && (
                <Button 
                  onClick={async () => {
                    if (!treasury) return
                    try {
                      setTxLoading(true)
                      const tx = await treasury.addMember(address)
                      await tx.wait()
                      checkMembership()
                    } catch (e) {
                      console.error("Self-admission failed", e)
                    } finally { setTxLoading(false) }
                  }}
                  className="w-full bg-amber/20 border border-amber/40 text-amber font-mono text-[10px] py-4 rounded-xl hover:bg-amber/30 transition-all uppercase tracking-widest"
                >
                  {txLoading ? "AUTHORIZING..." : "ADMIN OVERRIDE: GRANT SELF ACCESS"}
                </Button>
              )}
            </div>
          ) : isMember === null && isConnected ? (
             <CyberCard className="flex items-center justify-center py-20">
               <div className="flex flex-col items-center gap-4">
                  <RefreshCw size={24} className="text-amber animate-spin opacity-40" />
                  <p className="font-mono text-[10px] text-text-muted uppercase tracking-[0.3em]">Identity Scan In Progress...</p>
               </div>
             </CyberCard>
          ) : (
            <>
              <CyberCard variant="jade" className="relative group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="font-display font-bold text-lg text-text-primary mb-1 flex items-center gap-2">
                      <ArrowDownLeft size={18} className="text-jade" />
                      Privatize Assets
                    </h2>
                    <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                      Native ETH → <span className="text-jade">Encrypted euint64</span>
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-jade/5 border border-jade/20 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Shield size={16} className="text-jade" />
                  </div>
                </div>

                <div className="space-y-6">
                  <TerminalInput 
                    variant="jade"
                    label="Entry Amount (ETH)"
                    placeholder="0.00"
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Button 
                      onClick={handleDeposit}
                      disabled={txLoading || !amount}
                      className="w-full sm:w-auto rounded-xl px-10 py-6 bg-jade hover:bg-jade-dim text-bg-primary font-bold transition-all shadow-[0_0_15px_rgba(46,204,113,0.3)]"
                    >
                      {txLoading ? "EXECUTING..." : "INITIALIZE DEPOSIT"}
                    </Button>
                    {error && <span className="text-[10px] font-mono text-red animate-pulse uppercase tracking-tighter">{error}</span>}
                  </div>
                </div>
              </CyberCard>

              <CyberCard variant="red" className="group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="font-display font-bold text-lg text-text-primary mb-1 flex items-center gap-2">
                      <ArrowUpRight size={18} className="text-red" />
                      FHE Extraction
                    </h2>
                    <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                      Homomorphic Underflow Protection
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-red/5 border border-red/20 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Lock size={16} className="text-red" />
                  </div>
                </div>

                <div className="space-y-6">
                  <TerminalInput 
                    variant="red"
                    label="Extraction Amount (ETH)"
                    placeholder="0.00"
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Button 
                      onClick={handleWithdraw}
                      disabled={txLoading || !amount}
                      variant="outline" 
                      className="w-full sm:w-auto rounded-xl px-10 py-6 border-red text-red hover:bg-red/10 font-bold transition-all"
                    >
                      {txLoading ? "AUTHORIZING..." : "AUTHORIZE WITHDRAWAL"}
                    </Button>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red/5 border border-red/10">
                       <DecodingText 
                        className="text-[10px] text-red/70 uppercase tracking-widest"
                        text="FHE.select() Verification Active"
                        interval={100}
                       />
                    </div>
                  </div>
                </div>
              </CyberCard>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
