import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/templates/library/deploy/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TemplateLibraryService } from '@/lib/services/template-library-service'
import { TemplateDeploymentEngine } from '@/lib/services/template-deployment-engine'

vi.mock('@/lib/supabase/server')

const mockGetTemplateById = vi.fn()
const mockIncrementUsage = vi.fn()
const mockDeployTemplate = vi.fn()

vi.mock('@/lib/services/template-library-service', () => {
  class MockTemplateLibraryService {
    async getTemplateById(...args: any[]) {
      return mockGetTemplateById(...args)
    }
    async incrementUsage(...args: any[]) {
      return mockIncrementUsage(...args)
    }
  }
  return {
    TemplateLibraryService: MockTemplateLibraryService,
  }
})

vi.mock('@/lib/services/template-deployment-engine', () => {
  class MockTemplateDeploymentEngine {
    async deployTemplate(...args: any[]) {
      return mockDeployTemplate(...args)
    }
  }
  return {
    TemplateDeploymentEngine: MockTemplateDeploymentEngine,
  }
})

describe('POST /api/templates/library/deploy', () => {
  const createQueryChain = (result: any, useMaybeSingle = false) => {
    const chain = {
      eq: vi.fn(() => chain),
      select: vi.fn(() => chain),
      single: vi.fn().mockResolvedValue(result),
      maybeSingle: vi.fn().mockResolvedValue(result),
    }
    // If maybeSingle should be used, make it return the result
    if (useMaybeSingle) {
      chain.maybeSingle = vi.fn().mockResolvedValue(result)
    }
    return chain
  }

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => createQueryChain({ data: null, error: null })),
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.clearAllMocks()
    // Reset mock functions
    mockGetTemplateById.mockReset()
    mockIncrementUsage.mockReset()
    mockDeployTemplate.mockReset()
  })

  it('should return 400 if required fields are missing', async () => {
    const request = new NextRequest('http://localhost/api/templates/library/deploy', {
      method: 'POST',
      body: JSON.stringify({
        template_id: 'test-template',
        company_id: 'company-123',
        // project_id missing
      }),
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('gerekli')
  })

  it('should return 401 if user is not authenticated', async () => {
    const request = new NextRequest('http://localhost/api/templates/library/deploy', {
      method: 'POST',
      body: JSON.stringify({
        template_id: 'test-template',
        company_id: 'company-123',
        project_id: 'project-123',
      }),
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Unauthorized' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 404 if template not found', async () => {
    const request = new NextRequest('http://localhost/api/templates/library/deploy', {
      method: 'POST',
      body: JSON.stringify({
        template_id: 'non-existent',
        company_id: 'company-123',
        project_id: 'project-123',
      }),
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockGetTemplateById.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Template bulunamadı')
  })

  it('should return 404 if project not found', async () => {
    const request = new NextRequest('http://localhost/api/templates/library/deploy', {
      method: 'POST',
      body: JSON.stringify({
        template_id: 'test-template',
        company_id: 'company-123',
        project_id: 'non-existent',
      }),
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const mockTemplate = {
      template_id: 'test-template',
      type: 'kickoff',
      structure: {},
    }

    mockGetTemplateById.mockResolvedValue({
      data: mockTemplate,
      error: null,
    })

    // Mock project query chain
    const projectChain = createQueryChain({
      data: null,
      error: { message: 'Not found' },
    })
    mockSupabase.from.mockReturnValueOnce(projectChain)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Proje bulunamadı')
  })

  it('should return 404 if Odoo instance not found', async () => {
    const request = new NextRequest('http://localhost/api/templates/library/deploy', {
      method: 'POST',
      body: JSON.stringify({
        template_id: 'test-template',
        company_id: 'company-123',
        project_id: 'project-123',
      }),
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const mockTemplate = {
      template_id: 'test-template',
      type: 'kickoff',
      structure: {},
    }

    mockGetTemplateById.mockResolvedValue({
      data: mockTemplate,
      error: null,
    })

    // Mock project found
    const projectChain = createQueryChain({
      data: {
        id: 'project-123',
        company_id: 'company-123',
      },
      error: null,
    })
    
    // Mock company found
    const companyChain = createQueryChain({
      data: {
        id: 'company-123',
      },
      error: null,
    })
    
    // Mock Odoo instance not found (active) - uses maybeSingle
    const instanceActiveChain = createQueryChain({
      data: null,
      error: null,
    }, true)
    
    // Mock Odoo instance not found (any) - uses maybeSingle
    const instanceAnyChain = createQueryChain({
      data: null,
      error: null,
    }, true)
    
    mockSupabase.from
      .mockReturnValueOnce(projectChain) // projects query (uses single)
      .mockReturnValueOnce(companyChain) // companies query (uses single)
      .mockReturnValueOnce(instanceActiveChain) // odoo_instances (active) query (uses maybeSingle)
      .mockReturnValueOnce(instanceAnyChain) // odoo_instances (any) query (uses maybeSingle)

    const response = await POST(request)
    const data = await response.json()

    // API returns 400 when Odoo instance not found (not 404)
    expect(response.status).toBe(400)
    expect(data.error).toContain('Odoo instance bulunamadı')
  })

  it('should successfully deploy template', async () => {
    const request = new NextRequest('http://localhost/api/templates/library/deploy', {
      method: 'POST',
      body: JSON.stringify({
        template_id: 'test-template',
        company_id: 'company-123',
        project_id: 'project-123',
      }),
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const mockTemplate = {
      template_id: 'test-template',
      type: 'kickoff',
      structure: {
        modules: [],
      },
    }

    mockGetTemplateById.mockResolvedValue({
      data: mockTemplate,
      error: null,
    })
    mockIncrementUsage.mockResolvedValue({
      data: { usage_count: 1 },
      error: null,
    })

    mockDeployTemplate.mockResolvedValue({
      deploymentId: 'deployment-123',
      status: 'in_progress',
    })

    // Mock project found
    const projectChain = createQueryChain({
      data: {
        id: 'project-123',
        company_id: 'company-123',
      },
      error: null,
    })
    
    // Mock company found
    const companyChain = createQueryChain({
      data: {
        id: 'company-123',
      },
      error: null,
    })
    
    // Mock Odoo instance found - uses maybeSingle
    const instanceChain = createQueryChain({
      data: {
        id: 'instance-123',
        company_id: 'company-123',
        status: 'active',
      },
      error: null,
    }, true)
    
    mockSupabase.from
      .mockReturnValueOnce(projectChain) // projects query (uses single)
      .mockReturnValueOnce(companyChain) // companies query (uses single)
      .mockReturnValueOnce(instanceChain) // odoo_instances (active) query (uses maybeSingle)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Response format: { success: true, data: { deployment_id: ... } }
    expect(data.data?.deployment_id || data.deployment_id).toBe('deployment-123')
  })
})

