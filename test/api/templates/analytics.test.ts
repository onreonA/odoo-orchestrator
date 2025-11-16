import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { GET } from '@/app/api/templates/[id]/analytics/route'
import cache from '@/lib/utils/cache'

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
  CacheKeys: {
    templateAnalytics: (id: string, range?: string) => `template:analytics:${id}:${range || '30'}`,
  },
}))

describe('Template Analytics API', () => {
  let mockSupabase: any
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  beforeEach(() => {
    // Create a proper chain mock
    const createChain = () => ({
      select: vi.fn(() => createChain()),
      eq: vi.fn(() => createChain()),
      gte: vi.fn(() => createChain()),
      order: vi.fn(() => createChain()),
      single: vi.fn(() => createChain()),
    })

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => createChain()),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.clearAllMocks()
  })

  it('should get template analytics successfully', async () => {
    const mockAnalytics = [
      {
        id: 'analytics-1',
        template_id: 'template-123',
        date: '2025-11-16',
        usage_count: 5,
        success_count: 4,
        failure_count: 1,
      },
    ]

    const mockDeployments = [
      {
        status: 'completed',
        created_at: new Date().toISOString(),
        duration_seconds: 120,
      },
    ]

    const mockFeedback = [
      {
        rating: 5,
        created_at: new Date().toISOString(),
      },
    ]

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    // Create chain mocks for each query
    const analyticsChain = {
      select: vi.fn(() => analyticsChain),
      eq: vi.fn(() => analyticsChain),
      gte: vi.fn(() => analyticsChain),
      order: vi.fn().mockResolvedValue({ data: mockAnalytics, error: null }),
    }

    const deploymentsChain = {
      select: vi.fn(() => deploymentsChain),
      eq: vi.fn().mockResolvedValue({ data: mockDeployments, error: null }),
    }

    const feedbackChain = {
      select: vi.fn(() => feedbackChain),
      eq: vi.fn().mockResolvedValue({ data: mockFeedback, error: null }),
    }

    mockSupabase.from
      .mockReturnValueOnce(analyticsChain)
      .mockReturnValueOnce(deploymentsChain)
      .mockReturnValueOnce(feedbackChain)

    const request = new Request('http://localhost/api/templates/template-123/analytics')
    const response = await GET(request, { params: Promise.resolve({ id: 'template-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.analytics).toEqual(mockAnalytics)
    expect(data.deployments).toEqual(mockDeployments)
    expect(data.feedback).toEqual(mockFeedback)
  })

  it('should filter by date range', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    const analyticsChain = {
      select: vi.fn(() => analyticsChain),
      eq: vi.fn(() => analyticsChain),
      gte: vi.fn(() => analyticsChain),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const deploymentsChain = {
      select: vi.fn(() => deploymentsChain),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const feedbackChain = {
      select: vi.fn(() => feedbackChain),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    mockSupabase.from
      .mockReturnValueOnce(analyticsChain)
      .mockReturnValueOnce(deploymentsChain)
      .mockReturnValueOnce(feedbackChain)

    const request = new Request('http://localhost/api/templates/template-123/analytics?range=7')
    await GET(request, { params: Promise.resolve({ id: 'template-123' }) })

    expect(analyticsChain.gte).toHaveBeenCalled()
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const request = new Request('http://localhost/api/templates/template-123/analytics')
    const response = await GET(request, { params: Promise.resolve({ id: 'template-123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should handle empty analytics', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    const analyticsChain = {
      select: vi.fn(() => analyticsChain),
      eq: vi.fn(() => analyticsChain),
      gte: vi.fn(() => analyticsChain),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const deploymentsChain = {
      select: vi.fn(() => deploymentsChain),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const feedbackChain = {
      select: vi.fn(() => feedbackChain),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    mockSupabase.from
      .mockReturnValueOnce(analyticsChain)
      .mockReturnValueOnce(deploymentsChain)
      .mockReturnValueOnce(feedbackChain)

    const request = new Request('http://localhost/api/templates/template-123/analytics')
    const response = await GET(request, { params: Promise.resolve({ id: 'template-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.analytics).toEqual([])
    expect(data.deployments).toEqual([])
    expect(data.feedback).toEqual([])
  })
})
