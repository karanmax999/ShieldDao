import { useState, useEffect, useCallback, useRef } from 'react'
import { Shield, Vault, Lock, ArrowUpRight, ArrowDownLeft, RefreshCw, Activity, Zap, Cpu, History, Globe, Send, AlertTriangle, Eye, Coins } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/UI/button'
import { CyberCard } from '../components/UI/CyberCard'
import { DecodingText } from '../components/UI/DecodingText'
import { TerminalInput } from '../components/UI/TerminalInput'
import { AdmissionTerminal } from '../components/UI/AdmissionTerminal'
import { TerminalLog, type TerminalLogHandle } from '../components/UI/TerminalLog'
import { cn } from '../lib/utils'
import { useWallet } from '../hooks/useWallet'
import { useContracts } from '../hooks/useContracts'
import { useTreasuryBalance } from '../hooks/useTreasuryBalance'
import { parseEther } from 'ethers'
import { useFhevm } from '../hooks/useFhevm'
import CryptoSwapCard from '../components/UI/CryptoSwapCard'

// Declare window extension for addLog
declare global {
  interface Window {
    addLog?: (text: string, type?: 'info' | 'success' | 'error' | 'pending') => void;
  }
}

const StatusDot = ({ active }: { active?: boolean }) => (
  <span className="relative flex h-2 w-2">
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
  const { isConnected, address, connect, isWrongNetwork, switchToSepolia } = useWallet()
  const { treasuryRead, treasury } = useContracts()
  const { balance, loading: balanceLoading, isDecrypted, decrypt, hide, refresh: refreshBalance } = useTreasuryBalance()
  const { instance, ready: fheReady, error: fheError, status: fheStatus, progress: fheProgress } = useFhevm()
  
  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [amount, setAmount] = useState('')
  const [txLoading, setTxLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer' | 'swap'>('deposit')
  const [transferRecipient, setTransferRecipient] = useState('')

  const logRef = useRef<TerminalLogHandle>(null)

  const checkMembership = useCallback(async () => {
    if (!treasuryRead || !address) return
    try {
      const memberStatus = await treasuryRead.members(address)
      setIsMember(memberStatus)
    } catch (e) {
      setIsMember(false)
    }
  }, [treasuryRead, address])

  useEffect(() => {
    checkMembership()
    // Bridge window.addLog to TerminalLog
    const bridge = (text: string, type?: any) => logRef.current?.addLog(text, type)
    window.addLog = bridge
    
    // Initial identity log - small delay to ensure log component is ready
    setTimeout(() => {
      bridge(`Terminal online. Identity: ${address?.slice(0, 8) || 'Unknown'}`, 'info')
    }, 500)

    return () => { window.addLog = undefined }
  }, [checkMembership, address])

  // Watch FHE Status
  useEffect(() => {
    if (fheStatus === 'LOADING_WASM') window.addLog?.(`Downloading FHE_CORE_WASM (2.4mb)...`, 'pending')
    if (fheStatus === 'INITIALIZING_SDK') window.addLog?.(`Booting Relayer SDK Enclave...`, 'pending')
    if (fheStatus === 'KMS_SYNC') window.addLog?.(`Synchronizing KMS Threshold Keys...`, 'pending')
    if (fheStatus === 'READY') window.addLog?.(`Privacy Enclave initialized. Zero-Knowledge state ready.`, 'success')
    if (fheStatus === 'ERROR') window.addLog?.(`CRITICAL_BOOT_FAIL: ${fheError}`, 'error')
  }, [fheStatus, fheError])

  const handleDeposit = async () => {
    if (!treasury || !amount) return
    try {
      setTxLoading(true); setError(null)
      window.addLog?.(`Encrypting ${amount} ETH for vault entry...`, 'pending')
      const tx = await treasury.deposit({ value: parseEther(amount) })
      window.addLog?.(`Transaction broadcasted: ${tx.hash.slice(0, 10)}...`, 'info')
      await tx.wait()
      window.addLog?.(`Deposit complete. Balance updated homomorphically.`, 'success')
      refreshBalance(); setAmount('')
    } catch (e: any) {
      setError(e.message?.slice(0, 80)); window.addLog?.(`Deposit aborted.`, 'error')
    } finally { setTxLoading(false) }
  }

  const handleWithdraw = async () => {
    if (!treasury || !amount) return
    try {
      setTxLoading(true); setError(null)
      window.addLog?.(`Generating privacy proof for withdrawal...`, 'pending')
      const tx = await treasury.withdraw(parseEther(amount))
      await tx.wait()
      window.addLog?.(`Withdrawal finalized. Assets returned to wallet.`, 'success')
      refreshBalance(); setAmount('')
    } catch (e: any) {
      setError(e.message?.slice(0, 80)); window.addLog?.(`Withdrawal failed.`, 'error')
    } finally { setTxLoading(false) }
  }

  const handleTransfer = async () => {
    if (!treasury || !instance || !transferRecipient || !amount) return
    try {
      setTxLoading(true); setError(null)
      window.addLog?.(`Encrypting transfer to ${transferRecipient.slice(0, 8)}...`, 'pending')
      const encrypted = instance.encrypt64(BigInt(parseEther(amount).toString()))
      window.addLog?.(`Generating ZK Input Proof...`, 'pending')
      const tx = await treasury.transfer(transferRecipient, encrypted.ciphertext, encrypted.inputProof)
      await tx.wait()
      window.addLog?.(`Shielded transfer finalized on-chain.`, 'success')
      refreshBalance(); setAmount(''); setTransferRecipient('')
    } catch (e: any) {
      setError(e.message?.slice(0, 80)); window.addLog?.(`Transfer aborted.`, 'error')
    } finally { setTxLoading(false) }
  }

  return (
    <div className="p-12 space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* ─── Header & Health Status ─── */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-syne font-black text-6xl text-text-primary tracking-tighter uppercase mb-2 italic">REACTOR_CORE</h1>
          <div className="flex items-center gap-4">
            <p className="font-mono text-[10px] text-text-muted inline-flex items-center gap-2 uppercase tracking-[0.3em]">
              <Globe size={12} className="text-jade" /> Zama fhEVM Enclave
            </p>
            <div className="h-4 w-[1px] bg-white/10" />
            <p className="font-mono text-[10px] text-text-muted inline-flex items-center gap-2 uppercase tracking-[0.3em]">
              <Cpu size={12} className="text-amber" /> Sepolia Relay Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 border border-white/5 bg-white/5 rounded-full backdrop-blur-xl">
            <StatusDot active={fheReady} />
            <span className="font-display font-bold text-[10px] text-text-muted uppercase tracking-widest font-black">Enclave: {fheReady ? 'Online' : 'Booting'}</span>
          </div>
          <button onClick={refreshBalance} disabled={balanceLoading} className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <RefreshCw size={16} className={cn("text-text-muted", balanceLoading && "animate-spin")} />
          </button>
        </div>
      </section>

      {isWrongNetwork && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red/10 border border-red-500/20 p-5 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="font-mono text-xs text-red-400">Terminal misconfiguration: Connect to Sepolia testnet to proceed.</span>
          </div>
          <Button onClick={switchToSepolia} variant="ghost" className="text-red-500 font-bold text-[11px] hover:bg-red-500/20">SWITCH NETWORK</Button>
        </motion.div>
      )}

      {/* ─── Reactor & Metrics Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Reactor Visual (Left) */}
        <div className="lg:col-span-8">
          <CyberCard className="relative h-[340px] overflow-hidden group border-amber/20 bg-black/40 shadow-[0_0_100px_rgba(245,166,35,0.08)]">
             <div className="absolute inset-0 z-0 opacity-50">
                <div className="absolute inset-0 overflow-hidden">
                   {/* Reactor Core Visual */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
                      <div className="absolute inset-0 border-[2px] border-amber/10 rounded-full animate-[spin_20s_linear_infinite]" />
                      <div className="absolute inset-10 border-[1px] border-amber/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                      <div className="absolute inset-20 border-[4px] border-amber/5 rounded-full border-dashed animate-[spin_30s_linear_infinite]" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-amber/5 rounded-full blur-[80px] animate-pulse" />
                   </div>
                </div>
                <img src="/cyber_vault_shroud_1774891307204.png" alt="" className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-[10s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-bg-primary/60" />
             </div>
            
            <div className="relative z-10 h-full p-10 flex flex-col justify-between">
              <div className="space-y-1">
                 <h2 className="font-display font-black text-4xl text-white tracking-tighter italic uppercase opacity-90">COPROCESSOR_LINK</h2>
                 <div className="flex items-center gap-3">
                    <div className="w-16 h-px bg-amber shadow-[0_0_15px_#F5A623]" />
                    <span className="font-mono text-[9px] text-amber uppercase tracking-[0.5em] font-bold">ZAMA_FHEV2.4_READY</span>
                 </div>
              </div>

              <div className="w-full max-w-md space-y-5 bg-black/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                 <div className="flex justify-between items-center px-1">
                    <p className="font-mono text-[9px] text-text-muted uppercase tracking-widest font-black">ENCLAVE INTEGRITY</p>
                    <div className="flex items-center gap-2">
                      <Activity size={12} className="text-jade animate-pulse" />
                      <span className="font-mono text-[10px] text-jade font-black">SECURE (100%)</span>
                    </div>
                 </div>
                 <div className="flex gap-1.5 h-2 px-0.5">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div key={i} className={cn("flex-1 rounded-full transition-all duration-1000 shadow-[0_0_5px_rgba(245,166,35,0.2)]", i < 28 ? "bg-amber" : "bg-white/10")} style={{ transitionDelay: `${i * 20}ms` }} />
                    ))}
                 </div>
              </div>
            </div>
          </CyberCard>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <CyberCard variant="jade" className="flex-1 hover:border-jade/40 transition-colors">
            <div className="flex items-center gap-3 mb-8">
              <Zap size={16} className="text-jade" />
              <h3 className="font-mono text-[11px] text-jade uppercase tracking-[0.3em] font-black">Coprocessor Health</h3>
            </div>
            <div className="space-y-5">
               {[
                 { label: "Gate Capacity", value: "98.4%", icon: Cpu },
                 { label: "Noise Budget", value: "RESTORED", icon: Shield },
                 { label: "Proof Latency", value: "< 240ms", icon: Activity }
               ].map(item => (
                 <div key={item.label} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 hover:bg-jade/5 transition-all">
                   <div className="flex items-center gap-3">
                     <item.icon size={14} className="text-text-muted opacity-60" />
                     <span className="font-mono text-[10px] text-text-secondary uppercase tracking-widest font-bold">{item.label}</span>
                   </div>
                   <span className="font-mono text-sm text-jade font-black italic">{item.value}</span>
                 </div>
               ))}
            </div>
          </CyberCard>
        </div>
      </div>

      {/* ─── Row 2: Asset Enclave & Operations Console ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Private Enclave */}
        <div className="lg:col-span-5">
          <CyberCard variant="amber" className="h-full relative overflow-hidden group min-h-[480px] flex flex-col justify-between shadow-[0_0_60px_rgba(245,166,35,0.04)]">
            <div className="absolute top-0 right-0 p-16 text-amber/5 pointer-events-none group-hover:scale-110 transition-transform duration-[12s] rotate-12"><Vault size={300} /></div>
            
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-16">
                <div className="px-4 py-1.5 bg-amber/10 border border-amber/20 rounded-full flex items-center gap-3 backdrop-blur-xl">
                  <Lock size={14} className="text-amber" />
                  <span className="font-mono text-[10px] text-amber uppercase font-black tracking-[0.25em]">PRIVACY ENCLAVE ACTIVE</span>
                </div>
              </div>

              <div className="space-y-16">
                <div className="space-y-6">
                  <span className="font-mono text-[11px] text-text-muted uppercase tracking-[0.3em] opacity-40 font-bold block ml-1">SHIELDED BALANCE</span>
                  <div className="font-syne font-black text-8xl text-text-primary tracking-tighter flex items-baseline gap-4 min-h-[80px] drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    {isConnected ? (
                      isDecrypted ? (
                        balance !== null ? (
                          <DecodingText key={balance} text={balance} duration={1500} />
                        ) : (
                          <div className="flex gap-3">
                             {[...Array(6)].map((_, i) => <div key={i} className="w-10 h-16 bg-amber/10 animate-pulse rounded-xl" style={{ animationDelay: `${i * 0.1}s` }} />)}
                          </div>
                        )
                      ) : (
                        <div className="flex gap-3">
                           {[...Array(5)].map((_, i) => (
                             <div key={i} className="w-12 h-16 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center font-mono text-2xl text-white/5 select-none">
                               ?
                             </div>
                           ))}
                        </div>
                      )
                    ) : (
                      <span className="text-3xl text-text-muted italic opacity-20 tracking-normal uppercase font-mono">Terminal Offline</span>
                    )}
                    {isDecrypted && balance !== null && <span className="text-3xl text-amber/40 font-mono italic">ETH</span>}
                  </div>
                </div>

                <div className="pt-4">
                   {isConnected && (
                     isDecrypted ? (
                        <Button 
                          variant="ghost" 
                          onClick={hide} 
                          className="h-10 px-6 border border-white/10 text-text-muted hover:text-white rounded-full font-mono text-[10px] tracking-widest uppercase font-black"
                        >
                          <Lock size={12} className="mr-2" /> HIDE_ASSETS
                        </Button>
                     ) : (
                        <div className="flex flex-col gap-4">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              if (!fheReady) {
                                window.addLog?.("Error: Privacy Enclave is still booting. Please wait.", "error")
                                return
                              }
                              decrypt()
                            }} 
                            disabled={balanceLoading}
                            className="h-14 px-10 border-amber text-amber hover:bg-amber/20 rounded-xl font-mono text-xs tracking-widest uppercase font-black shadow-[0_0_30px_rgba(245,166,35,0.2)] transition-all group/btn"
                          >
                            {balanceLoading ? (
                              <RefreshCw size={16} className="mr-3 animate-spin" />
                            ) : (
                              <Eye size={16} className="mr-3 group-hover/btn:scale-125 transition-transform" />
                            )}
                            REVEAL_ASSETS_ENCLAVE
                          </Button>
                          {!fheReady && !fheError && (
                            <div className="space-y-3">
                               <div className="flex justify-between items-center px-1">
                                  <p className="font-mono text-[9px] text-amber/60 uppercase tracking-widest animate-pulse">{fheStatus.replace('_', ' ')}...</p>
                                  <p className="font-mono text-[10px] text-amber font-black">{fheProgress}%</p>
                               </div>
                               <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${fheProgress}%` }}
                                    className="h-full bg-amber shadow-[0_0_10px_rgba(245,166,35,0.5)]"
                                  />
                               </div>
                            </div>
                          )}
                          {fheError && (
                            <div className="flex flex-col gap-2">
                               <p className="font-mono text-[9px] text-red uppercase tracking-widest px-2 py-1 bg-red/10 border border-red/20 rounded">CRITICAL_BOOT_ERROR: {fheError.slice(0, 40)}...</p>
                               <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="h-8 text-[9px] text-amber">REBOOT_TERMINAL</Button>
                            </div>
                          )}
                        </div>
                     )
                   )}
                </div>

                <div className="grid grid-cols-2 gap-10 border-t border-white/10 pt-12 pr-6">
                   <div className="space-y-3">
                      <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest opacity-30 font-bold">Identity Status</p>
                      <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
                        <div className={cn("w-2 h-2 rounded-full", isMember ? "bg-jade animate-pulse" : "bg-red")} />
                        <p className="font-mono text-[10px] font-black text-text-primary uppercase tracking-widest">{isMember ? "Validated Agent" : "Unverified Guest"}</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest opacity-30 font-bold">Node Security</p>
                      <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
                         <Shield size={12} className="text-amber" />
                         <p className="font-mono text-[10px] font-black text-amber uppercase tracking-widest italic">Enc_V2.4 Active</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {!isConnected && (
              <Button onClick={connect} className="w-full py-10 mt-10 rounded-3xl bg-amber text-bg-primary font-black text-sm tracking-[0.3em] hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(245,166,35,0.2)]">
                BOOT TERMINAL INTERFACE
              </Button>
            )}
          </CyberCard>
        </div>

        {/* Right: Operations Console */}
        <div className="lg:col-span-7 space-y-8">
          {(!isConnected || isMember === false) ? (
            <AdmissionTerminal address={address} onEnlist={() => checkMembership()} />
          ) : (
            <CyberCard className="p-0 overflow-hidden bg-black/40 border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.4)]">
              <div className="grid grid-cols-4 border-b border-white/10">
                 {[
                   { id: 'deposit', label: 'Inbound', icon: ArrowDownLeft, color: 'text-jade' },
                   { id: 'withdraw', label: 'Outbound', icon: ArrowUpRight, color: 'text-red' },
                   { id: 'transfer', label: 'Shielded', icon: Send, color: 'text-amber' },
                   { id: 'swap', label: 'Swap', icon: Coins, color: 'text-white' }
                 ].map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={cn(
                       "py-8 flex flex-col items-center gap-3 transition-all relative group",
                       activeTab === tab.id ? "bg-white/5" : "hover:bg-white/[0.03] opacity-30 hover:opacity-100"
                     )}
                   >
                      <tab.icon size={22} className={cn(tab.color, "transition-transform group-hover:scale-125 duration-500", activeTab === tab.id && "drop-shadow-[0_0_8px_currentColor]")} />
                      <span className="font-mono text-[10px] font-black uppercase tracking-[0.4em]">{tab.label}</span>
                      {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-6 right-6 h-1 bg-text-primary rounded-full" />}
                   </button>
                 ))}
              </div>

              <div className="p-12 space-y-10 min-h-[380px]">
                 <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, scale: 0.98, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -15 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="space-y-10"
                    >
                      {activeTab === 'swap' ? (
                         <CryptoSwapCard />
                       ) : (
                         <>
                           {activeTab === 'transfer' && (
                             <TerminalInput 
                               variant="amber"
                               label="Recipient Agent Core Hash"
                               placeholder="0x..."
                               value={transferRecipient}
                               onChange={e => setTransferRecipient(e.target.value)}
                             />
                           )}
                           
                           <div className="relative group">
                             <TerminalInput 
                               variant={activeTab === 'deposit' ? 'jade' : activeTab === 'withdraw' ? 'red' : 'amber'}
                               label={`${activeTab.toUpperCase()} QUANTUM (ETH)`}
                               placeholder="0.00"
                               type="number"
                               value={amount}
                               onChange={e => setAmount(e.target.value)}
                             />
                           </div>

                           <div className="pt-6">
                             <Button 
                               onClick={activeTab === 'deposit' ? handleDeposit : activeTab === 'withdraw' ? handleWithdraw : handleTransfer}
                               disabled={txLoading || !amount || (activeTab === 'transfer' && !transferRecipient)}
                               className={cn(
                                 "w-full py-10 rounded-3xl font-black text-base tracking-[0.4em] shadow-2xl hover:scale-[1.02] transition-all duration-300 active:scale-95 group",
                                 activeTab === 'deposit' ? "bg-jade text-bg-primary shadow-jade/20" : activeTab === 'withdraw' ? "bg-red text-bg-primary shadow-red/20" : "bg-amber text-bg-primary shadow-amber/20"
                               )}
                             >
                               <div className="flex items-center gap-4">
                                 {txLoading ? <RefreshCw className="animate-spin" size={20} /> : <div className="p-2 border border-black/20 rounded-full group-hover:rotate-12 transition-transform"><Cpu size={16} /></div>}
                                 {txLoading ? "AUTHORIZING_ENCLAVE..." : `CONFIRM ${activeTab.toUpperCase()}_LINK`}
                               </div>
                             </Button>
                             {error && <p className="mt-6 font-mono text-[11px] text-red-500 font-bold uppercase text-center animate-pulse tracking-widest bg-red-500/5 p-3 rounded-lg border border-red-500/10">{error}</p>}
                           </div>
                         </>
                       )}
                    </motion.div>
                 </AnimatePresence>
              </div>
            </CyberCard>
          )}

          <div className="grid grid-cols-2 gap-8">
             <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 text-text-muted uppercase font-mono text-[9px] font-bold tracking-[0.3em] opacity-60"><History size={14} className="text-jade" /> Last Operations</div>
                <div className="space-y-3">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-jade/20 w-3/4" /></div>
                  <div className="h-1.5 w-4/5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-jade/20 w-1/2" /></div>
                </div>
             </div>
             <div className="p-8 bg-amber/5 border border-amber/10 rounded-3xl group cursor-help transition-all hover:bg-amber/[0.08]">
                <div className="flex items-center gap-3 text-amber uppercase font-mono text-[9px] font-bold tracking-[0.3em]"><Lock size={14} className="animate-pulse" /> Privacy Enclave</div>
                <p className="font-mono text-[10px] text-text-muted mt-3 leading-relaxed opacity-60 uppercase font-black tracking-tighter">Homomorphic subtraction ensures transaction parity without data leakage.</p>
             </div>
          </div>
        </div>
      </div>

      {/* ─── Row 3: Operation Logs ─── */}
      <section className="space-y-6 pt-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-jade/10 rounded-lg"><Activity size={18} className="text-jade" /></div>
              <h3 className="font-display font-black text-xl text-text-primary uppercase tracking-tighter">System Log Output</h3>
           </div>
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-jade/5 rounded-full border border-jade/20 text-[9px] font-mono text-jade font-black tracking-widest animate-pulse">
               STABLE_LINK_V2
             </div>
             <div className="w-2 h-2 rounded-full bg-jade" />
           </div>
        </div>
        <TerminalLog ref={logRef} className="h-[280px] border-white/10 bg-black/60 shadow-[0_32px_120px_rgba(0,0,0,0.6)] rounded-3xl" />
      </section>

    </div>
  )
}
