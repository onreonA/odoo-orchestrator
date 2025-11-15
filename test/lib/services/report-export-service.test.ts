import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReportExportService } from '@/lib/services/report-export-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const createMockSupabase = () => {
  const queryChain = {
    select: vi.fn(() => queryChain),
    eq: vi.fn(() => queryChain),
    gte: vi.fn(() => queryChain),
    lte: vi.fn(() => queryChain),
    order: vi.fn(() => queryChain),
    single: vi.fn(),
  }

  const rpcChain = {
    rpc: vi.fn(),
  }

  return {
    from: vi.fn(() => queryChain),
    rpc: vi.fn(() => rpcChain),
  }
}

describe('ReportExportService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('generatePDFReport', () => {
    it('should generate PDF report', async () => {
      const mockTemplate = {
        template_id: 'template-123',
        name: 'Test Template',
      }

      const mockAnalytics = [
        {
          total_usage: 10,
          total_success: 8,
          total_failure: 2,
          avg_rating: 4.5,
          avg_deployment_time: 300,
          total_feedback: 5,
          positive_feedback: 4,
          negative_feedback: 1,
        },
      ]

      const queryChain = mockSupabase.from('template_library') as any
      queryChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null,
      })

      const rpcChain = mockSupabase.rpc() as any
      rpcChain.rpc.mockResolvedValue({
        data: mockAnalytics,
        error: null,
      })

      const service = new ReportExportService()
      const blob = await service.generatePDFReport('template-123', '2024-01-01', '2024-01-31')

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/pdf')
    })
  })

  describe('generateExcelReport', () => {
    it('should generate Excel report', async () => {
      const mockTemplate = {
        template_id: 'template-123',
        name: 'Test Template',
      }

      const queryChain = mockSupabase.from('template_library') as any
      queryChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null,
      })

      const service = new ReportExportService()
      const blob = await service.generateExcelReport('template-123', '2024-01-01', '2024-01-31')

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('text/csv')
    })
  })
})





