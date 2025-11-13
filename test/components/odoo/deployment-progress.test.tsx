import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DeploymentProgress } from '@/components/odoo/deployment-progress'

// Mock fetch
global.fetch = vi.fn()

describe('DeploymentProgress Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders deployment progress with initial status', () => {
    const mockStatus = {
      deploymentId: 'deployment-123',
      status: 'in_progress' as const,
      progress: 50,
      currentStep: 'Installing modules',
      startedAt: '2024-01-01T00:00:00Z',
    }

    render(<DeploymentProgress deploymentId="deployment-123" initialStatus={mockStatus} />)

    expect(screen.getByText('Deployment Durumu')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Installing modules')).toBeInTheDocument()
  })

  it('shows success status correctly', () => {
    const mockStatus = {
      deploymentId: 'deployment-123',
      status: 'success' as const,
      progress: 100,
      completedAt: '2024-01-01T00:05:00Z',
      durationSeconds: 300,
    }

    render(<DeploymentProgress deploymentId="deployment-123" initialStatus={mockStatus} />)

    expect(screen.getByText('Başarılı')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows error message when failed', () => {
    const mockStatus = {
      deploymentId: 'deployment-123',
      status: 'failed' as const,
      progress: 30,
      errorMessage: 'Module installation failed',
      startedAt: '2024-01-01T00:00:00Z',
    }

    render(<DeploymentProgress deploymentId="deployment-123" initialStatus={mockStatus} />)

    expect(screen.getByText('Başarısız')).toBeInTheDocument()
    expect(screen.getByText(/Module installation failed/)).toBeInTheDocument()
  })

  it('polls for status updates', async () => {
    const mockStatus = {
      deploymentId: 'deployment-123',
      status: 'in_progress' as const,
      progress: 50,
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        deployment: {
          ...mockStatus,
          progress: 75,
        },
      }),
    } as Response)

    render(<DeploymentProgress deploymentId="deployment-123" initialStatus={mockStatus} />)

    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalledWith('/api/odoo/deployments/deployment-123')
      },
      { timeout: 3000 }
    )
  })
})
