import { useState, useEffect } from 'react'

// Zama Sepolia contract addresses from ZamaConfig.sol
const FHEVM_CONFIG = {
  chainId: 11155111,
  gatewayChainId: 11155111,
  relayerUrl:                            'https://relayer.testnet.zama.cloud',
  gatewayUrl:                            'https://gateway.sepolia.zama.ai/',
  aclContractAddress:                    '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
  inputVerifierContractAddress:          '0x3a2DA6f1daE9eF988B48d9CF27523FA31a8eBE50',
  kmsContractAddress:                    '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  verifyingContractAddressDecryption:    '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  verifyingContractAddressInputVerification: '0x3a2DA6f1daE9eF988B48d9CF27523FA31a8eBE50',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _instance: any = null
let _loading = false

export function useFhevm(): { instance: any; ready: boolean; error: string | null; status: string; progress: number } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [instance, setInstance] = useState<any>(_instance)
  const [ready, setReady]       = useState(!!_instance)
  const [error, setError]       = useState<string | null>(null)
  const [status, setStatus]     = useState<string>('idle')
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    if (_instance) {
      setInstance(_instance)
      setReady(true)
      return
    }
    
    if (_loading) return
    _loading = true

    const init = async () => {
      // Emergency reset if taking too long
      const timeoutId = setTimeout(() => {
        if (!_instance) {
          setError('Initialization timed out after 45s. Check network / Wasms.')
          setStatus('ERROR')
          _loading = false
        }
      }, 45000)

      try {
        console.log('[FHEVM] Start Initialization Sequence')
        setStatus('LOADING_WASM')
        setProgress(20)
        const { createInstance } = await import('@zama-fhe/relayer-sdk/web')
        
        setStatus('INITIALIZING_SDK')
        setProgress(45)
        const inst = await createInstance({
          ...FHEVM_CONFIG,
          network: window.ethereum,
        })
        
        setStatus('KMS_SYNC')
        setProgress(75)
        // Simulate a small delay for KMS sync to feel premium
        await new Promise(r => setTimeout(r, 1500))
        
        _instance = inst
        setInstance(inst)
        setReady(true)
        setStatus('READY')
        setProgress(100)
        console.log('[FHEVM] Enclave Ready')
      } catch (e: unknown) {
        console.error('fhEVM init failed:', e)
        const msg = e instanceof Error ? e.message : String(e)
        setError('fhEVM init failed: ' + msg.slice(0, 80))
        setStatus('ERROR')
        _loading = false
      } finally {
        clearTimeout(timeoutId)
      }
    }

    init()
  }, [])

  return { instance, ready, error, status, progress }
}
