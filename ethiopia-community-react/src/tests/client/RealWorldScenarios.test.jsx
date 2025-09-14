import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import App from '../../App'

// Real-world scenario tests that simulate actual user behavior
describe('Real-World Client-Side Scenarios', () => {
  let queryClient, system, user

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
        mutations: { retry: false },
      },
    })
    system = createSystem(defaultConfig)
    user = userEvent.setup()
    
    // Mock fetch with realistic data
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/programs/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              statistics: {
                totalPrograms: 176,
                freePrograms: 37,
                paidPrograms: 45,
                topSubjects: [
                  { subject: "Computer_Science", count: 25 },
                  { subject: "Mathematics", count: 18 }
                ]
              }
            }
          })
        })
      }
      
      if (url.includes('/api/programs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            programs: [
              {
                id: 1,
                program_name: 'Ethiopian Coding Bootcamp',
                organization: { name: 'Tech Ethiopia', city: 'Addis Ababa', state: 'AA' },
                cost_category: 'FREE',
                prestige_level: 'accessible',
                grade_level: '10',
                location: 'Addis Ababa, AA',
                subject_area: 'Computer Science',
                description: 'Intensive coding bootcamp for Ethiopian students',
                application_deadline: '2024-03-15',
                duration_weeks: 12,
                financial_aid: 'Full scholarship available'
              },
              {
                id: 2,
                program_name: 'Math Olympiad Prep',
                organization: { name: 'STEM Ethiopia', city: 'Bahir Dar', state: 'BD' },
                cost_category: 'LOW_COST',
                prestige_level: 'selective',
                grade_level: '11',
                location: 'Bahir Dar, BD',
                subject_area: 'Mathematics',
                description: 'Preparation for international math competitions',
                application_deadline: '2024-02-28',
                duration_weeks: 8,
                financial_aid: 'Need-based scholarships available'
              }
            ]
          })
        })
      }
      
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  const renderApp = () => {
    return render(
      <ChakraProvider value={system}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ChakraProvider>
    )
  }

  describe('Basic App Functionality', () => {
    it('should load the app and display header', async () => {
      renderApp()

      // Should show header
      await waitFor(() => {
        expect(screen.getByText(/Summer Programs Database/)).toBeInTheDocument()
      })

      // Should show loading state initially
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should display programs when loaded', async () => {
      renderApp()

      // Should show programs after loading
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
        expect(screen.getByText('Math Olympiad Prep')).toBeInTheDocument()
      })
    })

    it('should allow basic user interactions', async () => {
      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
      })

      // Should be able to interact with search input
      const searchInput = screen.getByPlaceholderText('Search programs, organizations, locations...')
      expect(searchInput).toBeInTheDocument()
      
      // Should be able to type in search
      fireEvent.change(searchInput, { target: { value: 'coding' } })
      expect(searchInput.value).toBe('coding')
    })

    it('should handle filter interactions', async () => {
      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
      })

      // Should be able to interact with cost filter
      const costFilter = screen.getByDisplayValue('All Costs')
      expect(costFilter).toBeInTheDocument()
      
      // Should be able to change filter
      fireEvent.change(costFilter, { target: { value: 'FREE' } })
      expect(costFilter.value).toBe('FREE')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      renderApp()

      // App should still render header
      await waitFor(() => {
        expect(screen.getByText(/Summer Programs Database/)).toBeInTheDocument()
      })

      // Should show loading state or handle error gracefully
      expect(screen.getByText('My Favorites')).toBeInTheDocument()
    })

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to fail
      const originalLocalStorage = window.localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => { throw new Error('localStorage error') }),
          setItem: vi.fn(() => { throw new Error('localStorage error') }),
          removeItem: vi.fn(() => { throw new Error('localStorage error') }),
          clear: vi.fn(() => { throw new Error('localStorage error') })
        },
        writable: true
      })

      renderApp()

      // App should still load
      await waitFor(() => {
        expect(screen.getByText(/Summer Programs Database/)).toBeInTheDocument()
      })

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      })
    })
  })
})