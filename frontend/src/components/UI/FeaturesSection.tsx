'use client'
import { Activity, Map as MapIcon, MessageCircle, Shield } from 'lucide-react'
import DottedMap from 'dotted-map'
import { Area, AreaChart, CartesianGrid } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from './chart'

export function FeaturesSection() {
    return (
        <section className="px-4 py-16 md:py-32 border-t border-white/5">
            <div className="mx-auto grid max-w-7xl border border-white/10 md:grid-cols-2 rounded-3xl overflow-hidden bg-black/20 backdrop-blur-3xl">
                <div className="border-b md:border-b-0 md:border-r border-white/10">
                    <div className="p-8 sm:p-12">
                        <span className="text-amber flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                            <MapIcon className="size-4" />
                            Global Node Distribution
                        </span>

                        <p className="mt-8 text-3xl font-syne font-black text-text-primary tracking-tighter leading-tight">
                            Confidential infrastructure, <br />
                            <span className="text-text-muted">instantly locate all your assets.</span>
                        </p>
                    </div>

                    <div aria-hidden className="relative min-h-[300px]">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 m-auto size-fit">
                            <div className="rounded-xl bg-bg-card/80 backdrop-blur-xl z-[1] border border-amber/30 p-4 shadow-2xl shadow-amber/10 flex flex-col items-center gap-2">
                                <div className="flex items-center gap-3">
                                   <div className="w-2 h-2 rounded-full bg-jade animate-pulse" />
                                   <span className="text-xs font-mono font-bold text-text-primary italic">ZURICH_ENCLAVE_ACTIVE</span>
                                </div>
                                <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Latency: 24ms (FHE-Optimal)</span>
                            </div>
                        </div>

                        <div className="relative overflow-hidden opacity-40 grayscale translate-y-10 group hover:grayscale-0 transition-all duration-1000">
                            <div className="[background-image:radial-gradient(var(--tw-gradient-stops))] z-1 from-transparent to-bg-primary absolute inset-0 to-90%"></div>
                            <Map />
                        </div>
                    </div>
                </div>
                
                <div className="overflow-hidden bg-white/[0.01] p-8 sm:p-12 dark:bg-transparent">
                    <div className="relative z-10">
                        <span className="text-jade flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                            <MessageCircle className="size-4" />
                            Shielded Communication
                        </span>

                        <p className="my-8 text-3xl font-syne font-black text-text-primary tracking-tighter leading-tight">
                            On-chain encrypted support <br />
                            <span className="text-text-muted">for every governance action.</span>
                        </p>
                    </div>
                    <div aria-hidden className="flex flex-col gap-8 mt-12">
                        <div className="group">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="flex justify-center items-center size-5 rounded-full border border-jade/30">
                                    <span className="size-2 rounded-full bg-jade animate-pulse"/>
                                </span>
                                <span className="text-text-muted font-mono text-[10px] uppercase tracking-widest">Agent 0x71...</span>
                            </div>
                            <div className="rounded-2xl bg-white/5 border border-white/10 mt-1.5 w-4/5 p-4 text-xs font-mono text-text-secondary leading-relaxed backdrop-blur-sm group-hover:border-jade/30 transition-colors">
                                I need to reveal my balance for the audit, but keep it private from others.
                            </div>
                        </div>

                        <div className="ml-auto w-4/5 text-right font-mono group">
                            <div className="rounded-2xl mb-2 bg-jade font-bold p-4 text-[11px] text-bg-primary shadow-xl shadow-jade/10 text-left">
                                Request sent via Shroud Protocol. Only you and the designated auditor can now view the balance handle.
                            </div>
                            <span className="text-jade/60 text-[9px] font-bold uppercase tracking-widest flex items-center justify-end gap-2 px-1">
                                <Shield size={10} /> ENCRYPTED_RESPONSE
                            </span>
                        </div>
                    </div>
                </div>

                <div className="col-span-full border-y border-white/10 p-16 bg-white/[0.02]">
                    <div className="flex flex-col items-center gap-4">
                        <p className="font-mono text-[10px] text-amber tracking-[0.5em] uppercase font-bold">Protocol Reliability</p>
                        <p className="text-center text-5xl md:text-8xl font-syne font-black text-text-primary tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">99.99% <span className="text-2xl md:text-4xl text-text-muted italic opacity-40">UPTIME</span></p>
                    </div>
                </div>

                <div className="relative col-span-full pb-20">
                    <div className="absolute z-10 max-w-xl px-8 pr-12 pt-12 md:px-16 md:pt-16">
                        <span className="text-amber flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                            <Activity className="size-4" />
                            Homomorphic Ops Stream
                        </span>

                        <p className="my-8 text-3xl font-syne font-black text-text-primary tracking-tighter leading-tight">
                            Monitor FHE computation cycles in real-time. <br />
                            <span className="text-text-muted italic">Total blindness for processors, total clarity for you.</span>
                        </p>
                    </div>
                    <div className="pt-40 px-4">
                       <MonitoringChart />
                    </div>
                </div>
            </div>
        </section>
    )
}

const map = new DottedMap({ height: 55, grid: 'diagonal' })
const points = map.getPoints()

const Map = () => {
    const viewBox = `0 0 120 60`
    return (
        <svg viewBox={viewBox} className="text-amber">
            {points.map((point, index) => (
                <circle key={index} cx={point.x} cy={point.y} r={0.15} fill="currentColor" />
            ))}
        </svg>
    )
}

const chartConfig = {
    fhe_ops: {
        label: 'FHE_OPS',
        color: '#F5A623',
    },
    sync_rate: {
        label: 'SYNC_RATE',
        color: '#2ECC71',
    },
} satisfies ChartConfig

const chartData = [
    { label: 'T1', ops: 120, rate: 85 },
    { label: 'T2', ops: 240, rate: 92 },
    { label: 'T3', ops: 180, rate: 88 },
    { label: 'T4', ops: 380, rate: 95 },
    { label: 'T5', ops: 220, rate: 91 },
    { label: 'T6', ops: 450, rate: 99 },
]

const MonitoringChart = () => {
    return (
        <ChartContainer className="h-96 w-full" config={chartConfig}>
            <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="fillOps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-fhe_ops)" stopOpacity={0.4} />
                        <stop offset="70%" stopColor="var(--color-fhe_ops)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-sync_rate)" stopOpacity={0.4} />
                        <stop offset="70%" stopColor="var(--color-sync_rate)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <ChartTooltip active cursor={false} content={<ChartTooltipContent className="bg-bg-card border-white/10" />} />
                <Area strokeWidth={3} dataKey="rate" type="monotone" fill="url(#fillRate)" stroke="var(--color-sync_rate)" stackId="a" />
                <Area strokeWidth={3} dataKey="ops" type="monotone" fill="url(#fillOps)" stroke="var(--color-fhe_ops)" stackId="a" />
            </AreaChart>
        </ChartContainer>
    )
}
