import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { WalletProvider } from './context/WalletContext'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import './styles/globals.css'

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </Router>
      </WalletProvider>
    </ThemeProvider>
  )
}

export default App
