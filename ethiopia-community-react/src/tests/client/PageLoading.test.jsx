import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import App from '../../App'

// Test to catch the actual page loading issues we've been having
describe('Client-Side Page Loading Tests', () => {
  let queryClient
  let system
  let originalFetch
  let originalConsoleError

  beforeEach(() => {
    // Create fresh instances for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    system = createSystem(defaultConfig)
    
    // Mock fetch
    originalFetch = global.fetch
    global.fetch = vi.fn()
    
    // Capture console errors to detect issues
    originalConsoleError = console.error
    console.error = vi.fn()
    
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    global.fetch = originalFetch
    console.error = originalConsoleError
  })

  describe('Critical Page Loading Issues', () => {
    it('should detect if page fails to load due to import errors', async () => {
      // Mock successful API calls
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/programs/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { statistics: { totalPrograms: 176, freePrograms: 37 } }
            })
          })
        }
        if (url.includes('/api/programs')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              programs: [{
                id: 1,
                program_name: "Test Program",
                grade_level: 10,
                cost_category: "FREE",
                organization: { name: "Test Org" }
              }]
            })
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      // This test will fail if there are import/component errors
      let renderError = null
      try {
        render(
          <QueryClientProvider client={queryClient}>
            <ChakraProvider value={system}>
              <App />
            </ChakraProvider>
          </QueryClientProvider>
        )
      } catch (error) {
        renderError = error
      }

      // Should not have rendering errors
      expect(renderError).toBeNull()
      
      // Should not have console errors from component issues
      expect(console.error).not.toHaveBeenCalledWith(
        expect.stringContaining('does not provide an export named')
      )
      
      // Should actually render the header
      await waitFor(() => {
        expect(screen.getByText(/Ethiopian & Eritrean Summer Programs/)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should detect Chakra UI component import issues specifically', async () => {
      // Mock API calls
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: [] })
      })

      let hasChakraError = false
      console.error = vi.fn((message) => {
        if (typeof message === 'string' && 
            (message.includes('does not provide an export named') ||
             message.includes('Modal') || 
             message.includes('Divider') ||
             message.includes('@chakra-ui/react'))) {
          hasChakraError = true
        }
      })

      try {
        render(
          <QueryClientProvider client={queryClient}>
            <ChakraProvider value={system}>
              <App />
            </ChakraProvider>
          </QueryClientProvider>
        )
        
        // Wait for potential async errors
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        if (error.message.includes('does not provide an export named')) {
          hasChakraError = true
        }
      }

      expect(hasChakraError).toBe(false)
    })

    it('should verify all critical components render without crashing', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/programs/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { statistics: { totalPrograms: 1, freePrograms: 1 } }
            })
          })
        }
        if (url.includes('/api/programs')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              programs: [{
                id: 1,
                program_name: "Test Program",
                grade_level: 10,
                cost_category: "FREE",
                duration_weeks: 6,
                location: "Test Location",
                organization: { name: "Test Org" },
                application_deadline: "2026-03-01"
              }]
            })
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <QueryClientProvider client={queryClient}>
          <ChakraProvider value={system}>
            <App />
          </ChakraProvider>
        </QueryClientProvider>
      )

      // Test that all critical components render
      await waitFor(() => {
        // Header should render
        expect(screen.getByText(/Ethiopian & Eritrean Summer Programs/)).toBeInTheDocument()
      })

      await waitFor(() => {
        // Programs table should render
        expect(screen.getByText('Test Program')).toBeInTheDocument()
      })

      await waitFor(() => {
        // Favorites panel should render
        expect(screen.getByText('My Favorites')).toBeInTheDocument()
      })

      await waitFor(() => {
        // Export button should render
        expect(screen.getByText(/Export/)).toBeInTheDocument()
      })

      await waitFor(() => {
        // Search functionality should render
        expect(screen.getByPlaceholderText('Search programs, organizations, locations...')).toBeInTheDocument()
      })
    })

    it('should detect if API calls are failing and causing page issues', async () => {
      // Simulate API failure
      global.fetch.mockRejectedValue(new Error('Network error'))

      render(
        <QueryClientProvider client={queryClient}>
          <ChakraProvider value={system}>
            <App />
          </ChakraProvider>
        </QueryClientProvider>
      )

      // Should still render header even with API failure
      await waitFor(() => {
        expect(screen.getByText(/Ethiopian & Eritrean Summer Programs/)).toBeInTheDocument()
      })

      // Should show error message, not crash
      await waitFor(() => {
        expect(screen.getByText('Error Loading Programs')).toBeInTheDocument()
      })
    })

    it('should verify the actual DOM structure matches expected layout', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/programs/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { statistics: { totalPrograms: 2, freePrograms: 1 } }
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
                  program_name: "Free Program",
                  grade_level: 10,
                  cost_category: "FREE",
                  organization: { name: "Test Org 1" }
                },
                {
                  id: 2,
                  program_name: "Paid Program", 
                  grade_level: 11,
                  cost_category: "PAID",
                  organization: { name: "Test Org 2" }
                }
              ]
            })
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <QueryClientProvider client={queryClient}>
          <ChakraProvider value={system}>
            <App />
          </ChakraProvider>
        </QueryClientProvider>
      )

      // Verify the page structure
      await waitFor(() => {
        // Should have header section
        const header = screen.getByText(/Ethiopian & Eritrean Summer Programs/)
        expect(header).toBeInTheDocument()

        // Should have stats in header
        expect(screen.getByText('2 Programs')).toBeInTheDocument()
        expect(screen.getByText('1 Free')).toBeInTheDocument()

        // Should have main content area
        expect(screen.getByText('🎓 Summer Programs')).toBeInTheDocument()
        expect(screen.getByText('Discover amazing opportunities for students')).toBeInTheDocument()

        // Should have favorites section
        expect(screen.getByText('My Favorites')).toBeInTheDocument()

        // Should have search and filters
        expect(screen.getByPlaceholderText('Search programs, organizations, locations...')).toBeInTheDocument()

        // Should show program data
        expect(screen.getByText('Free Program')).toBeInTheDocument()
        expect(screen.getByText('Paid Program')).toBeInTheDocument()
      })
    })
  })

  describe('Real User Interaction Tests', () => {
    it('should handle actual user clicks without errors', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/programs/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { statistics: { totalPrograms: 1, freePrograms: 1 } }
            })
          })
        }
        if (url.includes('/api/programs')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              programs: [{
                id: 1,
                program_name: "Clickable Program",
                grade_level: 10,
                cost_category: "FREE",
                organization: { name: "Test Org" },
                application_deadline: "2026-03-01"
              }]
            })
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <QueryClientProvider client={queryClient}>
          <ChakraProvider value={system}>
            <App />
          </ChakraProvider>
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Clickable Program')).toBeInTheDocument()
      })

      // Test that clicking view button doesn't crash
      const viewButton = screen.getByText('👁️ View')
      expect(() => {
        viewButton.click()
      }).not.toThrow()

      // Test that clicking filters doesn't crash
      const filtersButton = screen.getByText(/⚙️ Filters/)
      expect(() => {
        filtersButton.click()
      }).not.toThrow()

      // Test that typing in search doesn't crash
      const searchInput = screen.getByPlaceholderText('Search programs, organizations, locations...')
      expect(() => {
        searchInput.focus()
        // Simulate typing
        searchInput.value = 'test'
        searchInput.dispatchEvent(new Event('change', { bubbles: true }))
      }).not.toThrow()
    })
  })

  describe('Browser Compatibility Tests', () => {
    it('should work with different viewport sizes', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: [] })
      })

      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <ChakraProvider value={system}>
            <App />
          </ChakraProvider>
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/Ethiopian & Eritrean Summer Programs/)).toBeInTheDocument()
      })

      // Test desktop viewport
      window.innerWidth = 1920
      window.innerHeight = 1080
      window.dispatchEvent(new Event('resize'))

      // Should still work
      expect(screen.getByText(/Ethiopian & Eritrean Summer Programs/)).toBeInTheDocument()
    })

    it('should handle localStorage being disabled', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: [] })
      })

      // Mock localStorage to throw errors
      const originalLocalStorage = window.localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('localStorage disabled') },
          setItem: () => { throw new Error('localStorage disabled') },
          removeItem: () => { throw new Error('localStorage disabled') },
          clear: () => { throw new Error('localStorage disabled') }
        }
      })

      expect(() => {
        render(
          <QueryClientProvider client={queryClient}>
            <ChakraProvider value={system}>
              <App />
            </ChakraProvider>
          </QueryClientProvider>
        )
      }).not.toThrow()

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage
      })
    })
  })
})
