import { useState, useEffect, useCallback } from 'react'
import { formatEther, parseEther } from 'ethers'
import { Lock, X, RefreshCw, ExternalLink, Copy, Check, AlertTriangle } from 'lucide-react'
import { useWallet } from '../../hooks/useWallet'
import { useContracts } from '../../hooks/useContracts'
import { CONTRACTS } from '../../config/contracts'

// ─── Address copy helper ──────────────────────────────────────────────────────
function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#6B7A99' }}
    >
      {address.slice(0, 8)}…{address.slice(-6)}
      {copied ? <Check size={11} color="#2ECC71" /> : <Copy size={11} />}
    </button>
  )
}

// ─── Deposit Modal ────────────────────────────────────────────────────────────
function DepositModal({ onClose, walletBalance, onSuccess }: { onClose: () => void; walletBalance: string; onSuccess: () => void }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { treasury } = useContracts()

  const handleDeposit = async () => {
    if (!treasury || !amount || parseFloat(amount) <= 0) return
    try {
      setLoading(true); setError(null)
      // Use a fixed gas limit to bypass MetaMask's estimateGas which fails
      // on fhEVM contracts due to the ACL precompile not being available in simulation
      const tx = await treasury.deposit({
        value: parseEther(amount),
        gasLimit: 500_000n,
      })
      setTxHash(tx.hash)
      // Don't await tx.wait() — just show the hash and let user track on Sepolia Etherscan
      // tx.wait() can throw false "reverted" errors when the node is slow
      tx.wait().then(() => {
        onSuccess()
        onClose()
      }).catch((e: unknown) => {
        // If wait() fails, check Sepolia Etherscan — the tx may still have succeeded
        const msg = e instanceof Error ? e.message : String(e)
        if (!msg.includes('reverted')) {
          onSuccess()
          onClose()
        }
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('NotMember')) setError('Your address is not a DAO member.')
      else if (msg.includes('ZeroDeposit')) setError('Amount must be greater than 0.')
      else if (msg.includes('user rejected')) setError('Transaction rejected in MetaMask.')
      else setError('Transaction failed: ' + msg.slice(0, 100))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#161920', border: '1px solid #2A3347', borderRadius: '16px', padding: '40px', width: '460px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#3D4A63' }}><X size={18} /></button>

        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: '#E8EAF0', marginBottom: '6px' }}>DEPOSIT TO VAULT</h2>
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#6B7A99', marginBottom: '28px', lineHeight: 1.7 }}>
          Your balance is encrypted on-chain. Only you can decrypt it.
        </p>

        <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3D4A63', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>ETH AMOUNT</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.01"
          min="0"
          step="0.001"
          style={{ width: '100%', padding: '14px 16px', background: '#0A0B0D', border: '1px solid #2A3347', borderRadius: '8px', fontFamily: 'Space Mono, monospace', fontSize: '20px', color: '#E8EAF0', outline: 'none', marginBottom: '6px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3D4A63' }}>WALLET BALANCE</span>
          <button onClick={() => setAmount(walletBalance)} style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer' }}>
            MAX: {walletBalance} ETH
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '8px', marginBottom: '24px' }}>
          <Lock size={13} color="#F5A623" style={{ marginTop: '2px', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#F5A623', lineHeight: 1.8 }}>
            Amount encrypted via Zama FHE before storing on-chain. Contract owner cannot read your balance.
          </span>
        </div>

        {error && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#E74C3C', marginBottom: '12px', lineHeight: 1.6 }}>{error}</p>}
        {txHash && (
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#2ECC71', marginBottom: '12px', textDecoration: 'none' }}>
            View on Sepolia Etherscan <ExternalLink size={11} />
          </a>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #1E2330', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#6B7A99' }}>CANCEL</button>
          <button
            onClick={handleDeposit}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            style={{ flex: 2, padding: '14px', background: loading ? '#8B5E14' : '#F5A623', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0A0B0D', opacity: (!amount || parseFloat(amount) <= 0) ? 0.4 : 1, transition: 'all 150ms ease' }}
          >{loading ? 'CONFIRMING…' : 'DEPOSIT'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Withdraw Modal ───────────────────────────────────────────────────────────
function WithdrawModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { treasury } = useContracts()

  const handleWithdraw = async () => {
    if (!treasury || !amount || parseFloat(amount) <= 0) return
    try {
      setLoading(true); setError(null)
      // Fixed gas limit — fhEVM ACL writes cause estimateGas to fail in MetaMask
      const tx = await treasury.withdraw(parseEther(amount), { gasLimit: 500_000n })
      setTxHash(tx.hash)
      tx.wait().then(() => {
        onSuccess()
        onClose()
      }).catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e)
        if (!msg.includes('reverted')) { onSuccess(); onClose() }
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('NotMember')) setError('Your address is not a DAO member.')
      else if (msg.includes('user rejected')) setError('Transaction rejected in MetaMask.')
      else setError('Transaction failed: ' + msg.slice(0, 100))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#161920', border: '1px solid #2A3347', borderRadius: '16px', padding: '40px', width: '460px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#3D4A63' }}><X size={18} /></button>

        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: '#E8EAF0', marginBottom: '6px' }}>WITHDRAW FROM VAULT</h2>
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#6B7A99', marginBottom: '28px', lineHeight: 1.7 }}>
          Overflow-safe: if amount exceeds your encrypted balance, effective withdrawal is zero.
        </p>

        <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3D4A63', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>ETH AMOUNT</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.005"
          min="0"
          step="0.001"
          style={{ width: '100%', padding: '14px 16px', background: '#0A0B0D', border: '1px solid #2A3347', borderRadius: '8px', fontFamily: 'Space Mono, monospace', fontSize: '20px', color: '#E8EAF0', outline: 'none', marginBottom: '24px', boxSizing: 'border-box' }}
        />

        {error && <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#E74C3C', marginBottom: '12px', lineHeight: 1.6 }}>{error}</p>}
        {txHash && (
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#2ECC71', marginBottom: '12px', textDecoration: 'none' }}>
            View on Sepolia Etherscan <ExternalLink size={11} />
          </a>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #1E2330', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#6B7A99' }}>CANCEL</button>
          <button
            onClick={handleWithdraw}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            style={{ flex: 2, padding: '14px', background: 'transparent', border: `1px solid ${loading ? '#8B5E14' : '#F5A623'}`, borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: '#F5A623', opacity: (!amount || parseFloat(amount) <= 0) ? 0.4 : 1, transition: 'all 150ms ease' }}
          >{loading ? 'CONFIRMING…' : 'WITHDRAW'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function TreasuryDashboard() {
  const { address, readProvider, isConnected, connect, isWrongNetwork, switchToSepolia } = useWallet()
  const { treasuryRead } = useContracts()

  const [showDeposit, setShowDeposit]     = useState(false)
  const [showWithdraw, setShowWithdraw]   = useState(false)
  const [walletBalance, setWalletBalance] = useState<string>('—')
  const [vaultBalance, setVaultBalance]   = useState<string>('—')
  const [isMember, setIsMember]           = useState<boolean | null>(null)
  const [memberCount, setMemberCount]     = useState<number | null>(null)
  const [refreshing, setRefreshing]       = useState(false)
  const [lastRefresh, setLastRefresh]     = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // Wallet ETH balance — use readProvider (Infura) so it works regardless of MetaMask network
      if (address) {
        const bal = await readProvider.getBalance(address)
        setWalletBalance(parseFloat(formatEther(bal)).toFixed(4))
      }
      // Vault total ETH balance
      const vaultBal = await readProvider.getBalance(CONTRACTS.treasury.address)
      setVaultBalance(parseFloat(formatEther(vaultBal)).toFixed(4))

      // Member status — use read-only contract (bypasses MetaMask RPC)
      if (address) {
        const member = await treasuryRead.members(address)
        setIsMember(member)
      }
      // Member count — scan MemberAdded events via Infura
      try {
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
        const active = [...addedSet].filter(a => !removedSet.has(a))
        setMemberCount(active.length)
      } catch {
        setMemberCount(null)
      }
      setLastRefresh(new Date())
    } finally {
      setRefreshing(false)
    }
  }, [readProvider, address, treasuryRead])

  // Auto-refresh on connect / address change
  useEffect(() => { refresh() }, [refresh])

  const card = (children: React.ReactNode, accent?: string) => (
    <div
      style={{
        background: '#161920',
        border: `1px solid ${accent ?? '#1E2330'}`,
        borderRadius: '12px',
        padding: '24px',
        transition: 'border-color 200ms ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = accent ?? '#2A3347')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = accent ?? '#1E2330')}
    >
      {children}
    </div>
  )

  return (
    <div style={{ padding: '48px 56px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '48px', color: '#E8EAF0', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            TREASURY
          </h1>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#6B7A99', letterSpacing: '0.05em' }}>
            Encrypted member balances on Zama fhEVM · Sepolia
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'transparent', border: '1px solid #1E2330', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#6B7A99', transition: 'all 150ms ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2A3347'; e.currentTarget.style.color = '#E8EAF0' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E2330'; e.currentTarget.style.color = '#6B7A99' }}
        >
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'REFRESHING…' : 'REFRESH'}
        </button>
      </div>

      {/* Wrong network warning */}
      {isWrongNetwork && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '10px', marginBottom: '24px' }}>
          <AlertTriangle size={14} color="#E74C3C" />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#E74C3C', flex: 1 }}>
            Wrong network — MetaMask must be on Sepolia to interact with ShieldDAO
          </span>
          <button
            onClick={switchToSepolia}
            style={{ padding: '8px 16px', background: 'rgba(231,76,60,0.15)', border: '1px solid #E74C3C', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#E74C3C', fontWeight: 700 }}
          >
            SWITCH NOW
          </button>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>

        {/* YOUR BALANCE — encrypted handle */}
        {card(
          <>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3D4A63', letterSpacing: '0.12em', marginBottom: '16px' }}>YOUR BALANCE</div>
            {!isConnected ? (
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#3D4A63' }}>Connect wallet to view</div>
            ) : isMember === false ? (
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#E74C3C' }}>Not a member</div>
            ) : (
              <>
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ width: '120px', height: '32px', background: 'linear-gradient(90deg, #1E2330 25%, #F5A623 50%, #1E2330 75%)', backgroundSize: '200% auto', animation: 'shimmer 2s linear infinite', borderRadius: '6px' }} />
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#F5A623' }}>ENCRYPTED — FHE PROTECTED</div>
              </>
            )}
            <div style={{ marginTop: '12px', fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3D4A63' }}>
              WALLET: {walletBalance} ETH
            </div>
          </>
        )}

        {/* VAULT STATUS */}
        {card(
          <>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3D4A63', letterSpacing: '0.12em', marginBottom: '16px' }}>VAULT STATUS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ECC71', boxShadow: '0 0 8px rgba(46,204,113,0.6)' }} />
              <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '14px', color: '#2ECC71' }}>ACTIVE</span>
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '22px', fontWeight: 700, color: '#E8EAF0', marginBottom: '4px' }}>
              {vaultBalance} <span style={{ fontSize: '12px', color: '#6B7A99' }}>ETH</span>
            </div>
            <div style={{ marginTop: '8px' }}>
              <CopyAddress address={CONTRACTS.treasury.address} />
            </div>
            {isMember === true && (
              <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '100px' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#F5A623' }}>MEMBER ✓</span>
              </div>
            )}
          </>
        )}

        {/* TOTAL MEMBERS */}
        {card(
          <>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3D4A63', letterSpacing: '0.12em', marginBottom: '16px' }}>TOTAL MEMBERS</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '40px', fontWeight: 700, color: '#E8EAF0', marginBottom: '6px', lineHeight: 1 }}>
              {memberCount ?? '—'}
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#F5A623' }}>Protected by FHE</div>
            {lastRefresh && (
              <div style={{ marginTop: '12px', fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#3D4A63' }}>
                Updated {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      {!isConnected ? (
        <button
          onClick={connect}
          style={{ padding: '14px 32px', background: 'transparent', border: '1px solid #F5A623', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#F5A623', letterSpacing: '0.05em', transition: 'all 150ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,166,35,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          CONNECT WALLET
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowDeposit(true)}
            disabled={isMember === false}
            style={{ padding: '14px 32px', background: '#F5A623', border: 'none', borderRadius: '8px', cursor: isMember === false ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0A0B0D', letterSpacing: '0.05em', opacity: isMember === false ? 0.4 : 1, transition: 'opacity 150ms ease' }}
            onMouseEnter={e => { if (isMember !== false) e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { if (isMember !== false) e.currentTarget.style.opacity = '1' }}
          >
            DEPOSIT ETH
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={isMember === false}
            style={{ padding: '14px 32px', background: 'transparent', border: '1px solid #F5A623', borderRadius: '8px', cursor: isMember === false ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: '#F5A623', letterSpacing: '0.05em', opacity: isMember === false ? 0.4 : 1, transition: 'all 150ms ease' }}
            onMouseEnter={e => { if (isMember !== false) e.currentTarget.style.background = 'rgba(245,166,35,0.1)' }}
            onMouseLeave={e => { if (isMember !== false) e.currentTarget.style.background = 'transparent' }}
          >
            WITHDRAW
          </button>
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACTS.treasury.address}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'transparent', border: '1px solid #1E2330', borderRadius: '8px', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#6B7A99', textDecoration: 'none', transition: 'all 150ms ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2A3347'; (e.currentTarget as HTMLElement).style.color = '#E8EAF0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1E2330'; (e.currentTarget as HTMLElement).style.color = '#6B7A99' }}
          >
            <ExternalLink size={13} /> ETHERSCAN
          </a>
        </div>
      )}

      {/* Not-member notice */}
      {isConnected && isMember === false && (
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#E74C3C' }}>
          <AlertTriangle size={13} />
          Your address is not a DAO member. Ask the admin to call addMember().
        </div>
      )}

      {/* Recent tx history placeholder */}
      <div style={{ marginTop: '48px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3D4A63', letterSpacing: '0.12em', marginBottom: '16px' }}>RECENT ACTIVITY</div>
        <a
          href={`https://sepolia.etherscan.io/address/${CONTRACTS.treasury.address}#events`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#161920', border: '1px solid #1E2330', borderRadius: '8px', fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#6B7A99', textDecoration: 'none', transition: 'all 150ms ease' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2A3347'; (e.currentTarget as HTMLElement).style.color = '#F5A623' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1E2330'; (e.currentTarget as HTMLElement).style.color = '#6B7A99' }}
        >
          <ExternalLink size={12} /> View all Deposited / Withdrawn events on Etherscan
        </a>
      </div>

      {showDeposit && (
        <DepositModal
          onClose={() => setShowDeposit(false)}
          walletBalance={walletBalance}
          onSuccess={refresh}
        />
      )}
      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  )
}
