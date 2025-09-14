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
  },
  {
    id: 3,
    program_name: 'Stipend Program C',
    organization: { name: 'Org C', city: 'San Francisco', state: 'CA' },
    cost_category: 'FREE_PLUS_STIPEND',
    prestige_level: 'highly-selective',
    grade_level: '9',
    location: 'San Francisco, CA',
    subject_area: 'Engineering',
    description: 'Engineering program with stipend',
    application_deadline: '2024-04-01',
    duration_weeks: 10,
    financial_aid: '$2000 stipend provided'
  },
  {
    id: 4,
    program_name: 'Low Cost Program D',
    organization: { name: 'Org D', city: 'Chicago', state: 'IL' },
    cost_category: 'LOW_COST',
    prestige_level: 'selective',
    grade_level: '12',
    location: 'Chicago, IL',
    subject_area: 'Arts',
    description: 'Affordable arts program',
    application_deadline: '2024-05-15',
    duration_weeks: 4,
    financial_aid: 'Need-based aid available'
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
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ programs: mockPrograms })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Cost Category Filter', () => {
    it('should show all programs by default', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
        expect(screen.getByText('Low Cost Program D')).toBeInTheDocument()
      })
    })

    it('should filter by FREE cost category', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const costFilter = screen.getByDisplayValue('All Costs')
      fireEvent.change(costFilter, { target: { value: 'FREE' } })

      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by PAID cost category', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
      })

      const costFilter = screen.getByDisplayValue('All Costs')
      fireEvent.change(costFilter, { target: { value: 'PAID' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by FREE_PLUS_STIPEND cost category', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
      })

      const costFilter = screen.getByDisplayValue('All Costs')
      fireEvent.change(costFilter, { target: { value: 'FREE_PLUS_STIPEND' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by LOW_COST cost category', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Low Cost Program D')).toBeInTheDocument()
      })

      const costFilter = screen.getByDisplayValue('All Costs')
      fireEvent.change(costFilter, { target: { value: 'LOW_COST' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.getByText('Low Cost Program D')).toBeInTheDocument()
      })
    })
  })

  describe('Prestige Level Filter', () => {
    it('should filter by elite prestige level', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
      })

      const prestigeFilter = screen.getByDisplayValue('All Levels')
      fireEvent.change(prestigeFilter, { target: { value: 'elite' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by accessible prestige level', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const prestigeFilter = screen.getByDisplayValue('All Levels')
      fireEvent.change(prestigeFilter, { target: { value: 'accessible' } })

      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by highly-selective prestige level', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
      })

      const prestigeFilter = screen.getByDisplayValue('All Levels')
      fireEvent.change(prestigeFilter, { target: { value: 'highly-selective' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by selective prestige level', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Low Cost Program D')).toBeInTheDocument()
      })

      const prestigeFilter = screen.getByDisplayValue('All Levels')
      fireEvent.change(prestigeFilter, { target: { value: 'selective' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.getByText('Low Cost Program D')).toBeInTheDocument()
      })
    })
  })

  describe('Grade Level Filter', () => {
    it('should filter by 10th grade', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const gradeFilter = screen.getByDisplayValue('All Grades')
      fireEvent.change(gradeFilter, { target: { value: '10' } })

      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by 11th grade', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
      })

      const gradeFilter = screen.getByDisplayValue('All Grades')
      fireEvent.change(gradeFilter, { target: { value: '11' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by 9th grade', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
      })

      const gradeFilter = screen.getByDisplayValue('All Grades')
      fireEvent.change(gradeFilter, { target: { value: '9' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by 12th grade', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Low Cost Program D')).toBeInTheDocument()
      })

      const gradeFilter = screen.getByDisplayValue('All Grades')
      fireEvent.change(gradeFilter, { target: { value: '12' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.getByText('Low Cost Program D')).toBeInTheDocument()
      })
    })
  })

  describe('Location Filter', () => {
    it('should filter by city name', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const locationFilter = screen.getByPlaceholderText('City, State...')
      fireEvent.change(locationFilter, { target: { value: 'Seattle' } })

      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by state name', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
      })

      const locationFilter = screen.getByPlaceholderText('City, State...')
      fireEvent.change(locationFilter, { target: { value: 'MA' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should filter by full location', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
      })

      const locationFilter = screen.getByPlaceholderText('City, State...')
      fireEvent.change(locationFilter, { target: { value: 'San Francisco' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })
  })

  describe('Global Search Filter', () => {
    it('should search by program name', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search programs...')
      fireEvent.change(searchInput, { target: { value: 'Free Program' } })

      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should search by organization name', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search programs...')
      fireEvent.change(searchInput, { target: { value: 'Org A' } })

      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should search by subject area', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search programs...')
      fireEvent.change(searchInput, { target: { value: 'Science' } })

      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should search by description', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search programs...')
      fireEvent.change(searchInput, { target: { value: 'elite tech' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })
  })

  describe('Combined Filters', () => {
    it('should work with multiple filters simultaneously', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
      })

      // Apply cost filter
      const costFilter = screen.getByDisplayValue('All Costs')
      fireEvent.change(costFilter, { target: { value: 'PAID' } })

      // Apply prestige filter
      const prestigeFilter = screen.getByDisplayValue('All Levels')
      fireEvent.change(prestigeFilter, { target: { value: 'elite' } })

      // Apply grade filter
      const gradeFilter = screen.getByDisplayValue('All Grades')
      fireEvent.change(gradeFilter, { target: { value: '11' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
      })
    })

    it('should show no results when filters don\'t match any programs', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      // Apply filters that won't match any program
      const costFilter = screen.getByDisplayValue('All Costs')
      fireEvent.change(costFilter, { target: { value: 'FREE' } })

      const prestigeFilter = screen.getByDisplayValue('All Levels')
      fireEvent.change(prestigeFilter, { target: { value: 'elite' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
        expect(screen.queryByText('Paid Program B')).not.toBeInTheDocument()
        expect(screen.queryByText('Stipend Program C')).not.toBeInTheDocument()
        expect(screen.queryByText('Low Cost Program D')).not.toBeInTheDocument()
        expect(screen.getByText('No programs found')).toBeInTheDocument()
      })
    })
  })

  describe('Clear Filters', () => {
    it('should clear all filters and show all programs', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
      })

      // Apply some filters
      const costFilter = screen.getByDisplayValue('All Costs')
      fireEvent.change(costFilter, { target: { value: 'FREE' } })

      const searchInput = screen.getByPlaceholderText('Search programs...')
      fireEvent.change(searchInput, { target: { value: 'test' } })

      await waitFor(() => {
        expect(screen.queryByText('Free Program A')).not.toBeInTheDocument()
      })

      // Clear all filters
      const clearButton = screen.getByText('Clear All Filters')
      fireEvent.click(clearButton)

      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
        expect(screen.getByText('Low Cost Program D')).toBeInTheDocument()
      })
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
        expect(screen.getByPlaceholderText('Search programs...')).toBeInTheDocument()
      })
    })

    it('should show all programs with default filter values', async () => {
      renderWithQueryClient(<ProgramsTable />)
      
      await waitFor(() => {
        expect(screen.getByText('Free Program A')).toBeInTheDocument()
        expect(screen.getByText('Paid Program B')).toBeInTheDocument()
        expect(screen.getByText('Stipend Program C')).toBeInTheDocument()
        expect(screen.getByText('Low Cost Program D')).toBeInTheDocument()
      })
    })
  })
})
