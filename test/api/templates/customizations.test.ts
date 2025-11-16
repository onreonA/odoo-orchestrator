import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { GET, PUT } from '@/app/api/templates/customizations/[id]/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Template Customizations API', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
  }

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })
    vi.clearAllMocks()
  })

  describe('GET /api/templates/customizations/[id]', () => {
    it('should get customization successfully', async () => {
      const customization = {
        id: 'customization-123',
        template_id: 'template-123',
        name: 'My Customization',
        customizations: { modules: [] },
        version: '1.0.0',
      }

      mockSupabase.single.mockResolvedValue({
        data: customization,
        error: null,
      })

      const request = new Request('http://localhost/api/templates/customizations/customization-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'customization-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.customization).toEqual(customization)
      expect(mockSupabase.from).toHaveBeenCalledWith('template_customizations')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'customization-123')
    })

    it('should return 401 if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new Request('http://localhost/api/templates/customizations/customization-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'customization-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 if customization not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      })

      const request = new Request('http://localhost/api/templates/customizations/customization-123')
      const response = await GET(request, { params: Promise.resolve({ id: 'customization-123' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Customization not found')
    })
  })

  describe('PUT /api/templates/customizations/[id]', () => {
    it('should update customization successfully', async () => {
      const existingCustomization = {
        id: 'customization-123',
        template_id: 'template-123',
        name: 'Old Name',
        customizations: { modules: [] },
        version: '1.0.0',
        created_by: 'user-123',
      }

      const updatedCustomization = {
        ...existingCustomization,
        name: 'New Name',
        version: '1.0.1',
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: existingCustomization,
        error: null,
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: updatedCustomization,
        error: null,
      })

      const request = new Request(
        'http://localhost/api/templates/customizations/customization-123',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'New Name',
            customizations: { modules: [] },
          }),
        }
      )

      const response = await PUT(request, { params: Promise.resolve({ id: 'customization-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.customization.name).toBe('New Name')
      expect(data.customization.version).toBe('1.0.1')
    })

    it('should return 403 if user is not owner', async () => {
      const existingCustomization = {
        id: 'customization-123',
        created_by: 'other-user',
      }

      mockSupabase.single.mockResolvedValue({
        data: existingCustomization,
        error: null,
      })

      const request = new Request(
        'http://localhost/api/templates/customizations/customization-123',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New Name' }),
        }
      )

      const response = await PUT(request, { params: Promise.resolve({ id: 'customization-123' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })
})
