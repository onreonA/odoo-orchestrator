import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/odoo/instances/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/odoo-instance-service')

describe('GET /api/odoo/instances', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
  }

  const mockInstanceService = {
    getAllInstances: vi.fn(),
    getInstanceInfo: vi.fn(),
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(getOdooInstanceService).mockReturnValue(mockInstanceService as any)
    vi.clearAllMocks()
  })

  it('should return instances for super admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValue({
      data: { role: 'super_admin', company_id: null },
      error: null,
    })

    const mockInstances = [
      {
        id: 'instance-1',
        instance_name: 'Instance 1',
        instance_url: 'https://instance1.odoo.com',
        status: 'active',
      },
    ]

    mockInstanceService.getAllInstances.mockResolvedValue(mockInstances)

    const request = new NextRequest('http://localhost/api/odoo/instances')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.instances).toHaveLength(1)
    expect(mockInstanceService.getAllInstances).toHaveBeenCalled()
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost/api/odoo/instances')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should return company instance for company admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValue({
      data: { role: 'company_admin', company_id: 'company-123' },
      error: null,
    })

    const mockInstance = {
      id: 'instance-1',
      instance_name: 'Company Instance',
      instance_url: 'https://company.odoo.com',
      status: 'active',
    }

    mockInstanceService.getInstanceInfo.mockResolvedValue(mockInstance)

    const request = new NextRequest('http://localhost/api/odoo/instances')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.instances).toHaveLength(1)
    expect(mockInstanceService.getInstanceInfo).toHaveBeenCalledWith('company-123')
  })
})

describe('POST /api/odoo/instances', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
  }

  const mockInstanceService = {
    createInstance: vi.fn(),
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(getOdooInstanceService).mockReturnValue(mockInstanceService as any)
    vi.clearAllMocks()
  })

  it('should create instance successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValue({
      data: { role: 'super_admin', company_id: null },
      error: null,
    })

    const mockInstance = {
      id: 'new-instance',
      instance_name: 'test-instance',
      instance_url: 'https://test-instance.odoo.com',
      status: 'active',
    }

    mockInstanceService.createInstance.mockResolvedValue(mockInstance)

    const request = new NextRequest('http://localhost/api/odoo/instances', {
      method: 'POST',
      body: JSON.stringify({
        companyId: 'company-123',
        deploymentMethod: 'odoo_com',
        instanceName: 'test-instance',
        databaseName: 'test_db',
        version: '17.0',
        adminUsername: 'admin',
        adminPassword: 'password',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.instance).toBeDefined()
    expect(mockInstanceService.createInstance).toHaveBeenCalled()
  })

  it('should return 400 if missing required fields', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValue({
      data: { role: 'super_admin', company_id: null },
      error: null,
    })

    const request = new NextRequest('http://localhost/api/odoo/instances', {
      method: 'POST',
      body: JSON.stringify({
        // Missing required fields
        companyId: 'company-123',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should return 403 if user is not authorized', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.single.mockResolvedValue({
      data: { role: 'company_user', company_id: 'company-123' },
      error: null,
    })

    const request = new NextRequest('http://localhost/api/odoo/instances', {
      method: 'POST',
      body: JSON.stringify({
        companyId: 'company-123',
        deploymentMethod: 'odoo_com',
        instanceName: 'test-instance',
        databaseName: 'test_db',
        version: '17.0',
        adminUsername: 'admin',
        adminPassword: 'password',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(403)
  })
})
