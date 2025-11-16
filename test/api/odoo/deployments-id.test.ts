import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'
import { GET } from '@/app/api/odoo/deployments/[id]/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/deployment-monitoring-service', () => ({
  getDeploymentMonitoringService: vi.fn(),
}))

describe('Odoo Deployment Status API', () => {
  let mockSupabase: any
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.clearAllMocks()
  })

  it('should get deployment status successfully', async () => {
    const mockDeploymentStatus = {
      id: 'deployment-1',
      instance_id: 'instance-123',
      template_id: 'template-123',
      status: 'completed',
      progress: 100,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      logs: ['Deployment started', 'Deployment completed'],
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    const mockMonitoringService = {
      getDeploymentStatus: vi.fn().mockResolvedValue(mockDeploymentStatus),
    }

    vi.mocked(getDeploymentMonitoringService).mockReturnValue(mockMonitoringService as any)

    const request = new NextRequest('http://localhost/api/odoo/deployments/deployment-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'deployment-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.deployment).toEqual(mockDeploymentStatus)
    expect(mockMonitoringService.getDeploymentStatus).toHaveBeenCalledWith('deployment-1')
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const request = new NextRequest('http://localhost/api/odoo/deployments/deployment-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'deployment-1' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should handle service errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    const mockMonitoringService = {
      getDeploymentStatus: vi.fn().mockRejectedValue(new Error('Deployment not found')),
    }

    vi.mocked(getDeploymentMonitoringService).mockReturnValue(mockMonitoringService as any)

    const request = new NextRequest('http://localhost/api/odoo/deployments/deployment-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'deployment-1' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Deployment not found')
  })

  it('should handle in-progress deployment status', async () => {
    const mockDeploymentStatus = {
      id: 'deployment-1',
      status: 'in_progress',
      progress: 50,
      logs: ['Deployment started', 'Installing modules...'],
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    const mockMonitoringService = {
      getDeploymentStatus: vi.fn().mockResolvedValue(mockDeploymentStatus),
    }

    vi.mocked(getDeploymentMonitoringService).mockReturnValue(mockMonitoringService as any)

    const request = new NextRequest('http://localhost/api/odoo/deployments/deployment-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'deployment-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.deployment.status).toBe('in_progress')
    expect(data.deployment.progress).toBe(50)
  })
})
