import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  application_deadline: "2026-03-01",
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
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Basic Rendering Tests', () => {
    it('should render modal with program details', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={mockProgram} 
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('Test Summer Program')).toBeInTheDocument()
      expect(screen.getAllByText('Test Organization')).toHaveLength(2) // Header and details section
      expect(screen.getAllByText('Seattle, WA')).toHaveLength(2) // Header and details section
      expect(screen.getByText('8 weeks')).toBeInTheDocument()
    })

    it('should render close button', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={mockProgram} 
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('×')).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
      const mockOnClose = vi.fn()
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={mockProgram} 
            isOpen={true} 
            onClose={mockOnClose} 
          />
        </TestWrapper>
      )
      
      const closeButton = screen.getByText('×')
      fireEvent.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Program Information Display', () => {
    it('should display program name in header', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={mockProgram} 
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('Test Summer Program')).toBeInTheDocument()
    })

    it('should display organization name', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={mockProgram} 
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      )
      
      expect(screen.getAllByText('Test Organization')).toHaveLength(2)
    })

    it('should display location information', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={mockProgram} 
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      )
      
      expect(screen.getAllByText('Seattle, WA')).toHaveLength(2)
    })

    it('should display duration', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={mockProgram} 
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('8 weeks')).toBeInTheDocument()
    })
  })

  describe('Cost Category Display', () => {
    it('should display FREE cost category', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={mockProgram} 
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      )
      
      expect(screen.getAllByText('🆓 Free')).toHaveLength(2) // Header and details section
    })

    it('should display PAID cost category', () => {
      const paidProgram = { ...mockProgram, cost_category: 'PAID' }
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={paidProgram} 
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      )
      
      expect(screen.getAllByText('💸 Paid')).toHaveLength(2)
    })
  })

  describe('Modal Behavior', () => {
    it('should not render when isOpen is false', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={mockProgram} 
            isOpen={false} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      )
      
      expect(screen.queryByText('Test Summer Program')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(
        <TestWrapper>
          <ProgramDetailsModal 
            program={mockProgram} 
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      )
      
      expect(screen.getByText('Test Summer Program')).toBeInTheDocument()
    })
  })
})