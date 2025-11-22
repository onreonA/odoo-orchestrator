import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/templates/versions/[id]/rollback/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Template Version Rollback API', () => {
  let mockSupabase: any
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockProfile = {
    id: 'user-123',
    role: 'super_admin',
  }

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      neq: vi.fn(() => mockSupabase),
      single: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.clearAllMocks()
  })

  it('should rollback to version successfully', async () => {
    const mockVersion = {
      id: 'version-1',
      template_id: 'template-123',
      version: '1.0.0',
      structure: { modules: [] },
      is_current: false,
    }

    const updatedVersion = {
      ...mockVersion,
      is_current: true,
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.single
      .mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockVersion,
        error: null,
      })
      .mockResolvedValueOnce({
        data: updatedVersion,
        error: null,
      })

    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)

    const request = new Request('http://localhost/api/templates/versions/version-1/rollback', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'version-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.version).toEqual(updatedVersion)
    expect(data.version.is_current).toBe(true)
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const request = new Request('http://localhost/api/templates/versions/version-1/rollback', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'version-1' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 403 if user is not admin or consultant', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.single.mockResolvedValue({
      data: { role: 'company_user' },
      error: null,
    })

    const request = new Request('http://localhost/api/templates/versions/version-1/rollback', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'version-1' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should return 404 if version not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.single
      .mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

    const request = new Request('http://localhost/api/templates/versions/version-1/rollback', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'version-1' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Version not found')
  })
})

