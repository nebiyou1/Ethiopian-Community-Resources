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
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ programs: mockPrograms })
    })
  })

  describe('Component Loading and API Tests', () => {
    it('should render loading state initially', () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      expect(screen.getByText('Loading programs...')).toBeInTheDocument()
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
      fetch.mockRejectedValue(new Error('API Error'))
      
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('⚠️ Failed to load programs')).toBeInTheDocument()
      })
    })

    it('should call correct API endpoint', () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/programs')
    })
  })

  describe('Grade Level Range Display Tests', () => {
    it('should display correct grade ranges for all programs', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        // Grade 9 should show as "Grades 9-10"
        expect(screen.getByText('Grades 9-10')).toBeInTheDocument()
        // Grade 11 should show as "Grades 10-12"
        expect(screen.getByText('Grades 10-12')).toBeInTheDocument()
        // Grade 10 should show as "Grades 9-11"
        expect(screen.getByText('Grades 9-11')).toBeInTheDocument()
      })
    })
  })

  describe('Filtering Tests', () => {
    it('should filter programs by search term', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search programs, organizations, locations...')
      fireEvent.change(searchInput, { target: { value: 'Test Program 1' } })
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
        expect(screen.queryByText('Test Program 2')).not.toBeInTheDocument()
      })
    })

    it('should filter programs by cost category', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      })
      
      // Open advanced filters
      const filtersButton = screen.getByText(/⚙️ Filters/)
      fireEvent.click(filtersButton)
      
      // Click FREE cost filter
      const freeButton = screen.getByText('🆓 Free')
      fireEvent.click(freeButton)
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
        expect(screen.queryByText('Test Program 2')).not.toBeInTheDocument() // PAID program
      })
    })

    it('should filter programs by grade level with range logic', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      })
      
      // Open advanced filters
      const filtersButton = screen.getByText(/⚙️ Filters/)
      fireEvent.click(filtersButton)
      
      // Filter by 10th grade
      const grade10Button = screen.getByText('10th Grade')
      fireEvent.click(grade10Button)
      
      await waitFor(() => {
        // Should show programs that accept 10th graders:
        // - Test Program 1 (grade 9, range 9-10) ✓
        // - Test Program 2 (grade 11, range 10-12) ✓  
        // - Test Program 3 (grade 10, range 9-11) ✓
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
        expect(screen.getByText('Test Program 2')).toBeInTheDocument()
        expect(screen.getByText('Test Program 3')).toBeInTheDocument()
      })
    })

    it('should clear all filters correctly', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      })
      
      // Apply a filter
      const searchInput = screen.getByPlaceholderText('Search programs, organizations, locations...')
      fireEvent.change(searchInput, { target: { value: 'Test Program 1' } })
      
      // Open advanced filters and clear
      const filtersButton = screen.getByText(/⚙️ Filters/)
      fireEvent.click(filtersButton)
      
      const clearButton = screen.getByText('🗑️ Clear All Filters')
      fireEvent.click(clearButton)
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
        expect(screen.getByText('Test Program 2')).toBeInTheDocument()
        expect(screen.getByText('Test Program 3')).toBeInTheDocument()
      })
    })
  })

  describe('Sorting Tests', () => {
    it('should sort programs by name', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      })
      
      const nameSort = screen.getByText('📝 Name')
      fireEvent.click(nameSort)
      
      // Should be sorted alphabetically by default (ascending)
      const programElements = screen.getAllByText(/Test Program \d/)
      expect(programElements[0]).toHaveTextContent('Test Program 1')
      expect(programElements[1]).toHaveTextContent('Test Program 2')
      expect(programElements[2]).toHaveTextContent('Test Program 3')
    })

    it('should toggle sort order when clicking same sort button', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      })
      
      const nameSort = screen.getByText('📝 Name')
      
      // First click - ascending (default)
      fireEvent.click(nameSort)
      expect(screen.getByText('📝 Name↑')).toBeInTheDocument()
      
      // Second click - descending
      fireEvent.click(nameSort)
      expect(screen.getByText('📝 Name↓')).toBeInTheDocument()
    })

    it('should sort by cost category correctly', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      })
      
      const costSort = screen.getByText('💰 Cost')
      fireEvent.click(costSort)
      
      // Should sort by cost priority (FREE first, then others)
      expect(screen.getByText('💰 Cost↑')).toBeInTheDocument()
    })
  })

  describe('View Mode Tests', () => {
    it('should switch between table and cards view', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      })
      
      // Switch to cards view
      const cardsButton = screen.getByText('🃏 Cards')
      fireEvent.click(cardsButton)
      
      // Should still show programs but in card format
      expect(screen.getByText('Test Program 1')).toBeInTheDocument()
      
      // Switch back to table
      const tableButton = screen.getByText('📊 Table')
      fireEvent.click(tableButton)
      
      expect(screen.getByText('Test Program 1')).toBeInTheDocument()
    })
  })

  describe('Export Functionality Tests', () => {
    it('should render export button with correct count', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Export (3)')).toBeInTheDocument()
      })
    })

    it('should update export count when filtering', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('Export (3)')).toBeInTheDocument()
      })
      
      // Apply filter
      const searchInput = screen.getByPlaceholderText('Search programs, organizations, locations...')
      fireEvent.change(searchInput, { target: { value: 'Test Program 1' } })
      
      await waitFor(() => {
        expect(screen.getByText('Export (1)')).toBeInTheDocument()
      })
    })
  })

  describe('Results Count Tests', () => {
    it('should display correct results count', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Showing 3 of 3 programs/)).toBeInTheDocument()
      })
    })

    it('should update results count when filtering', async () => {
      render(
        <TestWrapper>
          <ProgramsTable />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Showing 3 of 3 programs/)).toBeInTheDocument()
      })
      
      // Apply filter
      const searchInput = screen.getByPlaceholderText('Search programs, organizations, locations...')
      fireEvent.change(searchInput, { target: { value: 'Test Program 1' } })
      
      await waitFor(() => {
        expect(screen.getByText(/Showing 1 of 3 programs/)).toBeInTheDocument()
      })
    })
  })

  describe('Data Structure Validation Tests', () => {
    it('should handle programs with missing data gracefully', async () => {
      const incompletePrograms = [
        {
          id: 1,
          program_name: "Incomplete Program"
          // Missing other fields
        }
      ]
      
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: incompletePrograms })
      })
      
      expect(() => {
        render(
          <TestWrapper>
            <ProgramsTable />
          </TestWrapper>
        )
      }).not.toThrow()
      
      await waitFor(() => {
        expect(screen.getByText('Incomplete Program')).toBeInTheDocument()
      })
    })
  })
})
