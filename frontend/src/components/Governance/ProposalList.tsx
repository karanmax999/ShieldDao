import { useState, useEffect } from 'react'
import { ProposalCard, type Proposal } from './ProposalCard'
import { CreateProposal } from './CreateProposal'
import { useContracts } from '../../hooks/useContracts'
import { useWallet } from '../../hooks/useWallet'
import { CONTRACTS } from '../../config/contracts'

// MOCK DATA — replace with contract reads (ProposalCreated event scan + proposals() calls)
const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 1,
    description: 'Fund dev grant for Q1 2025 — 0.1 ETH to core contributors',
    proposer: CONTRACTS.treasury.address,
    status: 'Active',
    yesCount: null,
    noCount: null,
    votingEnd: 9999999,
    currentBlock: 10539615,
  },
  {
    id: 2,
    description: 'Upgrade fhEVM coprocessor to v2 — zero-downtime migration plan',
    proposer: CONTRACTS.treasury.address,
    status: 'Passed',
    yesCount: 3,
    noCount: 0,
    votingEnd: 10539500,
    currentBlock: 10539615,
  },
  {
    id: 3,
    description: 'Reject external audit firm proposal — conflict of interest identified',
    proposer: CONTRACTS.treasury.address,
    status: 'Failed',
    yesCount: 1,
    noCount: 4,
    votingEnd: 10539400,
    currentBlock: 10539615,
  },
]

export function ProposalList() {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS)
  const [showCreate, setShowCreate] = useState(false)
  const [currentBlock, setCurrentBlock] = useState(10539615)
  const { governance } = useContracts()
  const { provider, isConnected } = useWallet()

  useEffect(() => {
    if (!provider) return
    provider.getBlockNumber().then(setCurrentBlock).catch(() => {})
  }, [provider])

  const handleFinalize = async (id: number) => {
    if (!governance) return
    try {
      const tx = await governance.finalizeProposal(id)
      await tx.wait()
      setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'PendingDecryption' } : p))
    } catch (e) { console.error(e) }
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-5xl mb-2" style={{ color: 'var(--text-primary)' }}>
            GOVERNANCE
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Homomorphic vote tallying — individual votes permanently private
          </p>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-3 rounded font-mono text-sm tracking-widest font-bold hover:opacity-80"
            style={{ background: 'var(--amber)', color: '#0A0B0D' }}
          >
            + NEW PROPOSAL
          </button>
        )}
      </div>

      {proposals.map(p => (
        <ProposalCard
          key={p.id}
          proposal={{ ...p, currentBlock }}
          onFinalize={handleFinalize}
        />
      ))}

      {showCreate && <CreateProposal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
