import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../contexts/AuthContext'
import Header from '../components/Header'

// Mock Supabase Auth
vi.mock('../services/supabaseAuth', () => ({
  default: {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    getUser: vi.fn(() => Promise.resolve(null)),
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn()
  }
}))

// Mock fetch for stats API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      totalPrograms: 170,
      freePrograms: 45,
      organizations: 25
    })
  })
)

const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders sign in button when user is not authenticated', async () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })
  })

  test('renders user info when authenticated', async () => {
    // Mock authenticated user
    const mockUser = { email: 'test@example.com' }
    
    vi.mocked(require('../services/supabaseAuth').default.getUser)
      .mockResolvedValueOnce(mockUser)

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument()
    })
  })
})
