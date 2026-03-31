import { ChevronRight, ExternalLink, Vote, Shield, Zap, Eye, Vault } from 'lucide-react'
import { motion, useScroll, AnimatePresence, useMotionValueEvent } from 'framer-motion'
import { useRef, useState } from 'react'
import { InfiniteSlider } from '../components/UI/infinite-slider'
import { ProgressiveBlur } from '../components/UI/progressive-blur'
import { Button } from '../components/UI/button'
import { BentoGrid, type BentoItem } from '../components/UI/bento-grid'
import { FullScreenScrollFX, type Section as FXSection } from '../components/UI/full-screen-scroll-fx'

interface LandingProps {
  onNavigate: (path: string) => void
}

const techItems = [
  { name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { name: 'Zama fhEVM', symbol: 'FHE', color: '#F5A623' },
  { name: 'OpenZeppelin', symbol: 'OZ', color: '#4E5EE4' },
  { name: 'Hardhat', symbol: 'HH', color: '#FFF04D' },
  { name: 'Sepolia', symbol: 'SEP', color: '#2ECC71' },
  { name: 'Solidity', symbol: 'SOL', color: '#9B99FE' },
  { name: 'TypeScript', symbol: 'TS', color: '#3178C6' },
  { name: 'React', symbol: 'RCT', color: '#61DAFB' },
]

const bentoItems: BentoItem[] = [
  {
    title: 'Confidential Treasury',
    meta: 'FHE ENCRYPTED',
    description: 'Member balances are stored as encrypted ciphertexts. Only you can decrypt your own balance — not even admins can see it.',
    icon: <Vault className="w-5 h-5 text-amber" />,
    status: 'SECURE',
    tags: ['Treasury', 'FHE'],
    colSpan: 2,
    hasPersistentHover: true,
  },
  {
    title: 'Homomorphic Voting',
    meta: 'PRIVATE TALLY',
    description: 'Votes are counted without ever being decrypted. Individual votes are permanently private.',
    icon: <Vote className="w-5 h-5 text-[#9B99FE]" />,
    tags: ['Governance'],
  },
  {
    title: 'Selective Disclosure',
    meta: 'AUDIT READY',
    description: 'Grant per-member decryption rights to designated auditors for compliance without exposing your private keys.',
    icon: <Eye className="w-5 h-5 text-jade" />,
    status: 'ACTIVE',
    tags: ['Compliance', 'Nodes'],
    colSpan: 1,
  },
  {
    title: 'fhEVM Infrastructure',
    meta: 'ZAMA POWERED',
    description: 'High-performance FHE arithmetic on-chain for complex confidential logic and state management.',
    icon: <Zap className="w-5 h-5 text-sky-500" />,
    tags: ['Protocol', 'Nodes'],
    colSpan: 2,
  },
]

const visionSections: FXSection[] = [
  {
    leftLabel: "Confidential",
    title: "Shielded State",
    rightLabel: "Privacy",
    background: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop",
  },
  {
    leftLabel: "Governance",
    title: "Silent Tally",
    rightLabel: "Traction",
    background: "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?q=80&w=3000&auto=format&fit=crop",
  },
  {
    leftLabel: "Compliance",
    title: "Selective Disclosure",
    rightLabel: "Audited",
    background: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2940&auto=format&fit=crop",
  },
  {
    leftLabel: "Ecosystem",
    title: "The FHE Standard",
    rightLabel: "Scalable",
    background: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2944&auto=format&fit=crop",
  },
]

const workflowSteps = [
  {
    number: '01',
    title: 'Local Encryption',
    description: 'Your data is encrypted locally using the fhEVM public keys. No unencrypted data ever leaves your device, ensuring total privacy from the start.',
    image: '/workflow_1.png',
  },
  {
    number: '02',
    title: 'Blind Computation',
    description: 'ShieldDAO contracts perform operations directly on ciphertexts. Validators compute results without ever seeing the underlying values.',
    image: '/workflow_2.png',
  },
  {
    number: '03',
    title: 'On-Chain Commitment',
    description: 'Encrypted results are finalized on the Zama fhEVM, creating a tamper-proof and private record of the DAO state.',
    image: '/workflow_3.png',
  },
  {
    number: '04',
    title: 'Authorized Disclosure',
    description: 'Selective decryption allows for compliance and auditing. Authorized parties can reveal specific data without exposing private keys.',
    image: '/workflow_5.png',
  },
]

export default function Landing({ onNavigate }: LandingProps) {
  const workflowContainerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: workflowContainerRef,
    offset: ["start start", "end end"]
  })

  // Track active index based on scroll progress
  const [activeWorkflowIndex, setActiveWorkflowIndex] = useState(0)
  
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Smoother transition: map 0-1 to step indices
    const nextIndex = Math.min(
      Math.floor(v * workflowSteps.length),
      workflowSteps.length - 1
    )
    if (nextIndex !== activeWorkflowIndex) {
      setActiveWorkflowIndex(nextIndex)
    }
  })

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#0A0B0D]" />
          
          {/* Very subtle amber radial glow — behind image */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)',
            }}
          />
          
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
        </div>

        {/* Hero Content — two-column split */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12 pt-28 pb-16 lg:pt-0 lg:pb-0 lg:min-h-screen lg:flex lg:items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center w-full">

            {/* LEFT — Value Prop & CTAs */}
            <div className="order-2 lg:order-1 max-w-xl">
              {/* Simple Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber/20 bg-amber/5 mb-10 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                <span className="font-mono text-[10px] text-amber/80 tracking-widest uppercase font-semibold">
                  Live on Sepolia · Zama fhEVM
                </span>
              </div>

              <h1 className="font-display leading-[1.05] tracking-tight text-text-primary mb-8 text-4xl md:text-5xl lg:text-6xl">
                <span className="font-bold">Confidential</span> Governance, 
                <br />
                <span className="font-medium text-text-secondary">Fully </span>
                <span 
                  className="font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #A87C4F 0%, #D4AF37 50%, #B8860B 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  On-Chain.
                </span>
              </h1>

              <p className="font-mono text-xs md:text-sm text-text-secondary leading-relaxed max-w-md mb-12 opacity-80">
                Encrypted treasury balances. Homomorphic vote tallying.
                Selective compliance disclosure.
                <br />
                <span className="text-text-primary/40 mt-2 block font-medium">Powered by Fully Homomorphic Encryption.</span>
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-16">
                <Button
                  onClick={() => onNavigate('/dashboard')}
                  size="lg"
                  className="rounded-full px-10 text-sm font-display font-medium shadow-xl hover:shadow-amber/20 transition-all duration-300"
                >
                  Launch App
                  <ChevronRight className="ml-1" size={16} />
                </Button>
                <a
                  href="https://sepolia.etherscan.io/address/0x5f4a0b0a0DFC02a61781De87F3Ba987f2d9e50b0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-display font-medium text-sm text-text-muted hover:text-text-primary transition-all duration-200"
                >
                  View Contracts
                  <ExternalLink size={14} className="opacity-50" />
                </a>
              </div>

              {/* Minimal Stats */}
              <div className="flex flex-wrap items-center gap-x-12 gap-y-4 pt-10 border-t border-border/10">
                {[
                  { label: 'Network', value: 'Sepolia' },
                  { label: 'Encryption', value: 'fhEVM' },
                  { label: 'Privacy', value: '100%' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="font-display font-semibold text-lg text-text-primary">{value}</div>
                    <div className="font-mono text-[9px] text-text-muted mt-0.5 uppercase tracking-[0.2em]">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Hero Image (Standalone) */}
            <div className="order-1 lg:order-2 flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px]">
                {/* Subtle soft glow */}
                <div
                  className="absolute inset-x-0 bottom-0 top-0 rounded-[2rem] pointer-events-none opacity-50"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(245,166,35,0.05) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                  }}
                />

                {/* The image itself, with a floating animation */}
                <div
                  className="relative pointer-events-none"
                  style={{
                    animation: 'heroFloat 6s ease-in-out infinite',
                    filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.6))',
                  }}
                >
                  <img
                    src="/shieldao_first.png"
                    alt="ShieldDAO"
                    className="w-full h-auto rounded-[2rem] border border-white/5 shadow-2xl"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* Tech Slider Section */}
      <section className="py-4 border-y border-border/50 bg-bg-secondary/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 md:border-r md:border-border md:pr-8">
              <p className="font-mono text-xs text-text-muted text-center md:text-right whitespace-nowrap">
                Built with
              </p>
            </div>
            <div className="relative flex-1 overflow-hidden">
              <InfiniteSlider speed={40} speedOnHover={20} gap={80}>
                {techItems.map(({ name, symbol, color }) => (
                  <div
                    key={name}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-lg border border-border/50 bg-bg-card/50"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono"
                      style={{ background: `${color}20`, color }}
                    >
                      {symbol.slice(0, 2)}
                    </div>
                    <span className="font-mono text-xs text-text-secondary whitespace-nowrap">
                      {name}
                    </span>
                  </div>
                ))}
              </InfiniteSlider>
              <ProgressiveBlur
                className="pointer-events-none absolute left-0 top-0 h-full w-20"
                direction="left"
                blurIntensity={0.8}
              />
              <ProgressiveBlur
                className="pointer-events-none absolute right-0 top-0 h-full w-20"
                direction="right"
                blurIntensity={0.8}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section — Cinematic Sticky Scroll */}
      <section ref={workflowContainerRef} className="relative h-[250vh] bg-[#0A0B0D]">
        <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
          {/* Subtle background glow for this section */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/20 to-transparent" />
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-amber/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center -mt-10">
            
            {/* Left side — Text Content */}
            <div className="flex flex-col justify-center h-full">
              <div className="mb-14">
                <p className="font-mono text-[10px] text-amber tracking-[0.4em] uppercase mb-4 font-bold opacity-60">
                  Confidentiality Pipeline
                </p>
                <h2 className="font-display font-bold text-4xl md:text-5xl text-text-primary tracking-tight leading-[1.1]">
                  The Lifecycle of <br />
                  <span className="text-text-secondary opacity-40 italic font-medium">Privacy.</span>
                </h2>
              </div>

              <div className="relative min-h-[400px] [perspective:1000px]">
                <AnimatePresence>
                  <motion.div
                    key={activeWorkflowIndex}
                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-x-0 top-0"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <span className="font-display font-black text-6xl text-white/5 tracking-tighter select-none">
                        {workflowSteps[activeWorkflowIndex].number}
                      </span>
                      <h3 className="font-display font-bold text-2xl text-text-primary">
                        {workflowSteps[activeWorkflowIndex].title}
                      </h3>
                    </div>
                    <p className="font-mono text-sm text-text-secondary leading-relaxed max-w-md border-l-2 border-amber/30 pl-6">
                      {workflowSteps[activeWorkflowIndex].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Step indicator dots */}
              <div className="flex items-center gap-3 mt-12">
                {workflowSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 transition-all duration-500 rounded-full ${
                      i === activeWorkflowIndex ? 'w-8 bg-amber' : 'w-2 bg-border'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right side — Image Visual */}
            <div className="relative flex items-center justify-center [perspective:1000px]">
              <div className="relative w-full max-w-[600px] aspect-[4/3]">
                {/* Image frame with glass effect */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 blur-[1px]" />
                
                <AnimatePresence>
                  <motion.div
                    key={activeWorkflowIndex}
                    initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(20px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.05, y: -20, filter: 'blur(20px)' }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center p-8"
                  >
                    <div className="relative w-full h-full group">
                      {/* Inner image glow */}
                      <div className="absolute inset-4 bg-amber/5 rounded-[2rem] blur-[60px] opacity-40" />
                      
                      <img
                        src={workflowSteps[activeWorkflowIndex].image}
                        alt={workflowSteps[activeWorkflowIndex].title}
                        className="w-full h-full object-contain rounded-[2rem] drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative z-10"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Decorative scanning line */}
                <motion.div
                  className="absolute left-0 right-0 h-px bg-amber/30 z-20"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 px-6 border-t border-white/5 bg-[#0A0B0D]">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="font-mono text-xs text-amber tracking-widest uppercase mb-4">
              How it works
            </p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-text-primary mb-4">
              Privacy-first, from the ground up
            </h2>
            <p className="font-mono text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
              Every feature is built around Zama's Fully Homomorphic Encryption — compute on encrypted data without ever decrypting it.
            </p>
          </div>

          <BentoGrid items={bentoItems} />
        </div>
      </section>

      {/* Protocol Vision Section — GSAP FullScreenFX */}
      <section className="bg-[#0A0B0D]">
        <FullScreenScrollFX
          sections={visionSections}
          header={
            <div className="flex flex-col items-center">
              <span className="font-mono text-xs text-amber mb-2 tracking-[0.5em] opacity-60">The Vision</span>
              <div className="flex gap-4">
                <span className="font-bold">Protocol</span>
                <span className="font-medium text-text-secondary">Future</span>
              </div>
            </div>
          }
          footer={
            <div className="flex flex-col items-center gap-4">
              <p className="font-mono text-[10px] text-text-muted tracking-widest">ShieldDAO Vision 2026 · Confidentiality as a Standard</p>
              <Button
                onClick={() => onNavigate('/dashboard')}
                variant="outline"
                className="rounded-full border-amber/30 text-amber hover:bg-amber/10 h-8 text-[10px] px-6 uppercase tracking-widest font-bold"
              >
                Secure the DAO
              </Button>
            </div>
          }
          showProgress
          durations={{ change: 0.8, snap: 1000 }}
          colors={{
            text: "rgba(245, 166, 35, 0.9)",
            overlay: "rgba(0, 0, 0, 0.5)",
            pageBg: "#0A0B0D",
            stageBg: "#000000",
          }}
        />
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl border border-amber/20 bg-bg-card overflow-hidden">
            {/* Glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <Shield size={40} className="text-amber mx-auto mb-6" fill="rgba(245,166,35,0.15)" />
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-text-primary mb-4">
                Ready to govern privately?
              </h2>
              <p className="font-mono text-sm text-text-secondary mb-8 leading-relaxed">
                Connect your wallet and experience confidential DAO governance — live on Sepolia.
              </p>
              <Button
                onClick={() => onNavigate('/dashboard')}
                size="lg"
                className="rounded-full px-10 text-base font-display font-bold shadow-[0_0_32px_rgba(245,166,35,0.3)]"
              >
                Enter the DAO
                <ChevronRight className="ml-1" size={18} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-amber" />
            <span className="font-mono text-xs text-text-muted">ShieldDAO — Confidential Governance</span>
          </div>
          <div className="font-mono text-xs text-text-muted">
            Deployed on Sepolia · Block #10,539,615
          </div>
        </div>
      </footer>
    </div>
  )
}
