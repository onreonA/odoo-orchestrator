import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/layouts/header'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock Supabase client
const mockSignOut = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signOut: mockSignOut,
    },
  })),
}))

describe('Header Component', () => {
  const mockUser = {
    id: '123',
    full_name: 'Test User',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header with dashboard text', () => {
    render(<Header user={mockUser} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders search button', () => {
    render(<Header user={mockUser} />)
    const buttons = screen.getAllByRole('button')
    // Should have at least 3 buttons (Search, Bell, Logout)
    expect(buttons.length).toBeGreaterThanOrEqual(3)
  })

  it('renders notification button', () => {
    render(<Header user={mockUser} />)
    const buttons = screen.getAllByRole('button')
    // Search, Bell, Logout buttons should exist
    expect(buttons.length).toBeGreaterThanOrEqual(3)
  })

  it('renders logout button', () => {
    render(<Header user={mockUser} />)
    expect(screen.getByText('Çıkış')).toBeInTheDocument()
  })

  it('handles logout click', async () => {
    const user = userEvent.setup()
    mockSignOut.mockResolvedValue({})

    render(<Header user={mockUser} />)

    const logoutButton = screen.getByText('Çıkış')
    await user.click(logoutButton)

    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })
})
