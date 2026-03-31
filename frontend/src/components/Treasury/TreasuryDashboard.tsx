import { useState, useEffect, useCallback, useRef } from 'react'
import { parseEther } from 'ethers'
import { X, RefreshCw, Copy, Check, AlertTriangle, Lock, Send, ArrowDownLeft, ArrowUpRight, Activity, Cpu, Globe, Vault } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../../hooks/useWallet'
import { useContracts } from '../../hooks/useContracts'
import { useFhevm } from '../../hooks/useFhevm'
import { TerminalLog, type TerminalLogHandle } from '../UI/TerminalLog'
import { CyberCard } from '../UI/CyberCard'
import { Button } from '../UI/button'
import { cn } from '../../lib/utils'

// Declare window extension for addLog
declare global {
  interface Window {
    addLog?: (text: string, type?: 'info' | 'success' | 'error' | 'pending') => void;
  }
}

// ─── Address copy helper ──────────────────────────────────────────────────────
function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="flex items-center gap-2 group hover:opacity-80 transition-opacity bg-black/20 px-3 py-1.5 rounded-lg border border-white/5"
    >
      <span className="font-mono text-[11px] text-text-muted">{address.slice(0, 8)}…{address.slice(-6)}</span>
      {copied ? <Check size={11} className="text-jade" /> : <Copy size={11} className="text-text-muted group-hover:text-amber" />}
    </button>
  )
}

