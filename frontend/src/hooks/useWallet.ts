import { useState, useEffect, useCallback, useRef } from 'react'
import { BrowserProvider, JsonRpcProvider, JsonRpcSigner } from 'ethers'
import { CONTRACTS } from '../config/contracts'

interface WalletState {
  address: string | null
  provider: BrowserProvider | null
  readProvider: JsonRpcProvider
  signer: JsonRpcSigner | null
  isConnected: boolean
  chainId: number | null
  isWrongNetwork: boolean
  connect: () => Promise<void>
  switchToSepolia: () => Promise<void>
  error: string | null
}

// Read-only provider always points to Sepolia via Infura — never uses MetaMask RPC
const READ_PROVIDER = new JsonRpcProvider(CONTRACTS.network.rpcUrl)

let _browserProvider: BrowserProvider | null = null

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null)
  const [signer,  setSigner]  = useState<JsonRpcSigner | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const initialized = useRef(false)

  const loadAccount = useCallback(async () => {
    if (!window.ethereum) return
    try {
      const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length === 0) return
      const chainHex: string = await window.ethereum.request({ method: 'eth_chainId' })
      const cid = parseInt(chainHex, 16)
      if (!_browserProvider) _browserProvider = new BrowserProvider(window.ethereum)
      const s = await _browserProvider.getSigner(accounts[0])
      setAddress(accounts[0])
      setSigner(s)
      setChainId(cid)
    } catch {
      // not authorized yet
    }
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    loadAccount()

    const eth = window.ethereum
    if (!eth) return

    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null); setSigner(null); setChainId(null)
      } else {
        setAddress(accounts[0])
        if (_browserProvider) {
          _browserProvider.getSigner(accounts[0]).then(setSigner).catch(() => {})
        }
      }
    }

    const onChainChanged = (chainHex: string) => {
      setChainId(parseInt(chainHex, 16))
      _browserProvider = new BrowserProvider(window.ethereum)
      window.ethereum.request({ method: 'eth_accounts' }).then((accs: string[]) => {
        if (accs.length > 0) _browserProvider!.getSigner(accs[0]).then(setSigner).catch(() => {})
      }).catch(() => {})
    }

    try {
      if (typeof eth.on === 'function') {
        eth.on('accountsChanged', onAccountsChanged)
        eth.on('chainChanged', onChainChanged)
      }
    } catch { /* some wallets don't support .on() */ }

    return () => {
      try {
        if (typeof eth.removeListener === 'function') {
          eth.removeListener('accountsChanged', onAccountsChanged)
          eth.removeListener('chainChanged', onChainChanged)
        }
      } catch { /* ignore */ }
    }
  }, [loadAccount])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask.')
      return
    }
    try {
      setError(null)
      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const chainHex: string   = await window.ethereum.request({ method: 'eth_chainId' })
      const cid = parseInt(chainHex, 16)
      _browserProvider = new BrowserProvider(window.ethereum)
      const s = await _browserProvider.getSigner(accounts[0])
      setAddress(accounts[0])
      setSigner(s)
      setChainId(cid)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Connection failed')
    }
  }, [])

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      })
    } catch (switchError: unknown) {
      const err = switchError as { code?: number }
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: [CONTRACTS.network.rpcUrl],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          })
        } catch { /* ignore */ }
      }
    }
  }, [])

  return {
    address,
    provider: _browserProvider,
    readProvider: READ_PROVIDER,
    signer,
    isConnected:    !!address,
    chainId,
    isWrongNetwork: chainId !== null && chainId !== CONTRACTS.network.chainId,
    connect,
    switchToSepolia,
    error,
  }
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any
  }
}
