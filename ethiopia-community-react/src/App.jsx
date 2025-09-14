import React from 'react'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProgramsTable from './components/ProgramsTable'
import Header from './components/Header'
import './App.css'

// Custom theme with Ethiopian colors
const theme = extendTheme({
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    ethiopian: {
      green: '#078B3C',
      yellow: '#FCDD09',
      red: '#DA121A',
    }
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
})

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <div className="App">
          <Header />
          <ProgramsTable />
        </div>
      </ChakraProvider>
    </QueryClientProvider>
  )
}

export default App