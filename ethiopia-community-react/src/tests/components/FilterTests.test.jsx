import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ProgramsTable from '../../components/ProgramsTable'

// Mock the API response
const mockPrograms = [
  {
    id: 1,
    program_name: 'Free Program A',
    organization: { name: 'Org A', city: 'Seattle', state: 'WA' },
    cost_category: 'FREE',
    prestige_level: 'accessible',
    grade_level: '10',
    location: 'Seattle, WA',
    subject_area: 'Science',
    description: 'A free science program',
    application_deadline: '2024-03-15',
    duration_weeks: 6,
    financial_aid: 'Full scholarship available'
  },
  {
    id: 2,
    program_name: 'Paid Program B',
    organization: { name: 'Org B', city: 'Boston', state: 'MA' },
    cost_category: 'PAID',
    prestige_level: 'elite',
    grade_level: '11',
    location: 'Boston, MA',
    subject_area: 'Technology',
    description: 'An elite tech program',
    application_deadline: '2024-02-28',
    duration_weeks: 8,
    financial_aid: 'Limited scholarships'
  }
]

// Mock fetch
global.fetch = vi.fn()

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const renderWithQueryClient = (component) => {
  const testQueryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('ProgramsTable Filters', () => {
  beforeEach(() => {
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

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Filter UI', () => {
    it('should render all filter controls', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      // Check that all filter controls are rendered
      expect(screen.getByDisplayValue('All Costs')).toBeInTheDocument()
      expect(screen.getByDisplayValue('All Levels')).toBeInTheDocument()
      expect(screen.getByDisplayValue('All Grades')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('City, State...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search programs, organizations, locations...')).toBeInTheDocument()
    })

    it('should render programs table', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
      })
    })

    it('should allow typing in search input', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search programs, organizations, locations...')
      fireEvent.change(searchInput, { target: { value: 'test search' } })
      
      expect(searchInput.value).toBe('test search')
    })

    it('should allow typing in location input', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const locationInput = screen.getByPlaceholderText('City, State...')
      fireEvent.change(locationInput, { target: { value: 'Seattle' } })
      
      expect(locationInput.value).toBe('Seattle')
    })

    it('should allow changing cost category filter', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const costFilter = screen.getByDisplayValue('All Costs')
      fireEvent.change(costFilter, { target: { value: 'FREE' } })
      
      expect(costFilter.value).toBe('FREE')
    })

    it('should allow changing prestige level filter', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const prestigeFilter = screen.getByDisplayValue('All Levels')
      fireEvent.change(prestigeFilter, { target: { value: 'elite' } })
      
      expect(prestigeFilter.value).toBe('elite')
    })

    it('should allow changing grade level filter', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const gradeFilter = screen.getByDisplayValue('All Grades')
      fireEvent.change(gradeFilter, { target: { value: '10' } })
      
      expect(gradeFilter.value).toBe('10')
    })
  })

  describe('Filter Default Values', () => {
    it('should have correct default values for all filters', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('All Costs')).toBeInTheDocument()
        expect(screen.getByDisplayValue('All Levels')).toBeInTheDocument()
        expect(screen.getByDisplayValue('All Grades')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('City, State...')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Search programs, organizations, locations...')).toBeInTheDocument()
      })
    })

    it('should show all programs with default filter values', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
      })
    })
  })
})