import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'
import { getTemplateDeploymentEngine } from '@/lib/services/template-deployment-engine'
import { GET, POST } from '@/app/api/odoo/deployments/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/deployment-monitoring-service', () => ({
  getDeploymentMonitoringService: vi.fn(),
}))

vi.mock('@/lib/services/template-deployment-engine', () => ({
  getTemplateDeploymentEngine: vi.fn(),
}))

describe('Odoo Deployments API', () => {
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

  describe('GET /api/odoo/deployments', () => {
    it('should list deployments successfully', async () => {
      const mockDeployments = [
        {
          id: 'deployment-1',
          instance_id: 'instance-123',
          template_id: 'template-123',
          status: 'completed',
          created_at: new Date().toISOString(),
        },
        {
          id: 'deployment-2',
          instance_id: 'instance-123',
          template_id: 'template-124',
          status: 'in_progress',
          created_at: new Date().toISOString(),
        },
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockMonitoringService = {
        getDeploymentHistory: vi.fn().mockResolvedValue(mockDeployments),
      }

      vi.mocked(getDeploymentMonitoringService).mockReturnValue(mockMonitoringService as any)

      const request = new Request('http://localhost/api/odoo/deployments')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.deployments).toEqual(mockDeployments)
    })

    it('should filter deployments by query parameters', async () => {
      const mockDeployments = [
        {
          id: 'deployment-1',
          instance_id: 'instance-123',
          status: 'completed',
        },
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockMonitoringService = {
        getDeploymentHistory: vi.fn().mockResolvedValue(mockDeployments),
      }

      vi.mocked(getDeploymentMonitoringService).mockReturnValue(mockMonitoringService as any)

      const request = new Request(
        'http://localhost/api/odoo/deployments?instanceId=instance-123&status=completed&limit=10&offset=0'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockMonitoringService.getDeploymentHistory).toHaveBeenCalledWith({
        instanceId: 'instance-123',
        templateType: undefined,
        status: 'completed',
        limit: 10,
        offset: 0,
      })
    })

    it('should return 401 if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new Request('http://localhost/api/odoo/deployments')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle service errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockMonitoringService = {
        getDeploymentHistory: vi.fn().mockRejectedValue(new Error('Service error')),
      }

      vi.mocked(getDeploymentMonitoringService).mockReturnValue(mockMonitoringService as any)

      const request = new Request('http://localhost/api/odoo/deployments')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Service error')
    })
  })

  describe('POST /api/odoo/deployments', () => {
    it('should create deployment successfully', async () => {
      const mockDeploymentProgress = {
        deploymentId: 'deployment-1',
        status: 'pending',
        progress: 0,
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockDeploymentEngine = {
        deployTemplate: vi.fn().mockResolvedValue(mockDeploymentProgress),
      }

      vi.mocked(getTemplateDeploymentEngine).mockReturnValue(mockDeploymentEngine as any)

      const request = new Request('http://localhost/api/odoo/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: 'instance-123',
          templateId: 'template-123',
          templateType: 'kickoff',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.deployment).toBeDefined()
      expect(data.deployment.deploymentId).toBe('deployment-1')
      expect(mockDeploymentEngine.deployTemplate).toHaveBeenCalled()
    })

    it('should return 400 if required fields are missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const request = new Request('http://localhost/api/odoo/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: 'instance-123',
          // Missing templateId and templateType
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 401 if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new Request('http://localhost/api/odoo/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: 'instance-123',
          templateId: 'template-123',
          templateType: 'kickoff',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
