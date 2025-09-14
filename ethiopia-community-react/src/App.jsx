import React from 'react'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProgramsTable from './components/ProgramsTable'
import Header from './components/Header'
import './App.css'

// Create Chakra UI v3 system
const system = createSystem(defaultConfig)

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <div className="App">
          <Header />
          <ProgramsTable />
        </div>
      </ChakraProvider>
    </QueryClientProvider>
  )
}

export default App