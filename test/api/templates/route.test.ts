import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/templates/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TemplateService } from '@/lib/services/template-service'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/template-service')

describe('GET /api/templates', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
  })

  it('should list templates', async () => {
    vi.mocked(TemplateService.listTemplates).mockResolvedValue([
      { id: '1', name: 'Template 1' },
      { id: '2', name: 'Template 2' },
    ] as any)

    const request = new NextRequest('http://localhost/api/templates')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
  })

  it('should filter by industry', async () => {
    vi.mocked(TemplateService.listTemplates).mockResolvedValue([
      { id: '1', name: 'Furniture Template' },
    ] as any)

    const request = new NextRequest('http://localhost/api/templates?industry=furniture')
    await GET(request)

    expect(TemplateService.listTemplates).toHaveBeenCalledWith({
      industry: 'furniture',
      is_active: undefined,
    })
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost/api/templates')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })
})

describe('POST /api/templates', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
  })

  it('should create template', async () => {
    const templateData = {
      id: '123',
      name: 'Test Template',
      industry: 'furniture',
    }

    vi.mocked(TemplateService.createTemplate).mockResolvedValue(templateData as any)

    const request = new NextRequest('http://localhost/api/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Template',
        industry: 'furniture',
        modules: [],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('Test Template')
  })

  it('should return 400 if missing required fields', async () => {
    const request = new NextRequest('http://localhost/api/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Template',
        // Missing industry and modules
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})