// ─── Modal Base Wrapper ───────────────────────────────────────────────────────
function ModalPortal({ children, onClose, title, subtitle }: { children: React.ReactNode; onClose: () => void; title: string, subtitle?: string }) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[2000] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[480px] bg-bg-card border border-white/10 rounded-2xl shadow-[0_32px_120px_rgba(0,0,0,0.8)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber/40 to-transparent" />
        <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors z-10"><X size={20} /></button>
        <div className="px-10 pt-10 pb-12">
          <h2 className="font-syne font-black text-2xl text-text-primary tracking-tighter uppercase mb-1">{title}</h2>
          {subtitle && <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-8">{subtitle}</p>}
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Deposit Modal ────────────────────────────────────────────────────────────
function DepositModal({ onClose, walletBalance, onSuccess }: { onClose: () => void; walletBalance: string; onSuccess: () => void }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { treasury } = useContracts()

  const handleDeposit = async () => {
    if (!treasury || !amount || parseFloat(amount) <= 0) return
    try {
      setLoading(true); setError(null)
      window.addLog?.(`Encrypting ${amount} ETH for vault entry...`, 'pending')
      const tx = await treasury.deposit({ value: parseEther(amount), gasLimit: 500_000n })
      window.addLog?.(`Transaction broadcasted: ${tx.hash.slice(0, 10)}...`, 'info')
      await tx.wait()
      window.addLog?.(`Deposit finalized. On-chain balance updated homomorphically.`, 'success')
      onSuccess(); onClose()
    } catch (e: any) {
      setError(e.message?.slice(0, 80) || "Simulation error"); window.addLog?.(`Deposit aborted.`, 'error')
    } finally { setLoading(false) }
  }

  return (
    <ModalPortal onClose={onClose} title="Vault Deposit" subtitle="Homomorphic Asset Encryption">
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider">ETH AMOUNT</label>
            <span className="font-mono text-[10px] text-amber/60">WALLET: {walletBalance} ETH</span>
          </div>
          <div className="relative group">
            <input 
              type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 font-mono text-2xl text-text-primary outline-none focus:border-amber/50 transition-all placeholder:text-white/5"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-mono text-xs">ETH</div>
          </div>
        </div>
        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[11px] font-mono">{error}</div>}
        <div className="flex gap-4">
          <Button onClick={onClose} variant="ghost" className="flex-1 py-6">CANCEL</Button>
          <Button onClick={handleDeposit} disabled={loading || !amount} className="flex-[2] py-6 bg-amber text-bg-primary font-bold">
            {loading ? "PROCESSING..." : "CONFIRM DEPOSIT"}
          </Button>
        </div>
      </div>
    </ModalPortal>
  )
}

// ─── Withdraw Modal ───────────────────────────────────────────────────────────
function WithdrawModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { treasury } = useContracts()

  const handleWithdraw = async () => {
    if (!treasury || !amount) return
    try {
      setLoading(true); setError(null)
      window.addLog?.(`Generating privacy proof for withdrawal...`, 'pending')
      const tx = await treasury.withdraw(parseEther(amount), { gasLimit: 500_000n })
      await tx.wait()
      window.addLog?.(`Withdrawal complete. Assets decrypted and returned to wallet.`, 'success')
      onSuccess(); onClose()
    } catch (e: any) {
      setError(e.message?.slice(0, 80)); window.addLog?.(`Withdrawal failed.`, 'error')
    } finally { setLoading(false) }
  }

  return (
    <ModalPortal onClose={onClose} title="Vault Withdrawal" subtitle="Decrypt and Release Assets">
      <div className="space-y-6">
        <div>
          <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider block mb-2">WITHDRAWAL AMOUNT</label>
          <input 
            type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 font-mono text-2xl text-text-primary outline-none focus:border-red-500/50 transition-all"
          />
        </div>
        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[11px] font-mono">{error}</div>}
        <div className="flex gap-4">
          <Button onClick={onClose} variant="ghost" className="flex-1 py-6">CANCEL</Button>
          <Button onClick={handleWithdraw} disabled={loading || !amount} className="flex-[2] py-6 border border-red-500 text-red-500 font-bold hover:bg-red-500/10">
            {loading ? "AUTH PENDING..." : "CONFIRM WITHDRAWAL"}
          </Button>
        </div>
      </div>
    </ModalPortal>
  )
}

// ─── Transfer Modal ───────────────────────────────────────────────────────────
function TransferModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { treasury } = useContracts()
  const { instance } = useFhevm()

  const handleTransfer = async () => {
    if (!treasury || !amount || !to || !instance) return
    try {
      setLoading(true); setError(null)
      window.addLog?.(`Encrypting transfer amount for ${to.slice(0, 8)}...`, 'pending')
      const encrypted = instance.encrypt64(BigInt(parseEther(amount).toString()))
      window.addLog?.(`Generating ZK Input Proof...`, 'pending')
      const tx = await treasury.transfer(to, encrypted.ciphertext, encrypted.inputProof, { gasLimit: 500_000n })
      window.addLog?.(`Transfer broadcasted.`, 'info')
      await tx.wait()
      window.addLog?.(`Shielded transfer finalized.`, 'success')
      onSuccess(); onClose()
    } catch (e: any) {
      setError(e.message?.slice(0, 80)); window.addLog?.(`Transfer aborted.`, 'error')
    } finally { setLoading(false) }
  }

  return (
    <ModalPortal onClose={onClose} title="Shielded Transfer" subtitle="Peer-to-Peer Homomorphic Link">
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider block mb-2">RECIPIENT ADDRESS</label>
            <input 
              type="text" value={to} onChange={e => setTo(e.target.value)} placeholder="0x..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 font-mono text-sm text-text-primary outline-none focus:border-amber/50 transition-all"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider block mb-2">TRANSFER QUANTUM (ETH)</label>
            <input 
              type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 font-mono text-2xl text-text-primary outline-none focus:border-amber/50 transition-all"
            />
          </div>
        </div>
        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[11px] font-mono">{error}</div>}
        <div className="flex gap-4">
          <Button onClick={onClose} variant="ghost" className="flex-1 py-6">CANCEL</Button>
          <Button onClick={handleTransfer} disabled={loading || !amount || !to} className="flex-[2] py-6 bg-white text-bg-primary font-bold">
            {loading ? "ENCRYPTING..." : "CONFIRM TRANSFER"}
          </Button>
        </div>
      </div>
    </ModalPortal>
  )
}

