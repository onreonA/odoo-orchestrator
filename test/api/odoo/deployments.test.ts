import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/odoo/deployments/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTemplateDeploymentEngine } from '@/lib/services/template-deployment-engine'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/template-deployment-engine')
vi.mock('@/lib/services/deployment-monitoring-service')

describe('GET /api/odoo/deployments', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  }

  const mockMonitoringService = {
    getDeploymentHistory: vi.fn(),
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(getDeploymentMonitoringService).mockReturnValue(mockMonitoringService as any)
    vi.clearAllMocks()
  })

  it('should return deployments list', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockDeployments = [
      {
        deploymentId: 'deployment-1',
        status: 'success',
        progress: 100,
      },
      {
        deploymentId: 'deployment-2',
        status: 'in_progress',
        progress: 50,
      },
    ]

    mockMonitoringService.getDeploymentHistory.mockResolvedValue(mockDeployments)

    const request = new NextRequest('http://localhost/api/odoo/deployments')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.deployments).toHaveLength(2)
    expect(mockMonitoringService.getDeploymentHistory).toHaveBeenCalled()
  })

  it('should filter deployments by instanceId', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockMonitoringService.getDeploymentHistory.mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/odoo/deployments?instanceId=instance-123')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockMonitoringService.getDeploymentHistory).toHaveBeenCalledWith(
      expect.objectContaining({ instanceId: 'instance-123' })
    )
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost/api/odoo/deployments')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })
})

describe('POST /api/odoo/deployments', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  }

  const mockDeploymentEngine = {
    deployTemplate: vi.fn(),
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(getTemplateDeploymentEngine).mockReturnValue(mockDeploymentEngine as any)
    vi.clearAllMocks()
  })

  it('should create deployment successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockDeployment = {
      deploymentId: 'deployment-123',
      status: 'pending',
      progress: 0,
    }

    mockDeploymentEngine.deployTemplate.mockResolvedValue(mockDeployment)

    const request = new NextRequest('http://localhost/api/odoo/deployments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceId: 'instance-123',
        templateId: 'template-123',
        templateType: 'hr',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.deployment).toBeDefined()
    expect(mockDeploymentEngine.deployTemplate).toHaveBeenCalled()
  })

  it('should return 400 if missing required fields', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const request = new NextRequest('http://localhost/api/odoo/deployments', {
      method: 'POST',
      body: JSON.stringify({
        // Missing required fields
        instanceId: 'instance-123',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
