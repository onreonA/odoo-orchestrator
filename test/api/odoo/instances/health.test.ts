import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'
import { GET } from '@/app/api/odoo/instances/[id]/health/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/odoo-instance-service', () => ({
  getOdooInstanceService: vi.fn(),
}))

describe('Odoo Instance Health API', () => {
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

  it('should check instance health successfully', async () => {
    const mockHealthStatus = {
      status: 'healthy',
      uptime: 3600,
      response_time_ms: 150,
      last_check: new Date().toISOString(),
      details: {
        database: 'connected',
        modules: 45,
      },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    const mockService = {
      checkHealth: vi.fn().mockResolvedValue(mockHealthStatus),
    }

    vi.mocked(getOdooInstanceService).mockReturnValue(mockService as any)

    const request = new Request('http://localhost/api/odoo/instances/instance-123/health')
    const response = await GET(request, { params: Promise.resolve({ id: 'instance-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.health).toEqual(mockHealthStatus)
    expect(mockService.checkHealth).toHaveBeenCalledWith('instance-123')
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const request = new Request('http://localhost/api/odoo/instances/instance-123/health')
    const response = await GET(request, { params: Promise.resolve({ id: 'instance-123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should handle service errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    const mockService = {
      checkHealth: vi.fn().mockRejectedValue(new Error('Instance not found')),
    }

    vi.mocked(getOdooInstanceService).mockReturnValue(mockService as any)

    const request = new Request('http://localhost/api/odoo/instances/instance-123/health')
    const response = await GET(request, { params: Promise.resolve({ id: 'instance-123' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Instance not found')
  })

  it('should handle unhealthy status', async () => {
    const mockHealthStatus = {
      status: 'unhealthy',
      uptime: 0,
      response_time_ms: 0,
      last_check: new Date().toISOString(),
      details: {
        error: 'Connection timeout',
      },
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    const mockService = {
      checkHealth: vi.fn().mockResolvedValue(mockHealthStatus),
    }

    vi.mocked(getOdooInstanceService).mockReturnValue(mockService as any)

    const request = new Request('http://localhost/api/odoo/instances/instance-123/health')
    const response = await GET(request, { params: Promise.resolve({ id: 'instance-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.health.status).toBe('unhealthy')
  })
})
