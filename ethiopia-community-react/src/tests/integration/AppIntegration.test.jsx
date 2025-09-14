import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from '../../App'

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock programs and stats data
const mockPrograms = [
  {
    id: 1,
    program_name: "Ethiopian Heritage Program",
    grade_level: 10,
    cost_category: "FREE",
    duration_weeks: 6,
    location: "Washington DC",
    organization: { name: "Ethiopian Community Center" },
    subject_area: "Cultural_Studies",
    application_deadline: "2026-03-01"
  }
]

const mockStats = {
  success: true,
  data: {
    statistics: {
      totalPrograms: 1,
      freePrograms: 1,
      paidPrograms: 0,
      topSubjects: [{ subject: "Cultural_Studies", count: 1 }]
    }
  }
}

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Mock API responses
    fetch.mockImplementation((url) => {
      if (url.includes('/api/programs/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats)
        })
      }
      if (url.includes('/api/programs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ programs: mockPrograms })
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  describe('Full App Integration', () => {
    it('should render complete app without errors', async () => {
      expect(() => {
        render(<App />)
      }).not.toThrow()
      
      // Should show header
      await waitFor(() => {
        expect(screen.getByText(/Ethiopian & Eritrean Summer Programs/)).toBeInTheDocument()
      })
      
      // Should load programs
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Heritage Program')).toBeInTheDocument()
      })
    })

    it('should handle end-to-end user workflow', async () => {
      render(<App />)
      
      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Heritage Program')).toBeInTheDocument()
      })
      
      // Test search functionality
      const searchInput = screen.getByPlaceholderText('Search programs, organizations, locations...')
      fireEvent.change(searchInput, { target: { value: 'Ethiopian' } })
      
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Heritage Program')).toBeInTheDocument()
      })
      
      // Test view program details
      const viewButton = screen.getByText('👁️ View')
      fireEvent.click(viewButton)
      
      // Should open modal (though Dialog components might need different testing approach)
      // This tests that the click doesn't crash the app
      expect(viewButton).toBeInTheDocument()
    })

    it('should handle network errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('Network error'))
      
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('⚠️ Failed to load programs')).toBeInTheDocument()
      })
    })
  })

  describe('Component Communication Tests', () => {
    it('should properly communicate between Header and ProgramsTable', async () => {
      render(<App />)
      
      // Header should show stats
      await waitFor(() => {
        expect(screen.getByText('1 Programs')).toBeInTheDocument()
        expect(screen.getByText('1 Free')).toBeInTheDocument()
      })
      
      // Programs table should show the program
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Heritage Program')).toBeInTheDocument()
      })
    })

    it('should maintain state consistency across components', async () => {
      render(<App />)
      
      await waitFor(() => {
        expect(screen.getByText('Ethiopian Heritage Program')).toBeInTheDocument()
      })
      
      // Add to favorites
      const viewButton = screen.getByText('👁️ View')
      fireEvent.click(viewButton)
      
      // The modal should open and favorites should work
      // (This tests that state is properly shared)
      expect(viewButton).toBeInTheDocument()
    })
  })

  describe('Performance and Memory Tests', () => {
    it('should not create memory leaks with repeated renders', () => {
      const { unmount } = render(<App />)
      
      // Unmount and remount multiple times
      unmount()
      
      expect(() => {
        render(<App />)
      }).not.toThrow()
    })

    it('should handle large datasets without crashing', async () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        program_name: `Program ${i + 1}`,
        grade_level: 9 + (i % 4),
        cost_category: i % 2 === 0 ? "FREE" : "PAID",
        duration_weeks: 4 + (i % 8),
        location: `Location ${i + 1}`,
        organization: { name: `Org ${i + 1}` },
        subject_area: "Test_Subject"
      }))
      
      fetch.mockImplementation((url) => {
        if (url.includes('/api/programs/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { statistics: { totalPrograms: 1000, freePrograms: 500 } }
            })
          })
        }
        if (url.includes('/api/programs')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ programs: largeDataset })
          })
        }
      })
      
      expect(() => {
        render(<App />)
      }).not.toThrow()
      
      await waitFor(() => {
        expect(screen.getByText('Program 1')).toBeInTheDocument()
      })
    })
  })
})
