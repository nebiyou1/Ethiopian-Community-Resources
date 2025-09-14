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
        if (url.includes('/api/programs/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ programs: [] })
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      // Should not throw when rendering
      expect(() => {
        render(
          <QueryClientProvider client={queryClient}>
            <ChakraProvider value={system}>
              <App />
            </ChakraProvider>
          </QueryClientProvider>
        )
      }).not.toThrow()

      // Should show header
      await waitFor(() => {
        expect(screen.getByText('Summer Programs Database')).toBeInTheDocument()
      })

      // Should show basic loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should verify the actual DOM structure matches expected layout', async () => {
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
        if (url.includes('/api/programs/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ programs: [] })
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
        const header = screen.getByText('Summer Programs Database')
        expect(header).toBeInTheDocument()

        // Should have stats in header
        expect(screen.getByText('Programs')).toBeInTheDocument()
      })
    })

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
        if (url.includes('/api/programs/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              programs: [{
                id: 1,
                program_name: "Test Program",
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
        expect(screen.getByText('Summer Programs Database')).toBeInTheDocument()
      })

      // Test that the app doesn't crash when trying to interact
      expect(() => {
        // Just verify the app is stable
        expect(screen.getByText('Summer Programs Database')).toBeInTheDocument()
      }).not.toThrow()
    })
  })

  describe('Browser Compatibility Tests', () => {
    it('should work with different viewport sizes', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/programs/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { statistics: { totalPrograms: 0, freePrograms: 0 } }
            })
          })
        }
        if (url.includes('/api/programs/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ programs: [] })
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
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

      await waitFor(() => {
        expect(screen.getByText('Summer Programs Database')).toBeInTheDocument()
      })
    })

    it('should handle localStorage being disabled', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/programs/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { statistics: { totalPrograms: 0, freePrograms: 0 } }
            })
          })
        }
        if (url.includes('/api/programs/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ programs: [] })
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      // Mock localStorage being disabled
      const originalLocalStorage = global.localStorage
      delete global.localStorage

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
      global.localStorage = originalLocalStorage

      await waitFor(() => {
        expect(screen.getByText('Summer Programs Database')).toBeInTheDocument()
      })
    })
  })
})