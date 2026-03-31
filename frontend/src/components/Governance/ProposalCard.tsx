import { useState } from 'react'
import { StatusBadge } from '../UI/StatusBadge'
import { AddressDisplay } from '../UI/AddressDisplay'
import { VoteModal } from './VoteModal'

export interface Proposal {
  id: number
  description: string
  proposer: string
  status: 'Active' | 'Passed' | 'Failed' | 'PendingDecryption'
  yesCount: number | null
  noCount: number | null
  votingEnd: number
  currentBlock: number
}

const BORDER: Record<string, string> = {
  Active:            'var(--amber)',
  PendingDecryption: 'var(--amber)',
  Passed:            'var(--jade)',
  Failed:            'var(--red)',
}

export function ProposalCard({ proposal, onFinalize }: { proposal: Proposal; onFinalize?: (id: number) => void }) {
  const [showVote, setShowVote] = useState(false)
  const revealed = proposal.yesCount !== null && proposal.noCount !== null
  const total = revealed ? (proposal.yesCount! + proposal.noCount!) || 1 : 1
  const yesWidth = revealed ? Math.round((proposal.yesCount! / total) * 100) : 0
  const noWidth  = revealed ? Math.round((proposal.noCount!  / total) * 100) : 0
  const blocksLeft = proposal.votingEnd - proposal.currentBlock
  const canFinalize = proposal.status === 'Active' && blocksLeft <= 0

  return (
    <>
      <div
        className="rounded-lg p-5 mb-4 transition-colors"
        style={{
          background: 'var(--bg-card)',
          border: `1px solid var(--border)`,
          borderLeft: `3px solid ${BORDER[proposal.status]}`,
        }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              #{proposal.id}
            </span>
            <StatusBadge status={proposal.status} />
          </div>
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {blocksLeft > 0 ? `${blocksLeft} blocks left` : 'Voting closed'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
          {proposal.description}
        </h3>

        {/* Vote bars */}
        <div className="mb-4">
          <p className="text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--text-muted)' }}>
            VOTES ARE ENCRYPTED UNTIL PROPOSAL CLOSES
          </p>
          <div className="space-y-2">
            {/* YES */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono w-6" style={{ color: 'var(--jade)' }}>YES</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
                {revealed ? (
                  <div className="h-2 rounded-full" style={{ width: `${yesWidth}%`, background: 'var(--jade)', transition: 'width 1s ease-out' }} />
                ) : (
                  <div className="h-2 rounded-full encrypted-value" style={{ width: '60%' }} />
                )}
              </div>
              <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--jade)' }}>
                {revealed ? proposal.yesCount : '████'}
              </span>
            </div>
            {/* NO */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono w-6" style={{ color: 'var(--red)' }}>NO</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
                {revealed ? (
                  <div className="h-2 rounded-full" style={{ width: `${noWidth}%`, background: 'var(--red)', transition: 'width 1s ease-out' }} />
                ) : (
                  <div className="h-2 rounded-full encrypted-value" style={{ width: '40%' }} />
                )}
              </div>
              <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--red)' }}>
                {revealed ? proposal.noCount : '████'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <AddressDisplay address={proposal.proposer} />
          <div className="flex gap-2">
            {proposal.status === 'Active' && blocksLeft > 0 && (
              <button
                onClick={() => setShowVote(true)}
                className="px-3 py-1.5 rounded font-mono text-xs tracking-widest hover:opacity-80"
                style={{ color: 'var(--amber)', border: '1px solid var(--amber)', background: 'transparent' }}
              >
                VOTE
              </button>
            )}
            {canFinalize && onFinalize && (
              <button
                onClick={() => onFinalize(proposal.id)}
                className="px-3 py-1.5 rounded font-mono text-xs tracking-widest hover:opacity-80"
                style={{ background: 'var(--amber)', color: '#0A0B0D', fontWeight: 700 }}
              >
                FINALIZE
              </button>
            )}
          </div>
        </div>
      </div>

      {showVote && <VoteModal proposalId={proposal.id} onClose={() => setShowVote(false)} />}
    </>
  )
}
