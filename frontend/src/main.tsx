import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DAOProvider } from './context/DAOContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DAOProvider>
      <App />
    </DAOProvider>
  </StrictMode>,
)
