import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import ProgramsTable from '../components/ProgramsTable'

// Mock API calls
global.fetch = vi.fn()

// Create test wrapper
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const system = createSystem(defaultConfig)

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        {children}
      </ChakraProvider>
    </QueryClientProvider>
  )
}

// Mock programs data
const mockPrograms = [
  {
    id: 1,
    program_name: "Test Program 1",
    grade_level: 9,
    cost_category: "FREE",
    duration_weeks: 6,
    location: "Seattle, WA",
    organization: { name: "Test Org 1" },
    subject_area: "Computer_Science",
    application_deadline: "2026-03-01"
  },
  {
    id: 2,
    program_name: "Test Program 2", 
    grade_level: 11,
    cost_category: "PAID",
    duration_weeks: 8,
    location: "Boston, MA",
    organization: { name: "Test Org 2" },
    subject_area: "Mathematics",
    application_deadline: "2026-04-15"
  },
  {
    id: 3,
    program_name: "Test Program 3",
    grade_level: 10,
    cost_category: "FREE_PLUS_STIPEND",
    duration_weeks: 4,
    location: "Various",
    organization: { name: "Test Org 3" },
    subject_area: "STEM",
    application_deadline: "2026-05-20"
  }
]

describe('ProgramsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Mock successful API response
    fetch.mockImplementation((url) => {
      if (url.includes('/api/programs/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ programs: mockPrograms })
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  describe('Component Loading and API Tests', () => {
    it('should render loading state initially', async () => {
      // Mock a delayed response to see loading state
      fetch.mockImplementation((url) => {
        if (url.includes('/api/programs/search')) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ programs: mockPrograms })
              })
            }, 100)
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })
      
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      expect(screen.getByText('Loading programs...')).toBeInTheDocument()
      
      // Wait for programs to load
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      })
    })

    it('should load and display programs from API', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
        expect(screen.getByText('Test Program 2')).toBeInTheDocument()
        expect(screen.getByText('Test Program 3')).toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/api/programs/search')) {
          return Promise.reject(new Error('API Error'))
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })
      
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Programs')).toBeInTheDocument()
      })
    })

    it('should call correct API endpoint', () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/programs/search'))
    })
  })

  describe('Basic UI Tests', () => {
    it('should render search input', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search programs, organizations, locations...')).toBeInTheDocument()
      })
    })

    it('should render filters button', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })
    })
  })
})
