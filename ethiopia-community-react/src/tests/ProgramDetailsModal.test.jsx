import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import ProgramDetailsModal from '../components/ProgramDetailsModal'

// Mock toast hook
const mockToast = vi.fn()
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react')
  return {
    ...actual,
    useToast: () => mockToast,
  }
})

// Create test wrapper with providers
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

// Mock program data
const mockProgram = {
  id: 1,
  program_name: "Test Summer Program",
  grade_level: 10,
  cost_category: "FREE",
  duration_weeks: 8,
  application_deadline: "2026-03-01", // 1st of month (estimated)
  program_start_date: "2026-06-15",
  program_end_date: "2026-08-10",
  organization: {
    name: "Test Organization",
    city: "Seattle",
    state: "WA",
    website: "https://test.org"
  },
  subject_area: "Computer_Science",
  description: "A test program for computer science students",
  prestige_level: "selective",
  financial_aid: true,
  housing_provided: false
}

describe('ProgramDetailsModal', () => {
  let onCloseMock

  beforeEach(() => {
    onCloseMock = vi.fn()
    mockToast.mockClear()
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('Component Import and Rendering Tests', () => {
    it('should render without crashing', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={mockProgram} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('Test Summer Program')).toBeInTheDocument()
    })

    it('should handle null program gracefully', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={null} 
          />
        </TestWrapper>
      )
      
      // Should not render anything when program is null
      expect(screen.queryByText('Test Summer Program')).not.toBeInTheDocument()
    })

    it('should import all required Chakra UI components without errors', () => {
      // This test will fail if there are import issues
      expect(() => {
        render(
          <TestWrapper>
            <ProgramDetailsModal 
              isOpen={true} 
              onClose={onCloseMock} 
              program={mockProgram} 
            />
          </TestWrapper>
        )
      }).not.toThrow()
    })
  })

  describe('Grade Level Range Display Tests', () => {
    it('should display grade level as range for grade 10', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={mockProgram} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('Grades 9-11')).toBeInTheDocument()
    })

    it('should display correct range for different grade levels', () => {
      const testCases = [
        { grade: 6, expected: 'Grades 6-7' },
        { grade: 9, expected: 'Grades 9-10' },
        { grade: 11, expected: 'Grades 10-12' },
        { grade: 12, expected: 'Grades 11-12' },
      ]

      testCases.forEach(({ grade, expected }) => {
        const programWithGrade = { ...mockProgram, grade_level: grade }
        
        const { unmount } = render(
          <TestWrapper>
            <ProgramDetailsModal 
              isOpen={true} 
              onClose={onCloseMock} 
              program={programWithGrade} 
            />
          </TestWrapper>
        )
        
        expect(screen.getByText(expected)).toBeInTheDocument()
        unmount()
      })
    })

    it('should handle missing grade level', () => {
      const programWithoutGrade = { ...mockProgram, grade_level: null }
      
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={programWithoutGrade} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })

  describe('Estimated Deadline Tests', () => {
    it('should show asterisk for estimated deadlines (1st of month)', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={mockProgram} 
          />
        </TestWrapper>
      )
      
      // Should show asterisk for March 1st deadline
      expect(screen.getByText(/3\/1\/2026\*/)).toBeInTheDocument()
      expect(screen.getByText('*Estimated deadline')).toBeInTheDocument()
    })

    it('should show asterisk for 15th of month deadlines', () => {
      const programWith15th = {
        ...mockProgram,
        application_deadline: "2026-04-15"
      }
      
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={programWith15th} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText(/4\/15\/2026\*/)).toBeInTheDocument()
    })

    it('should NOT show asterisk for non-estimated deadlines', () => {
      const programWithSpecificDate = {
        ...mockProgram,
        application_deadline: "2026-03-23"
      }
      
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={programWithSpecificDate} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('3/23/2026')).toBeInTheDocument()
      expect(screen.queryByText(/\*/)).not.toBeInTheDocument()
    })
  })

  describe('Favorites Functionality Tests', () => {
    it('should add program to favorites when clicked', async () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={mockProgram} 
          />
        </TestWrapper>
      )
      
      const favoriteButton = screen.getByText('🤍 Add to Favorites')
      fireEvent.click(favoriteButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Added to favorites! ❤️",
            status: "success"
          })
        )
      })
      
      // Check localStorage
      const favorites = JSON.parse(localStorage.getItem('favoriteProgramsEthiopia') || '[]')
      expect(favorites).toHaveLength(1)
      expect(favorites[0].id).toBe(mockProgram.id)
    })

    it('should remove program from favorites when already favorited', async () => {
      // Pre-populate favorites
      localStorage.setItem('favoriteProgramsEthiopia', JSON.stringify([mockProgram]))
      
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={mockProgram} 
          />
        </TestWrapper>
      )
      
      const favoriteButton = screen.getByText('❤️ Favorited')
      fireEvent.click(favoriteButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Removed from favorites",
            status: "info"
          })
        )
      })
      
      // Check localStorage
      const favorites = JSON.parse(localStorage.getItem('favoriteProgramsEthiopia') || '[]')
      expect(favorites).toHaveLength(0)
    })
  })

  describe('Data Structure Validation Tests', () => {
    it('should handle missing organization data', () => {
      const programWithoutOrg = { ...mockProgram, organization: null }
      
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={programWithoutOrg} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('Unknown Organization')).toBeInTheDocument()
    })

    it('should handle missing optional fields gracefully', () => {
      const minimalProgram = {
        id: 1,
        program_name: "Minimal Program"
      }
      
      expect(() => {
        render(
          <TestWrapper>
            <ProgramDetailsModal 
              isOpen={true} 
              onClose={onCloseMock} 
              program={minimalProgram} 
            />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('should format cost categories correctly', () => {
      const testCases = [
        { cost: 'FREE', expected: '🆓 Free' },
        { cost: 'FREE_PLUS_STIPEND', expected: '💰 Free + Stipend' },
        { cost: 'PAID', expected: '💸 Paid' },
      ]

      testCases.forEach(({ cost, expected }) => {
        const programWithCost = { ...mockProgram, cost_category: cost }
        
        const { unmount } = render(
          <TestWrapper>
            <ProgramDetailsModal 
              isOpen={true} 
              onClose={onCloseMock} 
              program={programWithCost} 
            />
          </TestWrapper>
        )
        
        expect(screen.getByText(expected)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Error Handling Tests', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage error')
      })
      
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            isOpen={true} 
            onClose={onCloseMock} 
            program={mockProgram} 
          />
        </TestWrapper>
      )
      
      const favoriteButton = screen.getByText('🤍 Add to Favorites')
      fireEvent.click(favoriteButton)
      
      // Should show error toast
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          status: "error"
        })
      )
      
      // Restore localStorage
      localStorage.setItem = originalSetItem
    })

    it('should handle invalid date formats', () => {
      const programWithBadDate = {
        ...mockProgram,
        application_deadline: "invalid-date"
      }
      
      expect(() => {
        render(
          <TestWrapper>
            <ProgramDetailsModal 
              isOpen={true} 
              onClose={onCloseMock} 
              program={programWithBadDate} 
            />
          </TestWrapper>
        )
      }).not.toThrow()
    })
  })
})
