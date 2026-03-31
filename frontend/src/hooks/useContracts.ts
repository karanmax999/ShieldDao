import { useMemo } from 'react'
import { Contract } from 'ethers'
import { CONTRACTS } from '../config/contracts'
import { useWallet } from './useWallet'
import { useDAO } from '../context/DAOContext'

export function useContracts() {
  const { signer, readProvider } = useWallet()
  const { dao } = useDAO()

  // Write contracts — only available when wallet is connected and on correct network
  const treasury = useMemo(
    () => signer ? new Contract(dao.treasuryAddress, CONTRACTS.treasury.abi, signer) : null,
    [signer, dao.treasuryAddress]
  )
  const governance = useMemo(
    () => signer ? new Contract(dao.governanceAddress, CONTRACTS.governance.abi, signer) : null,
    [signer, dao.governanceAddress]
  )
  const auditorAccess = useMemo(
    () => signer ? new Contract(dao.auditorAddress, CONTRACTS.auditorAccess.abi, signer) : null,
    [signer, dao.auditorAddress]
  )

  // Read-only contracts — always available via Infura
  const treasuryRead = useMemo(
    () => new Contract(dao.treasuryAddress, CONTRACTS.treasury.abi, readProvider),
    [readProvider, dao.treasuryAddress]
  )

  return { treasury, governance, auditorAccess, treasuryRead, hasSigner: !!signer }
}
