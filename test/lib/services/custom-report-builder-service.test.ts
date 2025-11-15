import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomReportBuilderService } from '@/lib/services/custom-report-builder-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/report-export-service', () => ({
  getReportExportService: vi.fn(() => ({
    generateExcelReport: vi.fn(() => Promise.resolve(new Blob(['test'], { type: 'text/csv' }))),
  })),
}))

const createMockSupabase = () => {
  const insertChain = {
    insert: vi.fn(() => insertChain),
    select: vi.fn(() => insertChain),
    single: vi.fn(),
  }

  const queryChain = {
    select: vi.fn(() => queryChain),
    eq: vi.fn(() => queryChain),
    order: vi.fn(() => queryChain),
    single: vi.fn(),
  }

  const updateChain = {
    update: vi.fn(() => updateChain),
    eq: vi.fn(() => updateChain),
    select: vi.fn(() => updateChain),
    single: vi.fn(),
  }

  const deleteChain = {
    delete: vi.fn(() => deleteChain),
    eq: vi.fn(() => deleteChain),
  }

  return {
    from: vi.fn((table: string) => {
      if (table === 'custom_report_templates') {
        return {
          insert: vi.fn(() => insertChain),
          select: vi.fn(() => queryChain),
          update: vi.fn(() => updateChain),
          delete: vi.fn(() => deleteChain),
        }
      }
      return queryChain
    }),
  }
}

describe('CustomReportBuilderService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('createTemplate', () => {
    it('should create a report template', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        template_id: 'base-template-123',
        metrics: ['usage_count', 'success_rate'],
        date_range: { type: 'last_30_days' },
        include_deployments: true,
        include_feedback: true,
        format: 'excel',
        created_by: 'user-123',
      }

      const insertChain = mockSupabase.from('custom_report_templates').insert() as any
      insertChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null,
      })

      const service = new CustomReportBuilderService()
      const result = await service.createTemplate({
        name: 'Test Template',
        template_id: 'base-template-123',
        metrics: ['usage_count'],
        date_range: { type: 'last_30_days' },
        include_deployments: true,
        include_feedback: true,
        format: 'excel',
        created_by: 'user-123',
      })

      expect(result.id).toBe('template-123')
      expect(result.name).toBe('Test Template')
    })
  })

  describe('getTemplates', () => {
    it('should get all templates for a user', async () => {
      const mockTemplates = [
        { id: 'template-1', name: 'Template 1', created_by: 'user-123' },
        { id: 'template-2', name: 'Template 2', created_by: 'user-123' },
      ]

      const queryChain = mockSupabase.from('custom_report_templates').select() as any
      queryChain.order.mockResolvedValue({
        data: mockTemplates,
        error: null,
      })

      const service = new CustomReportBuilderService()
      const templates = await service.getTemplates('user-123')

      expect(templates).toHaveLength(2)
    })
  })

  describe('getTemplate', () => {
    it('should get a single template', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
      }

      const queryChain = mockSupabase.from('custom_report_templates').select() as any
      queryChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null,
      })

      const service = new CustomReportBuilderService()
      const template = await service.getTemplate('template-123')

      expect(template).not.toBeNull()
      expect(template?.id).toBe('template-123')
    })

    it('should return null if template not found', async () => {
      const queryChain = mockSupabase.from('custom_report_templates').select() as any
      queryChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const service = new CustomReportBuilderService()
      const template = await service.getTemplate('template-123')

      expect(template).toBeNull()
    })
  })

  describe('updateTemplate', () => {
    it('should update a template', async () => {
      const mockTemplate = {
        id: 'template-123',
        name: 'Updated Template',
      }

      const updateChain = mockSupabase.from('custom_report_templates').update() as any
      updateChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null,
      })

      const service = new CustomReportBuilderService()
      const result = await service.updateTemplate('template-123', { name: 'Updated Template' })

      expect(result.name).toBe('Updated Template')
    })
  })

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      const deleteChain = mockSupabase.from('custom_report_templates').delete() as any
      deleteChain.eq.mockResolvedValue({ error: null })

      const service = new CustomReportBuilderService()
      await service.deleteTemplate('template-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('custom_report_templates')
    })
  })

  describe('generateReport', () => {
    it('should generate report from template', async () => {
      const mockTemplate = {
        id: 'template-123',
        template_id: 'base-template-123',
        date_range: { type: 'last_30_days' },
      }

      const queryChain = mockSupabase.from('custom_report_templates').select() as any
      queryChain.single.mockResolvedValue({
        data: mockTemplate,
        error: null,
      })

      const service = new CustomReportBuilderService()
      const blob = await service.generateReport('template-123')

      expect(blob).toBeInstanceOf(Blob)
    })
  })
})


