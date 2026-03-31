import React, { useState } from 'react'
import { Menu, X, Wallet, AlertTriangle, Shield, Settings } from 'lucide-react'
import { motion, useScroll } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useWallet } from '../../hooks/useWallet'
import { useDAO } from '../../context/DAOContext'
import { SwitchDAOModal } from '../UI/SwitchDAOModal'

const navItems = [
  { name: 'Dashboard',  href: '/dashboard' },
  { name: 'Treasury',   href: '/treasury' },
  { name: 'Governance', href: '/governance' },
  { name: 'Auditor',    href: '/auditor' },
]

interface NavbarProps {
  currentPath: string
  onNavigate: (path: string) => void
}

export default function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { scrollYProgress } = useScroll()
  const { address, isConnected, isWrongNetwork, connect, switchToSepolia } = useWallet()
  const { dao } = useDAO()

  React.useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => setScrolled(v > 0.02))
    return () => unsub()
  }, [scrollYProgress])

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        data-state={menuOpen ? 'active' : undefined}
        className="group w-full pt-3"
      >
        <div
          className={cn(
            'mx-auto max-w-7xl rounded-2xl px-6 transition-all duration-300 lg:px-10',
            scrolled
              ? 'bg-bg-primary/80 backdrop-blur-xl border border-border shadow-xl shadow-black/40'
              : 'bg-transparent',
          )}
        >
          <motion.div
            className={cn(
              'relative flex flex-wrap items-center justify-between gap-6 py-4 duration-200 lg:gap-0',
              scrolled && 'py-3',
            )}
          >
            {/* Logo */}
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2.5 group/logo"
              aria-label="ShieldDAO home"
            >
              <div className="relative">
                <Shield
                  size={26}
                  className="text-amber transition-all duration-300 group-hover/logo:drop-shadow-[0_0_8px_rgba(245,166,35,0.8)]"
                  fill="rgba(245,166,35,0.15)"
                />
              </div>
              <div className="flex flex-col leading-none text-left">
                <span className="font-display font-bold text-[17px] text-text-primary tracking-tight">
                  {dao.name}
                </span>
                <span className="font-mono text-[9px] text-amber/60 tracking-[0.15em] uppercase">
                  {dao.isCustom ? 'Custom Terminal' : 'Confidential'}
                </span>
              </div>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative z-20 block cursor-pointer p-2 lg:hidden text-text-secondary hover:text-text-primary"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Desktop nav links */}
            <div className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {navItems.map((item) => {
                  const active = currentPath === item.href
                  return (
                    <li key={item.href}>
                      <button
                        onClick={() => onNavigate(item.href)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                          active
                            ? 'bg-amber/10 text-amber border border-amber/20'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-card',
                        )}
                      >
                        {item.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Right side — wallet & settings */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-xl border border-border bg-bg-card/50 text-text-muted hover:text-amber hover:border-amber/30 transition-all"
                title="DAO Settings"
              >
                <Settings size={16} />
              </button>

              <div className="h-4 w-[1px] bg-border mx-1" />

              {isWrongNetwork && (
                <button
                  onClick={switchToSepolia}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red/10 border border-red/30 rounded-lg text-red font-mono text-xs hover:bg-red/20 transition-colors"
                >
                  <AlertTriangle size={12} />
                  Switch Network
                </button>
              )}
              {isConnected && address ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-jade/10 border border-jade/20 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-jade shadow-[0_0_6px_rgba(46,204,113,0.8)] animate-pulse" />
                  <span className="font-mono text-xs text-jade">{shortAddr(address)}</span>
                </div>
              ) : (
                <button
                  onClick={connect}
                  className="flex items-center gap-2 px-4 py-2 border border-amber/40 text-amber font-mono text-xs rounded-xl hover:bg-amber/10 transition-all duration-150 hover:border-amber hover:shadow-[0_0_12px_rgba(245,166,35,0.2)]"
                >
                  <Wallet size={13} />
                  Connect Wallet
                </button>
              )}
            </div>
            {showSettings && <SwitchDAOModal onClose={() => setShowSettings(false)} />}
          </motion.div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden mx-4 mt-1 rounded-2xl border border-border bg-bg-secondary/95 backdrop-blur-xl p-5 shadow-2xl">
            <ul className="space-y-1 mb-5">
              {navItems.map((item) => {
                const active = currentPath === item.href
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => { onNavigate(item.href); setMenuOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all',
                        active
                          ? 'bg-amber/10 text-amber border border-amber/20'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-card',
                      )}
                    >
                      {item.name}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="pt-4 border-t border-border">
              {isConnected && address ? (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-jade/10 border border-jade/20 rounded-xl w-fit">
                  <div className="w-2 h-2 rounded-full bg-jade animate-pulse" />
                  <span className="font-mono text-xs text-jade">{shortAddr(address)}</span>
                </div>
              ) : (
                <button
                  onClick={() => { connect(); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-amber/40 text-amber font-mono text-xs rounded-xl hover:bg-amber/10 transition-colors w-full justify-center"
                >
                  <Wallet size={13} />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
