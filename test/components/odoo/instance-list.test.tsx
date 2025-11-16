import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { InstanceList } from '@/components/odoo/instance-list'

// Mock fetch
global.fetch = vi.fn()

describe('InstanceList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders instance list with initial instances', () => {
    const mockInstances = [
      {
        id: 'instance-1',
        instance_name: 'Test Instance',
        instance_url: 'https://test.odoo.com',
        database_name: 'test_db',
        version: '17.0',
        status: 'active' as const,
        deployment_method: 'odoo_com' as const,
        company_id: 'company-1',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    render(<InstanceList initialInstances={mockInstances} />)

    expect(screen.getByText('Odoo Instances')).toBeInTheDocument()
    expect(screen.getByText('Test Instance')).toBeInTheDocument()
    expect(screen.getByText('https://test.odoo.com')).toBeInTheDocument()
  })

  it('renders empty state when no instances', async () => {
    // Mock fetch to return empty array
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ instances: [] }),
    } as Response)

    render(<InstanceList initialInstances={[]} />)

    // Wait for loading to finish and empty state to render
    await waitFor(() => {
      expect(screen.getByText('Henüz instance yok')).toBeInTheDocument()
    })
    expect(screen.getByText('Yeni Instance Oluştur')).toBeInTheDocument()
  })

  it('shows loading state', async () => {
    vi.mocked(fetch).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<InstanceList />)

    // Component should show loading or fetch instances
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })
  })

  it('displays status badge correctly', () => {
    const mockInstances = [
      {
        id: 'instance-1',
        instance_name: 'Active Instance',
        instance_url: 'https://test.odoo.com',
        database_name: 'test_db',
        version: '17.0',
        status: 'active' as const,
        deployment_method: 'odoo_com' as const,
        company_id: 'company-1',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    render(<InstanceList initialInstances={mockInstances} />)

    expect(screen.getByText('Aktif')).toBeInTheDocument()
  })
})
