"use client"

import React, { Suspense } from "react"
import { Shield, Lock, Zap, Cpu, History, Eye, Fingerprint } from 'lucide-react'

// Lazy load heavy WebGL shaders
const Warp = React.lazy(async () => {
  const mod = await import("@paper-design/shaders-react")
  return { default: mod.Warp }
})

interface Feature {
  title: string
  description: string
  icon: React.ReactNode
}

const features: Feature[] = [
  {
    title: "Local Encryption",
    description: "Your data is cloaked at the source using fHEVM public keys. No unencrypted state ever leaves your local enclave.",
    icon: <Lock className="w-12 h-12 text-white" />,
  },
  {
    title: "Homomorphic Logic",
    description: "Perform complex arithmetic and logical operations on encrypted state without ever needing a decryption key.",
    icon: <Cpu className="w-12 h-12 text-white" />,
  },
  {
    title: "Threshold Ops",
    description: "Decentralized re-encryption keys ensure that only authorized agents can reveal the final computational output.",
    icon: <Shield className="w-12 h-12 text-white" />,
  },
  {
    title: "ZK-Proof Integrity",
    description: "Verify the mathematical validity of every encrypted transaction without revealing the underlying volume.",
    icon: <Fingerprint className="w-12 h-12 text-white" />,
  },
  {
    title: "Atomic Privacy",
    description: "Seamlessly bridge between public liquidity and private vaults with one-click atomic confidentiality anchors.",
    icon: <Zap className="w-12 h-12 text-white" />,
  },
  {
    title: "Selective Disclosure",
    description: "Programmable re-encryption handles allow for regulatory auditing while maintaining total user sovereignty.",
    icon: <Eye className="w-12 h-12 text-white" />,
  },
]

export default function FeatureShaderCards() {
  const getShaderConfig = (index: number) => {
    const configs = [
      {
        proportion: 0.3,
        softness: 0.8,
        distortion: 0.15,
        swirl: 0.6,
        swirlIterations: 8,
        shape: "checks" as const,
        shapeScale: 0.08,
        colors: ["#F5A623", "#D0021B", "#9013FE", "#BD10E0"], // Amber/Red/Purple
      },
      {
        proportion: 0.4,
        softness: 1.2,
        distortion: 0.2,
        swirl: 0.9,
        swirlIterations: 12,
        shape: "checks" as const,
        shapeScale: 0.12,
        colors: ["#4A90E2", "#50E3C2", "#B8E986", "#7ED321"], // Blue/Green
      },
      {
        proportion: 0.35,
        softness: 0.9,
        distortion: 0.18,
        swirl: 0.7,
        swirlIterations: 10,
        shape: "checks" as const,
        shapeScale: 0.1,
        colors: ["#2ECC71", "#27AE60", "#16A085", "#1ABC9C"], // Jade/Emerald
      },
      {
        proportion: 0.45,
        softness: 1.1,
        distortion: 0.22,
        swirl: 0.8,
        swirlIterations: 15,
        shape: "checks" as const,
        shapeScale: 0.09,
        colors: ["#F5A623", "#F8E71C", "#F39C12", "#E67E22"], // Amber/Yellow
      },
      {
        proportion: 0.38,
        softness: 0.95,
        distortion: 0.16,
        swirl: 0.85,
        swirlIterations: 11,
        shape: "checks" as const,
        shapeScale: 0.11,
        colors: ["#9013FE", "#BD10E0", "#4A90E2", "#D4BBFF"], // Purple
      },
      {
        proportion: 0.42,
        softness: 1.0,
        distortion: 0.19,
        swirl: 0.75,
        swirlIterations: 9,
        shape: "checks" as const,
        shapeScale: 0.13,
        colors: ["#D0021B", "#FF5E5E", "#F5A623", "#D0021B"], // Red/Pink
      },
    ]
    return configs[index % configs.length]
  }

  return (
    <section className="py-24 px-6 bg-[#0A0B0D]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <p className="font-mono text-[10px] text-amber tracking-[0.4em] uppercase mb-4 font-bold opacity-60">
            Confidentiality Pipeline
          </p>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-text-primary tracking-tight leading-[1.1] mb-6">
            The Lifecycle of <br />
            <span className="text-text-secondary opacity-40 italic font-medium">Privacy.</span>
          </h2>
          <p className="font-mono text-sm text-text-secondary max-w-2xl leading-relaxed opacity-60">
            Every layer of the protocol is mathematically shielded for total blindness. 
            Experience the sovereign evolution of on-chain data state.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => {
            const shaderConfig = getShaderConfig(index)
            return (
              <div key={index} className="relative h-[340px] group">
                <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden opacity-40 group-hover:opacity-100 transition-opacity duration-1000">
                  <Suspense fallback={null}>
                    <Warp
                      style={{ height: "100%", width: "100%" }}
                      proportion={shaderConfig.proportion}
                      softness={shaderConfig.softness}
                      distortion={shaderConfig.distortion}
                      swirl={shaderConfig.swirl}
                      swirlIterations={shaderConfig.swirlIterations}
                      shape={shaderConfig.shape}
                      shapeScale={shaderConfig.shapeScale}
                      scale={1}
                      rotation={0}
                      speed={0.4}
                      colors={shaderConfig.colors}
                    />
                  </Suspense>
                </div>

                <div className="relative z-10 p-10 rounded-[2.5rem] h-full flex flex-col bg-black/60 border border-white/5 backdrop-blur-xl group-hover:border-white/20 transition-all duration-500">
                  <div className="mb-8 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-500">
                    {feature.icon}
                  </div>

                  <h3 className="font-display font-bold text-2xl mb-4 text-white tracking-tight">{feature.title}</h3>

                  <p className="font-mono text-[11px] leading-relaxed text-text-muted opacity-80 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                    {feature.description}
                  </p>

                  <div className="mt-auto flex items-center text-[10px] font-black font-mono text-amber tracking-widest uppercase opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <span className="mr-3">ENCLAVE_LINK_0{index + 1}</span>
                    <History size={12} className="animate-spin-slow" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
