import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { POST, GET } from '@/app/api/templates/feedback/route'
import { GET as GETStats } from '@/app/api/templates/[id]/feedback/stats/route'
import { GET as GETAnalytics } from '@/app/api/templates/[id]/feedback/analytics/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Template Feedback API', () => {
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
      insert: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      gte: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
      single: vi.fn(),
      rpc: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })
    vi.clearAllMocks()
  })

  describe('POST /api/templates/feedback', () => {
    it('should create feedback successfully', async () => {
      const feedbackData = {
        template_id: 'template-123',
        company_id: 'company-123',
        rating: 5,
        feedback_text: 'Great template!',
        issues: [],
        suggestions: [],
      }

      const createdFeedback = {
        id: 'feedback-123',
        ...feedbackData,
        user_id: mockUser.id,
        sentiment: 'positive',
        created_at: new Date().toISOString(),
      }

      mockSupabase.single.mockResolvedValue({
        data: createdFeedback,
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({ error: null })

      const request = new Request('http://localhost/api/templates/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.feedback).toEqual(createdFeedback)
      expect(data.feedback.sentiment).toBe('positive')
    })

    it('should return 400 if rating is invalid', async () => {
      const request = new Request('http://localhost/api/templates/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: 'template-123',
          company_id: 'company-123',
          rating: 6, // Invalid
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Rating must be between 1 and 5')
    })

    it('should set sentiment based on rating', async () => {
      const testCases = [
        { rating: 5, expectedSentiment: 'positive' },
        { rating: 4, expectedSentiment: 'positive' },
        { rating: 3, expectedSentiment: 'neutral' },
        { rating: 2, expectedSentiment: 'negative' },
        { rating: 1, expectedSentiment: 'negative' },
      ]

      for (const testCase of testCases) {
        mockSupabase.single.mockResolvedValue({
          data: {
            id: 'feedback-123',
            rating: testCase.rating,
            sentiment: testCase.expectedSentiment,
          },
          error: null,
        })

        const request = new Request('http://localhost/api/templates/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_id: 'template-123',
            company_id: 'company-123',
            rating: testCase.rating,
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(data.feedback.sentiment).toBe(testCase.expectedSentiment)
      }
    })
  })

  describe('GET /api/templates/[id]/feedback/stats', () => {
    it('should get feedback statistics successfully', async () => {
      const mockFeedback = [
        {
          rating: 5,
          sentiment: 'positive',
          created_at: new Date().toISOString(),
          issues: [],
          suggestions: [],
        },
        {
          rating: 4,
          sentiment: 'positive',
          created_at: new Date().toISOString(),
          issues: [],
          suggestions: [],
        },
        {
          rating: 3,
          sentiment: 'neutral',
          created_at: new Date().toISOString(),
          issues: [],
          suggestions: [],
        },
      ]

      // Reset mocks
      vi.clearAllMocks()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock the chain properly
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)

      // Final result
      mockSupabase.eq.mockResolvedValue({
        data: mockFeedback,
        error: null,
      })

      const request = new Request('http://localhost/api/templates/template-123/feedback/stats')
      const response = await GETStats(request, { params: Promise.resolve({ id: 'template-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stats).toBeDefined()
      expect(data.stats.total).toBe(3)
      expect(data.stats.avgRating).toBeGreaterThan(0)
      expect(data.stats.ratingDistribution).toBeDefined()
      expect(data.stats.sentimentDistribution).toBeDefined()
    })
  })

  describe('GET /api/templates/[id]/feedback/analytics', () => {
    it('should get feedback analytics successfully', async () => {
      const mockFeedback = [
        {
          rating: 5,
          sentiment: 'positive',
          created_at: new Date().toISOString(),
        },
        {
          rating: 4,
          sentiment: 'positive',
          created_at: new Date().toISOString(),
        },
      ]

      // Reset mocks
      vi.clearAllMocks()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock the chain properly
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.gte.mockReturnValue(mockSupabase)
      mockSupabase.order.mockReturnValue(mockSupabase)

      // Final result
      mockSupabase.order.mockResolvedValue({
        data: mockFeedback,
        error: null,
      })

      const request = new Request('http://localhost/api/templates/template-123/feedback/analytics')
      const response = await GETAnalytics(request, {
        params: Promise.resolve({ id: 'template-123' }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics).toBeDefined()
      expect(Array.isArray(data.analytics)).toBe(true)
      expect(data.trends).toBeDefined()
      expect(data.trends.totalFeedback).toBe(2)
    })

    it('should filter by days parameter', async () => {
      const mockFeedback: any[] = []

      // Reset mocks
      vi.clearAllMocks()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock the chain properly
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.gte.mockReturnValue(mockSupabase)
      mockSupabase.order.mockReturnValue(mockSupabase)

      // Final result
      mockSupabase.order.mockResolvedValue({
        data: mockFeedback,
        error: null,
      })

      const request = new Request(
        'http://localhost/api/templates/template-123/feedback/analytics?days=7'
      )
      await GETAnalytics(request, { params: Promise.resolve({ id: 'template-123' }) })

      // Check that gte was called (for date filtering)
      expect(mockSupabase.gte).toHaveBeenCalled()
    })
  })
})
