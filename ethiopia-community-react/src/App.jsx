import React, { useState } from 'react'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import ProgramsTable from './components/ProgramsTable'
import Favorites from './components/Favorites'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import './App.css'

// Create Chakra UI v3 system
const system = createSystem(defaultConfig)

const queryClient = new QueryClient()

function App() {
  const [activeTab, setActiveTab] = useState('programs')

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <AuthProvider>
          <div className="App">
            <Header />
            
            {/* Navigation Tabs */}
            <div style={{
              background: 'white',
              borderBottom: '1px solid #e5e7eb',
              padding: '0 20px'
            }}>
              <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                gap: '32px'
              }}>
                <button
                  onClick={() => setActiveTab('programs')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '16px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: activeTab === 'programs' ? '#3b82f6' : '#6b7280',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'programs' ? '2px solid #3b82f6' : '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  All Programs
                </button>
                
                <button
                  onClick={() => setActiveTab('favorites')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '16px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: activeTab === 'favorites' ? '#3b82f6' : '#6b7280',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'favorites' ? '2px solid #3b82f6' : '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  My Favorites
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 200px)' }}>
              {activeTab === 'programs' ? (
                <ProgramsTable />
              ) : (
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              )}
            </div>
          </div>
        </AuthProvider>
      </ChakraProvider>
    </QueryClientProvider>
  )
}

export default App