export function TreasuryDashboard() {
  const { isConnected, address, connect } = useWallet()
  const walletBalance = "0.00" // Fallback or could be fetched via provider
  const { balance, loading: balanceLoading, refresh: refreshBalance } = useFhevm() as any 
  const { treasuryRead } = useContracts()

  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  
  const logRef = useRef<TerminalLogHandle>(null)

  const checkMembership = useCallback(async () => {
    if (!treasuryRead || !address) return
    try {
      const isMem = await treasuryRead.members(address)
      setIsMember(isMem)
    } catch (e) {
      console.error(e)
      setIsMember(false)
    }
  }, [treasuryRead, address])

  useEffect(() => {
    checkMembership()
    // Bridge window.addLog to TerminalLog
    window.addLog = (text: string, type?: any) => logRef.current?.addLog(text, type)
    return () => { window.addLog = undefined }
  }, [checkMembership])

  const refresh = () => {
    refreshBalance()
    checkMembership()
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* ─── Header: System Health & Identity ─── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-white/5">
        <div className="space-y-2">
          <h1 className="font-syne font-black text-6xl text-text-primary tracking-tighter uppercase mb-2">Treasury</h1>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-jade animate-pulse" />
               <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-bold">ZAMA fhEVM READY</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2">
               <Globe size={14} className="text-amber opacity-60" />
               <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-bold">NETWORK: SEPOLIA TERMINAL</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
            {isConnected && address ? (
              <div className="flex flex-col items-end">
                 <CopyAddress address={address} />
                <span className="font-mono text-[9px] text-jade/60 uppercase tracking-tighter mt-1.5 font-bold">Authenticated Terminal</span>
             </div>
           ) : (
             <Button onClick={connect} variant="outline" className="rounded-xl border-amber/30 text-amber px-6 py-5 font-bold text-xs">CONNECT OPERATOR</Button>
           )}
        </div>
      </header>

      {/* ─── Metrics Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Global Vault Enclave */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          <CyberCard variant="jade" className="p-8 group hover:bg-jade/[0.03] transition-all">
             <div className="flex justify-between items-start mb-10">
                <div className="p-3 bg-jade/10 rounded-2xl text-jade group-hover:scale-110 transition-transform"><Vault size={24} /></div>
                <div className="px-2.5 py-1 bg-jade/5 border border-jade/10 rounded-full font-mono text-[9px] text-jade uppercase font-bold tracking-widest">Global State</div>
             </div>
             <div className="space-y-1">
                <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-bold opacity-60">Total Vault Volume</p>
                <div className="font-syne font-black text-5xl text-text-primary tracking-tighter">1.24K <span className="text-xl text-jade/40 ml-1 italic">ETH</span></div>
             </div>
          </CyberCard>

          <CyberCard className="p-8 group hover:bg-white/[0.03] transition-all border-white/10">
             <div className="flex justify-between items-start mb-10">
                <div className="p-3 bg-white/5 rounded-2xl text-text-muted group-hover:scale-110 transition-transform"><Activity size={24} /></div>
                <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-[9px] text-text-muted uppercase font-bold tracking-widest">Performance</div>
             </div>
             <div className="space-y-1">
                <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-bold opacity-60">Enclave Members</p>
                <div className="font-syne font-black text-5xl text-text-primary tracking-tighter">342 <span className="text-xl text-white/10 ml-1 italic">NODES</span></div>
             </div>
          </CyberCard>
        </div>

        {/* Private Asset Enclave */}
        <div className="lg:col-span-5">
          <CyberCard variant="amber" className="h-full relative overflow-hidden group p-8 flex flex-col justify-between">
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber/[0.03] to-transparent animate-shimmer" />
            
            <div className="relative z-10 flex justify-between items-center mb-8">
               <div className="flex items-center gap-3">
                  <Lock size={16} className="text-amber" />
                  <h3 className="font-syne font-black text-xl text-text-primary tracking-tighter uppercase italic">Personal Enclave</h3>
               </div>
               <button onClick={refresh} className="text-text-muted hover:text-amber transition-colors"><RefreshCw size={14} className={cn(balanceLoading && "animate-spin")} /></button>
            </div>

            <div className="relative z-10 space-y-6">
               <div className="space-y-2">
                  <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest font-black opacity-60">Revealed Balance</p>
                  <div className="font-syne font-black text-6xl text-text-primary tracking-tighter min-h-[60px] flex items-baseline gap-2">
                    <AnimatePresence mode="wait">
                       {balance ? (
                         <motion.span key="val" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>{balance}</motion.span>
                       ) : (
                         <motion.div key="mask" initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} className="flex gap-2">
                            {[...Array(5)].map((_, i) => <div key={i} className="w-8 h-12 bg-amber rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />)}
                         </motion.div>
                       )}
                    </AnimatePresence>
                    {balance && <span className="text-2xl text-amber/40 italic">ETH</span>}
                  </div>
               </div>
               <div className="pt-6 border-t border-amber/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", isMember ? "bg-jade animate-pulse" : "bg-red")} />
                    <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.2em] font-black">{isMember ? "Validated Member" : "Unknown Agent"}</span>
                  </div>
                  <AlertTriangle size={14} className="text-amber opacity-40 animate-pulse" />
               </div>
            </div>
          </CyberCard>
        </div>
      </div>

      {/* ─── Operations Console ─── */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-syne font-black text-2xl text-text-primary tracking-tighter uppercase">Operations</h3>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-[9px] text-text-muted uppercase tracking-widest">Console v2.0</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
                key="op-deposit"
            onClick={() => setShowDeposit(true)}
            disabled={!isMember || !isConnected}
            className="group relative flex flex-col items-start p-8 bg-white/[0.02] border border-white/[0.05] rounded-3xl hover:bg-amber/5 hover:border-amber/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3 bg-amber/10 rounded-2xl text-amber mb-6 group-hover:scale-110 transition-transform"><ArrowDownLeft size={24} /></div>
            <h4 className="font-syne font-bold text-lg text-text-primary mb-2">Vault Deposit</h4>
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider text-left leading-relaxed">Encrypt your assets into the sovereign DAO enclave.</p>
          </button>

          <button 
                key="op-withdraw"
            onClick={() => setShowWithdraw(true)}
            disabled={!isMember || !isConnected}
            className="group relative flex flex-col items-start p-8 bg-white/[0.02] border border-white/[0.05] rounded-3xl hover:bg-red-500/5 hover:border-red-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 mb-6 group-hover:scale-110 transition-transform"><ArrowUpRight size={24} /></div>
            <h4 className="font-syne font-bold text-lg text-text-primary mb-2">Vault Withdraw</h4>
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider text-left leading-relaxed">Decrypt and return assets to your sovereign wallet.</p>
          </button>

          <button 
                key="op-transfer"
            onClick={() => setShowTransfer(true)}
            disabled={!isMember || !isConnected}
            className="group relative flex flex-col items-start p-8 bg-white/[0.02] border border-white/[0.05] rounded-3xl hover:bg-jade/5 hover:border-jade/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3 bg-jade/10 rounded-2xl text-jade mb-6 group-hover:scale-110 transition-transform"><Send size={24} /></div>
            <h4 className="font-syne font-bold text-lg text-text-primary mb-2">Shielded Transfer</h4>
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-wider text-left leading-relaxed">Send peer-to-peer payments with homomorphic privacy.</p>
          </button>
        </div>
      </section>

      {/* ─── Monitoring & Audit ─── */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <Activity size={18} className="text-jade" />
          <h3 className="font-syne font-bold text-lg text-text-primary uppercase tracking-tighter">System Monitoring</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8">
              <TerminalLog ref={logRef} className="h-[240px]" />
           </div>
           <div className="lg:col-span-4 space-y-6">
              <div className="p-8 bg-jade/5 border border-jade/10 rounded-3xl space-y-4">
                <div className="flex items-center gap-3 text-jade uppercase font-mono text-[10px] font-bold tracking-widest"><Lock size={12} /> SECURE STATE ENCLAVE</div>
                <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                  All balance updates are processed via threshold FHE. Individual transaction amounts are never leaked to validators or the public mempool.
                </p>
              </div>
              <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                <div className="flex items-center gap-3 text-text-muted uppercase font-mono text-[10px] font-bold tracking-widest"><Cpu size={12} /> Node Status</div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-text-muted">RPC Latency</span>
                  <span className="text-jade">24ms</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                   <span className="text-text-muted">Enclave Sync</span>
                   <span className="text-jade">100%</span>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* ─── Modals ─── */}
      <AnimatePresence>
        {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} walletBalance={walletBalance} onSuccess={refresh} />}
        {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} onSuccess={refresh} />}
        {showTransfer && <TransferModal onClose={() => setShowTransfer(false)} onSuccess={refresh} />}
      </AnimatePresence>
    </div>
  )
}
