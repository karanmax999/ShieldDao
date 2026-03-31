import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Lock, CheckCircle, XCircle, Clock, RefreshCw, Plus, X, Shield } from 'lucide-react'
import { Contract } from 'ethers'
import { CONTRACTS } from '../config/contracts'
import { useWallet } from '../hooks/useWallet'
import { useContracts } from '../hooks/useContracts'
import { useFhevm } from '../hooks/useFhevm'
import { useDAO } from '../context/DAOContext'
import { CyberCard } from '../components/UI/CyberCard'
import { TerminalInput } from '../components/UI/TerminalInput'
import { Button } from '../components/UI/button'
import { cn } from '../lib/utils'

interface Proposal {
  id: number
  title: string
  description: string
  proposer: string
  status: 'Active' | 'PendingDecryption' | 'Passed' | 'Failed'
  yesCount: number | null
  noCount: number | null
  votingEnd: number
  currentBlock: number
}

const STATUS_CONFIG = {
  Active:            { bg: 'bg-amber/10',  text: 'text-amber', border: 'border-amber/20', Icon: Clock,        label: 'ACTIVE' },
  PendingDecryption: { bg: 'bg-amber/5',   text: 'text-amber', border: 'border-amber/10', Icon: Clock,        label: 'DECRYPTING' },
  Passed:            { bg: 'bg-jade/10',   text: 'text-jade',  border: 'border-jade/20',  Icon: CheckCircle,  label: 'PASSED' },
  Failed:            { bg: 'bg-red/10',    text: 'text-red',   border: 'border-red/20',   Icon: XCircle,      label: 'FAILED' },
}

function CreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { governance } = useContracts()

  const submit = async () => {
    if (!governance || !desc.trim()) return
    try {
      setLoading(true); setError(null)
      const tx = await governance.propose(desc, '0x0000000000000000000000000000000000000000', '0x', 0, { gasLimit: 400_000n })
      if (tx.hash) setTxHash(tx.hash)
      await tx.wait()
      onSuccess(); onClose()
    } catch (e: any) {
      setError(e.message?.slice(0, 80) || 'Proposal failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg">
        <CyberCard variant="amber">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-bold text-xl text-text-primary uppercase tracking-tight">Generate Proposal</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X size={20} /></button>
          </div>
          <div className="space-y-6">
            <TerminalInput label="Proposal Objective" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Enter mission description..." />
            {error && <p className="font-mono text-[10px] text-red uppercase animate-pulse">{error}</p>}
            {txHash && <p className="font-mono text-[10px] text-jade uppercase">Tx: {txHash.slice(0, 10)}...</p>}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>CANCEL</Button>
              <Button className="flex-[2] bg-amber text-bg-primary font-bold" onClick={submit} disabled={loading || !desc.trim()}>
                {loading ? 'TRANSMITTING...' : 'INITIALIZE PROPOSAL'}
              </Button>
            </div>
          </div>
        </CyberCard>
      </motion.div>
    </div>
  )
}

function VoteModal({ proposalId, onClose, onSuccess }: { proposalId: number; onClose: () => void; onSuccess: () => void }) {
  const [vote, setVote] = useState<'yes' | 'no' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { governance } = useContracts()
  const { address } = useWallet()
  const { instance: fhevm, ready: fhevmReady } = useFhevm()

  const submit = async () => {
    if (!governance || vote === null || !address || !fhevmReady || !fhevm) return
    try {
      setLoading(true); setError(null)
      const govAddress = await governance.getAddress()
      const input = fhevm.createEncryptedInput(govAddress, address)
      input.addBool(vote === 'yes')
      const encrypted = await input.encrypt()

      const tx = await governance.castVote(proposalId, encrypted.handles[0], encrypted.inputProof, { gasLimit: 500_000n })
      await tx.wait()
      onSuccess(); onClose()
    } catch (e: any) {
      setError(e.message?.slice(0, 80) || 'Voting failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <CyberCard variant="amber">
          <h2 className="font-display font-bold text-xl text-text-primary mb-2 uppercase tracking-tight text-center">Cast Encrypted Vote</h2>
          <p className="font-mono text-[10px] text-text-muted text-center mb-8 uppercase tracking-widest">Proposal #{proposalId}</p>
          
          <div className="flex gap-4 mb-8">
            <button onClick={() => setVote('yes')} className={cn("flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2", vote === 'yes' ? 'bg-jade/10 border-jade text-jade shadow-[0_0_20px_rgba(46,204,113,0.2)]' : 'bg-white/5 border-white/5 text-text-muted')}>
              <CheckCircle size={24} /> <span className="font-bold">YES</span>
            </button>
            <button onClick={() => setVote('no')} className={cn("flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2", vote === 'no' ? 'bg-red/10 border-red text-red shadow-[0_0_20px_rgba(231,76,60,0.2)]' : 'bg-white/5 border-white/5 text-text-muted')}>
              <XCircle size={24} /> <span className="font-bold">NO</span>
            </button>
          </div>
          <div className="p-4 rounded-xl bg-amber/5 border border-amber/10 flex items-start gap-3 mb-6">
            <Shield size={16} className="text-amber mt-1 flex-shrink-0" />
            <p className="font-mono text-[10px] text-amber/70 leading-relaxed uppercase tracking-wider">
              Homomorphic encryption ensures your individual vote direction remains mathematically unobservable throughout the lifecycle.
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button variant="outline" className={cn("flex-1", vote === 'yes' && "border-jade text-jade")} onClick={() => setVote('yes')}>YES</Button>
              <Button variant="outline" className={cn("flex-1", vote === 'no' && "border-red text-red")} onClick={() => setVote('no')}>NO</Button>
            </div>
            {error && <p className="font-mono text-[10px] text-red uppercase animate-pulse">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1 text-text-muted" onClick={onClose}>CANCEL</Button>
              <Button className="flex-[2] bg-amber text-bg-primary font-bold" onClick={submit} disabled={loading || vote === null || !fhevmReady}>
                {loading ? 'ENCRYPTING...' : 'SIGN & SUBMIT'}
              </Button>
            </div>
          </div>
        </CyberCard>
      </motion.div>
    </div>
  )
}

function ProposalCard({ p, currentBlock, onRefresh }: { p: Proposal; currentBlock: number; onRefresh: () => void }) {
  const [showVote, setShowVote] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const { governance } = useContracts()
  const { isConnected } = useWallet()

  const sc = STATUS_CONFIG[p.status]
  const StatusIcon = sc.Icon
  const total = (p.yesCount ?? 0) + (p.noCount ?? 0)
  const yesPct = total > 0 ? Math.round(((p.yesCount ?? 0) / total) * 100) : 0
  const noPct  = total > 0 ? Math.round(((p.noCount  ?? 0) / total) * 100) : 0
  const blocksLeft = p.votingEnd - currentBlock

  const finalize = async () => {
    if (!governance) return
    try {
      setLoading('finalize'); await (await governance.finalizeProposal(p.id, { gasLimit: 400_000n })).wait()
      onRefresh()
    } catch { setLoading(null) }
  }

  return (
    <CyberCard className={cn("transition-all border-l-4", sc.border)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-text-muted">#{String(p.id).padStart(3, '0')}</span>
          <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-mono tracking-widest", sc.bg, sc.text, sc.border)}>
            <StatusIcon size={11} /> {sc.label}
          </div>
        </div>
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
           {p.status === 'Active' ? (blocksLeft > 0 ? `${blocksLeft} Blocks Remaining` : 'Voting Concluded') : 'Closed'}
        </span>
      </div>

      <h3 className="font-display font-bold text-lg text-text-primary mb-2 leading-tight uppercase tracking-tight">{p.title}</h3>
      <p className="font-mono text-[11px] text-text-muted mb-8 uppercase tracking-wide truncate">Proposer: {p.proposer}</p>

      <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-2 text-amber">
            <Lock size={12} />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em]">Privacy Shield: Active</span>
          </div>
          <span className="font-mono text-[10px] text-text-muted uppercase">{total} Votes Total</span>
        </div>

        <div className="space-y-4">
          {[{ label: 'YES', pct: yesPct, color: 'bg-jade', text: 'text-jade' }, { label: 'NO', pct: noPct, color: 'bg-red', text: 'text-red' }].map(bar => (
            <div key={bar.label} className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px]">
                <span className={bar.text}>{bar.label}</span>
                <span className="text-text-muted">{p.status === 'Active' ? '███' : (bar.pct + '%')}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${p.status === 'Active' ? 50 : bar.pct}%` }} className={cn("h-full", p.status === 'Active' ? 'bg-amber/20' : bar.color)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Clock size={12} className="text-text-muted" />
           <span className="font-mono text-[9px] text-text-muted uppercase">Terminal: {p.votingEnd}</span>
        </div>
        
        {isConnected && (
          <div className="flex gap-3">
             {p.status === 'Active' && blocksLeft > 0 && (
               <Button onClick={() => setShowVote(true)} className="bg-jade/10 border-jade/50 text-jade hover:bg-jade/20 px-6 font-bold" variant="outline">VOTE</Button>
             )}
             {p.status === 'Active' && blocksLeft <= 0 && (
               <Button onClick={finalize} disabled={!!loading} className="bg-amber text-bg-primary px-6 font-black tracking-widest">{loading ? '...' : 'FINALIZE'}</Button>
             )}
          </div>
        )}
      </div>
      {showVote && <VoteModal proposalId={p.id} onClose={() => setShowVote(false)} onSuccess={onRefresh} />}
    </CyberCard>
  )
}

export default function Governance() {
  const { readProvider, isConnected } = useWallet()
  const { dao } = useDAO()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [currentBlock, setCurrentBlock] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const block = await readProvider.getBlockNumber(); setCurrentBlock(block)
      const govRead = new Contract(dao.governanceAddress, CONTRACTS.governance.abi, readProvider)
      const count = Number(await govRead.proposalCount())
      const loaded: Proposal[] = []
      for (let i = 1; i <= count; i++) {
        const p = await govRead.proposals(i)
        loaded.push({
          id: i, title: p.description || `Mission #${i}`, description: p.description, proposer: p.proposer,
          status: (Number(p.status) === 0 ? 'Active' : Number(p.status) === 1 ? 'PendingDecryption' : Number(p.status) === 2 ? 'Passed' : 'Failed'),
          yesCount: Number(p.status) >= 2 ? Number(p.yesCount) : null, noCount: Number(p.status) >= 2 ? Number(p.noCount) : null,
          votingEnd: Number(p.votingEnd), currentBlock: block
        })
      }
      setProposals(loaded.reverse())
    } catch {} finally { setLoading(false) }
  }, [readProvider, dao.governanceAddress])

  useEffect(() => { load() }, [load])

  return (
    <div className="py-8 space-y-12 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display font-black text-6xl text-text-primary tracking-tighter hover:text-amber transition-colors cursor-default mb-2 uppercase">{dao.name} Governance</h1>
          <p className="font-mono text-xs text-text-muted uppercase tracking-[0.25em]">Confidential Protocol · Zero-Knowledge Tallying</p>
        </div>
        <div className="flex gap-4">
           <Button variant="ghost" onClick={load} disabled={loading}><RefreshCw className={cn(loading && "animate-spin")} size={16} /></Button>
           {isConnected && <Button onClick={() => setShowCreate(true)} className="bg-amber text-bg-primary font-black gap-2 px-6"><Plus size={16} /> NEW MISSION</Button>}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-amber/5 border border-amber/10 flex items-start gap-4">
        <div className="p-3 rounded-full bg-amber/20"><Lock size={20} className="text-amber" /></div>
        <p className="font-mono text-sm leading-relaxed text-amber/80 uppercase">
          Autonomous encryption enforced by Zama. Individual directions are mathematically impossible to retrieve, ensuring absolute sovereign anonymity.
        </p>
      </div>

      <div className="space-y-6">
        {proposals.length === 0 && !loading && (
          <div className="py-20 text-center font-mono text-text-muted opacity-40 uppercase tracking-[0.5em]">No Missions Found</div>
        )}
        {proposals.map(p => <ProposalCard key={p.id} p={p} currentBlock={currentBlock} onRefresh={load} />)}
      </div>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSuccess={load} />}
    </div>
  )
}
