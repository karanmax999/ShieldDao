"use client"

import * as React from "react"
import useSWR from "swr"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"

// Lazy load heavy WebGL shaders
const Warp = React.lazy(async () => {
  const mod = await import("@paper-design/shaders-react")
  return { default: mod.Warp }
})
import { RefreshCw, ArrowDown, ChevronDown, Search, TrendingUp, Zap } from 'lucide-react'
import { cn } from "../../lib/utils"

type Coin = {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
  return res.json() as Promise<Coin[]>
}

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h"

export default function CryptoSwapCard() {
  const { data, isLoading, mutate } = useSWR<Coin[]>(COINGECKO_URL, fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  })

  const [fromId, setFromId] = React.useState<string>("bitcoin")
  const [toId, setToId] = React.useState<string>("ethereum")
  const [fromAmount, setFromAmount] = React.useState<string>("1")

  const coinMap = React.useMemo(() => {
    const map = new Map<string, Coin>()
    data?.forEach((c) => map.set(c.id, c))
    return map
  }, [data])

  const fromCoin = coinMap.get(fromId) || data?.[0]
  const toCoin = coinMap.get(toId) || data?.[1]

  const toAmount = React.useMemo(() => {
    if (!fromCoin || !toCoin) return 0
    return (Number(fromAmount) || 0) * (fromCoin.current_price / toCoin.current_price)
  }, [fromCoin, toCoin, fromAmount])

  const swapSides = () => {
    setFromId(toId)
    setToId(fromId)
  }

  const formatFiat = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  }

  return (
    <div className="w-full space-y-6 relative group/swap">
      {/* Background Shader Overlay */}
      <div className="absolute -inset-10 pointer-events-none opacity-[0.03] group-hover/swap:opacity-[0.07] transition-opacity duration-1000 overflow-hidden rounded-[3rem]">
        <React.Suspense fallback={null}>
          <Warp 
            speed={0.2}
            colors={["#F5A623", "#F39C12"]}
            shape="checks"
            shapeScale={0.15}
          />
        </React.Suspense>
      </div>

      <LayoutGroup>
        {/* From Card */}
        <motion.div layout className="group relative p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-amber/20 transition-all backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.2em] font-black opacity-60">Sell Quantum</span>
            <span className="font-mono text-[10px] text-amber uppercase font-black tracking-widest">Balance: 0.42 {fromCoin?.symbol.toUpperCase()}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type="number"
              value={fromAmount}
              onChange={e => setFromAmount(e.target.value)}
              className="flex-1 bg-transparent border-none font-syne font-black text-4xl text-text-primary focus:outline-none placeholder:text-white/5"
              placeholder="0.00"
            />
            <TokenSelector coins={data || []} selected={fromCoin} onSelect={setFromId} />
          </div>

          <div className="mt-4 flex justify-between items-center text-[10px] font-mono text-text-muted uppercase tracking-tighter">
            <span>{fromCoin?.name || 'Loading...'} Price</span>
            <span className="text-text-primary">{fromCoin ? formatFiat(fromCoin.current_price) : '---'}</span>
          </div>
        </motion.div>

        {/* Swap Visual */}
        <div className="flex justify-center -my-8 relative z-10">
          <button 
            onClick={swapSides}
            className="p-3 bg-[#0A0B0D] border border-white/10 rounded-2xl hover:border-amber/40 hover:scale-110 transition-all group shadow-2xl"
          >
            <ArrowDown size={18} className="text-amber group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        {/* To Card */}
        <motion.div layout className="group relative p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-jade/20 transition-all backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.2em] font-black opacity-60">Buy Quantum</span>
            <span className="font-mono text-[10px] text-jade uppercase font-black tracking-widest italic">Live Quote</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 font-syne font-black text-4xl text-jade/40 drop-shadow-[0_0_15px_rgba(46,204,113,0.1)]">
              {toAmount.toFixed(4)}
            </div>
            <TokenSelector coins={data || []} selected={toCoin} onSelect={setToId} />
          </div>

          <div className="mt-4 flex justify-between items-center text-[10px] font-mono text-text-muted uppercase tracking-tighter">
            <span>{toCoin?.name || 'Loading...'} Price</span>
            <span className="text-text-primary font-bold">{toCoin ? formatFiat(toCoin.current_price) : '---'}</span>
          </div>
        </motion.div>

        {/* Market Stats */}
        {fromCoin && toCoin && (
          <motion.div layout className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center px-6">
             <div className="flex items-center gap-2">
                <TrendingUp size={12} className="text-jade" />
                <span className="font-mono text-[9px] text-text-muted uppercase font-black">Exchange Rate</span>
             </div>
             <span className="font-mono text-[10px] text-text-primary font-black uppercase">
                1 {fromCoin.symbol.toUpperCase()} = {(fromCoin.current_price / toCoin.current_price).toFixed(6)} {toCoin.symbol.toUpperCase()}
             </span>
          </motion.div>
        )}

        {/* Action */}
        <motion.button 
          layout
          whileHover={{ scale: 1.01, boxShadow: "0 0 50px rgba(46,204,113,0.1)" }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading || !fromAmount}
          className="w-full py-10 rounded-[2.5rem] bg-white text-bg-primary font-syne font-black text-lg tracking-[0.3em] uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-4"
        >
          <Zap size={20} className="animate-pulse text-jade" />
          SHIELDED_SWAP_LINK
        </motion.button>
      </LayoutGroup>

      <div className="flex justify-between items-center px-2">
         <span className="font-mono text-[9px] text-text-muted uppercase font-bold tracking-widest opacity-40">Powered by CoinGecko Enclave</span>
         <button onClick={() => mutate()} className="text-text-muted hover:text-amber transition-colors"><RefreshCw size={12} className={cn(isLoading && "animate-spin")} /></button>
      </div>
    </div>
  )
}

function TokenSelector({ coins, selected, onSelect }: { coins: Coin[], selected?: Coin, onSelect: (id: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const filtered = coins.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.symbol.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl hover:bg-white/5 transition-all"
      >
        {selected && (
          <img src={selected.image} alt="" className="w-5 h-5 rounded-full grayscale" />
        )}
        <span className="font-mono text-sm font-black text-text-primary uppercase">{selected?.symbol || '---'}</span>
        <ChevronDown size={14} className="text-text-muted" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-3 w-64 bg-[#0A0B0D] border border-white/10 rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] z-50 overflow-hidden backdrop-blur-xl"
            >
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search quantum..."
                    className="w-full bg-white/5 border-none rounded-xl pl-9 pr-4 py-2.5 font-mono text-xs text-text-primary focus:ring-1 focus:ring-amber/30"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filtered.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => { onSelect(c.id); setOpen(false) }}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                       <img src={c.image} alt="" className="w-5 h-5 rounded-full grayscale group-hover:grayscale-0 transition-all" />
                       <div className="text-left">
                          <p className="font-mono text-[11px] font-black text-text-primary uppercase">{c.symbol}</p>
                          <p className="font-mono text-[9px] text-text-muted uppercase tracking-tighter">{c.name}</p>
                       </div>
                    </div>
                    {c.price_change_percentage_24h && (
                      <span className={cn("font-mono text-[10px] font-black", (c.price_change_percentage_24h || 0) > 0 ? "text-jade" : "text-red")}>
                        {(c.price_change_percentage_24h || 0) > 0 ? '+' : ''}{c.price_change_percentage_24h.toFixed(1)}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
