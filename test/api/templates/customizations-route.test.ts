import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/templates/customizations/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Template Customizations API - POST /api/templates/customizations', () => {
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
      from: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      single: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.clearAllMocks()
  })

  it('should create customization successfully', async () => {
    const customizationData = {
      id: 'customization-1',
      template_id: 'template-123',
      base_template_id: 'template-123',
      name: 'My Customization',
      customizations: {
        modules: [{ technical_name: 'sale', name: 'Sales' }],
      },
      version: '1.0.0',
      status: 'draft',
      created_by: mockUser.id,
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.single.mockResolvedValue({
      data: customizationData,
      error: null,
    })

    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/templates/customizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: 'template-123',
        name: 'My Customization',
        customizations: {
          modules: [{ technical_name: 'sale', name: 'Sales' }],
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.customization).toEqual(customizationData)
    expect(mockSupabase.from).toHaveBeenCalledWith('template_customizations')
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const request = new Request('http://localhost/api/templates/customizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: 'template-123',
        name: 'My Customization',
        customizations: {},
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if required fields are missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    const request = new Request('http://localhost/api/templates/customizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: 'template-123',
        // Missing name and customizations
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('should use base_template_id if provided', async () => {
    const customizationData = {
      id: 'customization-1',
      template_id: 'template-123',
      base_template_id: 'base-template-123',
      name: 'My Customization',
      customizations: {},
      version: '1.0.0',
      status: 'draft',
      created_by: mockUser.id,
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.single.mockResolvedValue({
      data: customizationData,
      error: null,
    })

    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/templates/customizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: 'template-123',
        base_template_id: 'base-template-123',
        name: 'My Customization',
        customizations: {},
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.customization.base_template_id).toBe('base-template-123')
  })

  it('should handle database errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    })

    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/templates/customizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: 'template-123',
        name: 'My Customization',
        customizations: {},
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
  })
})



