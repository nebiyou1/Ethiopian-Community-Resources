import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import App from '../../App'

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
    grade_level: 10,
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
  }
]

describe('App Integration Tests', () => {
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

  describe('Basic App Rendering', () => {
    it('should render the main app components', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )
      
      // Should render header
      expect(screen.getByText('Summer Programs Database')).toBeInTheDocument()
      
      // Should render search input
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search programs, organizations, locations...')).toBeInTheDocument()
      })
    })

    it('should render header with correct title', () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )
      
      expect(screen.getByText('Summer Programs Database')).toBeInTheDocument()
    })

    it('should render programs table when data loads', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
        expect(screen.getByText('Test Program 2')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should still render header even when API fails', async () => {
      fetch.mockImplementation((url) => {
        if (url.includes('/api/programs/search')) {
          return Promise.reject(new Error('API Error'))
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )
      
      // Header should still be visible
      expect(screen.getByText('Summer Programs Database')).toBeInTheDocument()
      
      // Should show loading state in header
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })
    })
  })

  describe('Component Integration', () => {
    it('should render all main components together', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )
      
      // Header
      expect(screen.getByText('Summer Programs Database')).toBeInTheDocument()
      
      // Search functionality
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search programs, organizations, locations...')).toBeInTheDocument()
      })
      
      // Programs when loaded
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      })
    })

    it('should handle search functionality', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )
      
      // Wait for search input to be available
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search programs, organizations, locations...')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search programs, organizations, locations...')
      fireEvent.change(searchInput, { target: { value: 'test search' } })
      
      // Should still show the search input with the new value
      expect(searchInput.value).toBe('test search')
    })
  })

  describe('Performance Tests', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <App />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('should handle multiple renders', () => {
      const { rerender } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )
      
      expect(() => {
        rerender(
          <TestWrapper>
            <App />
          </TestWrapper>
        )
      }).not.toThrow()
    })
  })
})