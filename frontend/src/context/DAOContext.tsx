import React, { createContext, useContext, useState, useEffect } from 'react'
import { CONTRACTS } from '../config/contracts'

export type DAOConfig = {
  name: string
  logo?: string
  treasuryAddress: string
  governanceAddress: string
  auditorAddress: string
  isCustom: boolean
}

interface DAOContextType {
  dao: DAOConfig
  updateDAO: (config: Partial<DAOConfig>) => void
  resetToDefault: () => void
}

const DEFAULT_DAO: DAOConfig = {
  name: 'ShieldDAO',
  treasuryAddress: CONTRACTS.treasury.address,
  governanceAddress: CONTRACTS.governance.address,
  auditorAddress: CONTRACTS.auditorAccess.address,
  isCustom: false
}

const DAOContext = createContext<DAOContextType | undefined>(undefined)

export const DAOProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dao, setDao] = useState<DAOConfig>(DEFAULT_DAO)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('shield_dao_config')
    if (saved) {
      try {
        setDao(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load DAO config:', e)
      }
    }
  }, [])

  const updateDAO = (config: Partial<DAOConfig>) => {
    const newDao = { ...dao, ...config, isCustom: true }
    setDao(newDao)
    localStorage.setItem('shield_dao_config', JSON.stringify(newDao))
  }

  const resetToDefault = () => {
    setDao(DEFAULT_DAO)
    localStorage.removeItem('shield_dao_config')
  }

  return (
    <DAOContext.Provider value={{ dao, updateDAO, resetToDefault }}>
      {children}
    </DAOContext.Provider>
  )
}

export const useDAO = () => {
  const context = useContext(DAOContext)
  if (!context) throw new Error('useDAO must be used within a DAOProvider')
  return context
}
