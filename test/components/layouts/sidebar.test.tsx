import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/layouts/sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

describe('Sidebar Component', () => {
  const mockUser = {
    id: '123',
    full_name: 'Test User',
    email: 'test@example.com',
    role: 'super_admin',
  }

  it('renders logo', () => {
    render(<Sidebar user={mockUser} />)
    expect(screen.getByText('Odoo AI')).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    render(<Sidebar user={mockUser} />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Firmalar')).toBeInTheDocument()
    expect(screen.getByText('Projeler')).toBeInTheDocument()
    expect(screen.getByText('Destek')).toBeInTheDocument()
    expect(screen.getByText('Ayarlar')).toBeInTheDocument()
  })

  it('displays user information', () => {
    render(<Sidebar user={mockUser} />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
  })

  it('displays default user info when user is null', () => {
    render(<Sidebar user={null} />)

    // "Kullanıcı" appears twice (full_name and role), so use getAllByText
    const userTexts = screen.getAllByText('Kullanıcı')
    expect(userTexts.length).toBeGreaterThanOrEqual(1)
  })

  it('displays "Kullanıcı" role for non-admin users', () => {
    const regularUser = {
      ...mockUser,
      role: 'company_user',
    }

    render(<Sidebar user={regularUser} />)
    expect(screen.getByText('Kullanıcı')).toBeInTheDocument()
  })

  it('renders navigation links with correct hrefs', () => {
    render(<Sidebar user={mockUser} />)

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    const companiesLink = screen.getByText('Firmalar').closest('a')

    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    expect(companiesLink).toHaveAttribute('href', '/companies')
  })
})
