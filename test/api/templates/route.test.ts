import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { GET } from '@/app/api/templates/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/utils/cache', () => ({
  default: {
    get: vi.fn(() => null),
    set: vi.fn(),
  },
  cached: vi.fn(async (key: string, fn: () => Promise<any>) => {
    return await fn()
  }),
}))

describe('Templates API - GET /api/templates', () => {
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
      select: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.clearAllMocks()
  })

  it('should get all templates successfully', async () => {
    const mockTemplates = [
      {
        id: 'template-1',
        name: 'Test Template 1',
        type: 'kickoff',
        version: '1.0.0',
        created_at: new Date().toISOString(),
      },
      {
        id: 'template-2',
        name: 'Test Template 2',
        type: 'bom',
        version: '1.0.0',
        created_at: new Date().toISOString(),
      },
    ]

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.order.mockResolvedValue({
      data: mockTemplates,
      error: null,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockTemplates)
    expect(mockSupabase.from).toHaveBeenCalledWith('templates')
    expect(mockSupabase.select).toHaveBeenCalledWith('*')
    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return empty array if no templates', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('should handle database errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    // Mock cached function to throw error
    const { cached } = await import('@/lib/utils/cache')
    vi.mocked(cached).mockRejectedValueOnce(new Error('Database error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
  })

  it('should handle unexpected errors', async () => {
    mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unexpected error')
  })
})
