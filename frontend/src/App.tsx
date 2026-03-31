import { useState } from 'react'
import Navbar from './components/Layout/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Treasury from './pages/Treasury'
import Governance from './pages/Governance'
import Auditor from './pages/Auditor'

export default function App() {
  const [currentPath, setCurrentPath] = useState('/')

  const renderPage = () => {
    switch (currentPath) {
      case '/':           return <Landing onNavigate={setCurrentPath} />
      case '/dashboard':  return <Dashboard />
      case '/treasury':   return <Treasury />
      case '/governance': return <Governance />
      case '/auditor':    return <Auditor />
      default:            return <Landing onNavigate={setCurrentPath} />
    }
  }

  // Landing page uses full-bleed layout; inner pages get padded container
  const isLanding = currentPath === '/'

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar currentPath={currentPath} onNavigate={setCurrentPath} />
      <main>
        {isLanding ? (
          renderPage()
        ) : (
          <div className="pt-20 max-w-7xl mx-auto px-6 lg:px-12 py-8">
            {renderPage()}
          </div>
        )}
      </main>
    </div>
  )
}
