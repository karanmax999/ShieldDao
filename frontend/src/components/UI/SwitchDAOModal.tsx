import { useState } from 'react'
import { X, Save, RotateCcw, Shield, Globe, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDAO, type DAOConfig } from '../../context/DAOContext'
import { TerminalInput } from './TerminalInput'
import { CyberCard } from './CyberCard'
import { Button } from './button'

interface SwitchDAOModalProps {
  onClose: () => void
}

export const SwitchDAOModal = ({ onClose }: SwitchDAOModalProps) => {
  const { dao, updateDAO, resetToDefault } = useDAO()
  const [formData, setFormData] = useState<Partial<DAOConfig>>({
    name: dao.name,
    treasuryAddress: dao.treasuryAddress,
    governanceAddress: dao.governanceAddress,
    auditorAddress: dao.auditorAddress,
  })

  const handleSave = () => {
    updateDAO(formData)
    onClose()
  }

  const handleReset = () => {
    resetToDefault()
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-bg-primary/90 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl"
        >
          <CyberCard className="!p-0 overflow-hidden" variant="amber">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber/10 border border-amber/20">
                  <Globe size={18} className="text-amber" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-text-primary">DAO TERMINAL CONFIG</h2>
                  <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
                    Synchronize your own organization
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <TerminalInput 
                label="Organization Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                prefix="#"
                placeholder="e.g. My DAO"
              />

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-text-muted" />
                  <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Smart Contract Addresses</span>
                </div>
                
                <TerminalInput 
                  label="Treasury Contract"
                  value={formData.treasuryAddress}
                  onChange={e => setFormData({ ...formData, treasuryAddress: e.target.value })}
                  placeholder="0x..."
                />
                
                <TerminalInput 
                  label="Governance Contract"
                  value={formData.governanceAddress}
                  onChange={e => setFormData({ ...formData, governanceAddress: e.target.value })}
                  placeholder="0x..."
                />
                
                <TerminalInput 
                  label="Auditor Access Contract"
                  value={formData.auditorAddress}
                  onChange={e => setFormData({ ...formData, auditorAddress: e.target.value })}
                  placeholder="0x..."
                />
              </div>

              <div className="p-4 rounded-xl bg-amber/5 border border-amber/10 flex items-start gap-3">
                <Award size={16} className="text-amber mt-1 flex-shrink-0" />
                <p className="font-mono text-[10px] text-amber/70 leading-relaxed uppercase tracking-wider">
                  Configuring a custom DAO will update all analytical models and cryptographic hooks to target your organization's specific on-chain state.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="gap-2 border-white/10 text-text-muted hover:text-text-primary"
              >
                <RotateCcw size={14} />
                RESET TO SHIELD
              </Button>
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={onClose} className="text-text-muted">CANCEL</Button>
                <Button 
                  onClick={handleSave}
                  className="gap-2 bg-amber hover:bg-amber-dim text-bg-primary font-bold shadow-[0_0_15px_rgba(245,166,35,0.3)]"
                >
                  <Save size={14} />
                  SAVE CONFIG
                </Button>
              </div>
            </div>
          </CyberCard>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
