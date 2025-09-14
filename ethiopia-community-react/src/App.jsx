import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProgramsTable from './components/ProgramsTable'
import Header from './components/Header'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <div className="App">
          <Header />
          <ProgramsTable />
        </div>
      </ChakraProvider>
    </QueryClientProvider>
  )
}

export default App