import { useState, useEffect } from 'react'

// Zama Sepolia contract addresses from ZamaConfig.sol
const FHEVM_CONFIG = {
  chainId: 11155111,
  gatewayChainId: 11155111,
  aclContractAddress:                    '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
  inputVerifierContractAddress:          '0x3a2DA6f1daE9eF988B48d9CF27523FA31a8eBE50',
  kmsContractAddress:                    '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  verifyingContractAddressDecryption:    '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  verifyingContractAddressInputVerification: '0x3a2DA6f1daE9eF988B48d9CF27523FA31a8eBE50',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _instance: any = null
let _loading = false

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFhevm(): { instance: any; ready: boolean; error: string | null } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [instance, setInstance] = useState<any>(_instance)
  const [ready, setReady]       = useState(!!_instance)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (_instance || _loading) {
      if (_instance) { setInstance(_instance); setReady(true) }
      return
    }
    _loading = true

    const init = async () => {
      try {
        const { createInstance } = await import('@zama-fhe/relayer-sdk/web')
        const inst = await createInstance({
          ...FHEVM_CONFIG,
          network: window.ethereum,
        })
        _instance = inst
        setInstance(inst)
        setReady(true)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        setError('fhEVM init failed: ' + msg.slice(0, 80))
      } finally {
        _loading = false
      }
    }

    init()
  }, [])

  return { instance, ready, error }
}
