import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { TemplateEvolutionService } from '@/lib/services/template-evolution-service'
import { GET } from '@/app/api/templates/[id]/evolution/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const mockAnalyzeTemplate = vi.fn()

vi.mock('@/lib/services/template-evolution-service', () => {
  return {
    TemplateEvolutionService: class {
      analyzeTemplate = mockAnalyzeTemplate
    },
  }
})

describe('Template Evolution API', () => {
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
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })
    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })
    vi.clearAllMocks()
    mockAnalyzeTemplate.mockClear()
  })

  describe('GET /api/templates/[id]/evolution', () => {
    it('should get evolution analysis successfully', async () => {
      const mockAnalysis = {
        templateId: 'template-123',
        recommendations: [
          {
            type: 'add_module',
            priority: 'high',
            description: 'Add Purchase module',
            details: {},
            confidence: 0.9,
          },
        ],
        healthScore: 85,
        usageTrend: 'increasing' as const,
        successRate: 0.95,
      }

      // Reset mocks
      vi.clearAllMocks()
      mockAnalyzeTemplate.mockResolvedValue(mockAnalysis)

      // Mock auth
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock profile query - need to properly chain
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      const request = new Request('http://localhost/api/templates/template-123/evolution')
      const response = await GET(request, { params: Promise.resolve({ id: 'template-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analysis).toEqual(mockAnalysis)
      expect(mockAnalyzeTemplate).toHaveBeenCalledWith('template-123')
    })

    it('should return 403 if user is not admin or consultant', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { role: 'company_user' },
        error: null,
      })

      const request = new Request('http://localhost/api/templates/template-123/evolution')
      const response = await GET(request, { params: Promise.resolve({ id: 'template-123' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should return 401 if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new Request('http://localhost/api/templates/template-123/evolution')
      const response = await GET(request, { params: Promise.resolve({ id: 'template-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
