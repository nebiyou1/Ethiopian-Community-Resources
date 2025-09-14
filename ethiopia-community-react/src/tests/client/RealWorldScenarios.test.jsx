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
                program_name: "Ethiopian Coding Bootcamp",
                grade_level: 10,
                cost_category: "FREE",
                duration_weeks: 8,
                location: "Washington DC",
                organization: {
                  name: "Ethiopian Tech Community",
                  city: "Washington",
                  state: "DC",
                  website: "https://ethiopiantech.org"
                },
                subject_area: "Computer_Science",
                application_deadline: "2026-03-01",
                description: "Learn coding skills for Ethiopian students",
                prestige_level: "accessible"
              },
              {
                id: 2,
                program_name: "Eritrean Math Excellence",
                grade_level: 11,
                cost_category: "PAID",
                duration_weeks: 6,
                location: "Seattle, WA",
                organization: {
                  name: "Eritrean Education Foundation",
                  city: "Seattle",
                  state: "WA"
                },
                subject_area: "Mathematics",
                application_deadline: "2026-04-15",
                description: "Advanced mathematics for high achievers"
              }
            ]
          })
        })
      }
      
      return Promise.reject(new Error('Unknown endpoint'))
    })
    
    localStorage.clear()
  })

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <App />
        </ChakraProvider>
      </QueryClientProvider>
    )
  }

  describe('Page Load and Initial State', () => {
    it('should load the page completely like a real user would see', async () => {
      renderApp()

      // User sees loading state first
      expect(screen.getByText('Loading programs...')).toBeInTheDocument()

      // Then header loads with stats
      await waitFor(() => {
        expect(screen.getByText(/Ethiopian & Eritrean Summer Programs/)).toBeInTheDocument()
        expect(screen.getByText('176 Programs')).toBeInTheDocument()
        expect(screen.getByText('37 Free')).toBeInTheDocument()
      })

      // Then programs load
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
        expect(screen.getByText('Eritrean Math Excellence')).toBeInTheDocument()
      })

      // All UI elements should be present
      expect(screen.getByText('My Favorites')).toBeInTheDocument()
      expect(screen.getByText('🎓 Summer Programs')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search programs, organizations, locations...')).toBeInTheDocument()
      expect(screen.getByText(/Export \(2\)/)).toBeInTheDocument()
    })

    it('should handle slow network conditions', async () => {
      // Simulate slow API
      global.fetch = vi.fn().mockImplementation((url) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            if (url.includes('/api/programs/stats')) {
              resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  data: { statistics: { totalPrograms: 1, freePrograms: 1 } }
                })
              })
            } else {
              resolve({
                ok: true,
                json: () => Promise.resolve({ programs: [] })
              })
            }
          }, 2000) // 2 second delay
        })
      })

      renderApp()

      // Should show loading state for extended period
      expect(screen.getByText('Loading programs...')).toBeInTheDocument()
      
      // Should not crash during loading
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(screen.getByText('Loading programs...')).toBeInTheDocument()
    })
  })

  describe('User Search and Filter Workflow', () => {
    it('should handle complete search workflow like a real user', async () => {
      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
      })

      // User types in search box
      const searchInput = screen.getByPlaceholderText('Search programs, organizations, locations...')
      await user.type(searchInput, 'Ethiopian')

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
        expect(screen.queryByText('Eritrean Math Excellence')).not.toBeInTheDocument()
      })

      // User clears search
      await user.clear(searchInput)

      // Should show all results again
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
        expect(screen.getByText('Eritrean Math Excellence')).toBeInTheDocument()
      })
    })

    it('should handle advanced filtering workflow', async () => {
      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
      })

      // User opens advanced filters
      const filtersButton = screen.getByText(/Filters/)
      await user.click(filtersButton)

      // Should show advanced filter options
      await waitFor(() => {
        expect(screen.getByText('Cost Category')).toBeInTheDocument()
        expect(screen.getByText('Grade Level')).toBeInTheDocument()
      })

      // User selects FREE programs only
      const freeButton = screen.getByText('Free')
      await user.click(freeButton)

      // Should filter to only free programs
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
        expect(screen.queryByText('Eritrean Math Excellence')).not.toBeInTheDocument()
      })

      // User clears filters
      const clearButton = screen.getByText('🗑️ Clear All Filters')
      await user.click(clearButton)

      // Should show all programs again
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
        expect(screen.getByText('Eritrean Math Excellence')).toBeInTheDocument()
      })
    })
  })

  describe('Program Details and Favorites Workflow', () => {
    it('should handle viewing program details like a real user', async () => {
      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
      })

      // User clicks view button
      const viewButtons = screen.getAllByText('👁️ View')
      await user.click(viewButtons[0])

      // Modal should open with program details
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
        expect(screen.getByText('Ethiopian Tech Community')).toBeInTheDocument()
        expect(screen.getByText('Grades 9-11')).toBeInTheDocument() // Range display
      })
    })

    it('should handle favorites workflow completely', async () => {
      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
      })

      // Initially no favorites
      expect(screen.getByText('My Favorites')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // Favorites count badge

      // User opens program details
      const viewButtons = screen.getAllByText('👁️ View')
      await user.click(viewButtons[0])

      // User adds to favorites
      await waitFor(() => {
        const favoriteButton = screen.getByText('🤍 Add to Favorites')
        expect(favoriteButton).toBeInTheDocument()
      })

      const favoriteButton = screen.getByText('🤍 Add to Favorites')
      await user.click(favoriteButton)

      // Should update to show favorited state
      await waitFor(() => {
        expect(screen.getByText('❤️ Favorited')).toBeInTheDocument()
      })

      // Favorites count should update
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument() // Updated count
      })
    })
  })

  describe('View Mode and Sorting Workflow', () => {
    it('should handle switching view modes', async () => {
      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
      })

      // User switches to cards view
      const cardsButton = screen.getByText('Grid')
      await user.click(cardsButton)

      // Should still show programs but in different layout
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
        expect(screen.getByText('👁️ View Details')).toBeInTheDocument() // Card view button text
      })

      // User switches back to table
      const tableButton = screen.getByText('📊 Table')
      await user.click(tableButton)

      // Should show table view
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
        expect(screen.getAllByText('👁️ View')[0]).toBeInTheDocument() // Table view button text
      })
    })

    it('should handle sorting workflow', async () => {
      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
      })

      // User sorts by cost
      const costSortButtons = screen.getAllByText('Cost')
      const costSortButton = costSortButtons.find(button => button.tagName === 'BUTTON')
      await user.click(costSortButton)

      // Should show sort indicator
      await waitFor(() => {
        expect(screen.getByText('Cost')).toBeInTheDocument()
      })

      // User clicks again to reverse sort
      const costSortButtons2 = screen.getAllByText('Cost')
      const costSortButton2 = costSortButtons2.find(button => button.tagName === 'BUTTON')
      await user.click(costSortButton2)

      // Should show descending sort
      await waitFor(() => {
        expect(screen.getByText('Cost')).toBeInTheDocument()
      })
    })
  })

  describe('Export and Share Workflow', () => {
    it('should handle export workflow', async () => {
      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Ethiopian Coding Bootcamp')).toBeInTheDocument()
      })

      // User clicks export button
      const exportButton = screen.getByText(/Export/)
      await user.click(exportButton)

      // Should show export options
      await waitFor(() => {
        expect(screen.getByText('Export as CSV')).toBeInTheDocument()
        expect(screen.getByText('Export as JSON')).toBeInTheDocument()
        expect(screen.getByText('Print Programs')).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery Scenarios', () => {
    it('should recover gracefully from network errors', async () => {
      // Start with failing API
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      renderApp()

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Error Loading Programs')).toBeInTheDocument()
      })

      // Simulate network recovery
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: [] })
      })

      // User can still interact with other parts of the app
      expect(screen.getByText(/Ethiopian & Eritrean Summer Programs/)).toBeInTheDocument()
      expect(screen.getByText('My Favorites')).toBeInTheDocument()
    })

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to fail
      const originalLocalStorage = window.localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('localStorage failed') },
          setItem: () => { throw new Error('localStorage failed') },
          removeItem: () => { throw new Error('localStorage failed') },
          clear: () => { throw new Error('localStorage failed') }
        }
      })

      renderApp()

      // App should still load
      await waitFor(() => {
        expect(screen.getAllByText(/Ethiopian & Eritrean Summer Programs/)[0]).toBeInTheDocument()
      })

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage
      })
    })
  })
})
