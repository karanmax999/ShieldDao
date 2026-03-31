import { useState, useEffect, useCallback } from 'react'
import { useWallet } from './useWallet'
import { useContracts } from './useContracts'
import { useFhevm } from './useFhevm'

export function useTreasuryBalance() {
  const { address, isConnected } = useWallet()
  const { treasuryRead } = useContracts()
  const { instance: fhevm, ready: fhevmReady } = useFhevm()
  
  const [balance, setBalance] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!isConnected || !address || !fhevmReady || !fhevm || !treasuryRead) return
    
    setLoading(true)
    setError(null)
    
    try {
      // 1. Get the member's balance handle (euint64)
      const handle = await treasuryRead.getBalanceHandle(address)
      
      if (handle === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        setBalance('0.000')
        return
      }

      // 2. Create re-encryption keypair
      // NOTE: In a real app, this would pop a signature request
      const { publicKey, privateKey } = fhevm.generateKeypair()
      const eip712 = fhevm.createEIP712(publicKey, treasuryRead.target)
      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify(eip712)],
      })

      // 3. Re-encrypt the handle for our public key
      const encryptedBalance = await fhevm.reencrypt(
        handle,
        privateKey,
        publicKey,
        signature,
        treasuryRead.target,
        address
      )

      // 4. Decrypt locally and convert to ETH
      // (The contract stores balance as uint64, usually in Wei or a fixed-point decimal)
      // Assuming it's in Wei for this demo
      const balanceInWei = encryptedBalance
      setBalance((Number(balanceInWei) / 1e18).toFixed(3))
    } catch (e: unknown) {
      console.error('Failed to fetch FHE balance:', e)
      setError(e instanceof Error ? e.message : 'FHE Decryption failed')
    } finally {
      setLoading(false)
    }
  }, [address, isConnected, fhevmReady, fhevm, treasuryRead])

  useEffect(() => {
    if (isConnected && fhevmReady) {
      fetchBalance()
    }
  }, [isConnected, fhevmReady, fetchBalance])

  return { balance, loading, error, refresh: fetchBalance }
}
