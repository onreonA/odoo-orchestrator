import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { TemplateService } from '@/lib/services/template-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('TemplateService', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    single: vi.fn(),
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    mockSupabase.single.mockResolvedValue({
      data: { id: '123', name: 'Test Template' },
      error: null,
    })
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
  })

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      const input = {
        name: 'Test Template',
        industry: 'furniture',
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
            category: 'Sales',
          },
        ],
      }

      const result = await TemplateService.createTemplate(input, 'user-123')

      expect(result).toBeDefined()
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Template',
          industry: 'furniture',
        })
      )
    })

    it('should throw error on database failure', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(
        TemplateService.createTemplate(
          {
            name: 'Test',
            industry: 'furniture',
            modules: [],
          },
          'user-123'
        )
      ).rejects.toThrow('Template creation failed')
    })
  })

  describe('listTemplates', () => {
    it('should list templates', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          { id: '1', name: 'Template 1' },
          { id: '2', name: 'Template 2' },
        ],
        error: null,
      })
      mockSupabase.select = vi.fn().mockReturnValue(mockSupabase)
      mockSupabase.eq = vi.fn().mockReturnValue(mockSupabase)
      mockSupabase.order = mockOrder

      const result = await TemplateService.listTemplates()

      expect(result).toHaveLength(2)
      expect(mockSupabase.from).toHaveBeenCalledWith('templates')
    })

    it('should filter by industry', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Furniture Template' }],
        error: null,
      })
      mockSupabase.select = vi.fn().mockReturnValue(mockSupabase)
      mockSupabase.eq = vi.fn().mockReturnValue(mockSupabase)
      mockSupabase.order = mockOrder

      await TemplateService.listTemplates({ industry: 'furniture' })

      expect(mockSupabase.eq).toHaveBeenCalledWith('industry', 'furniture')
    })
  })

  describe('getTemplateById', () => {
    it('should get template by ID', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '123', name: 'Test Template' },
        error: null,
      })

      const result = await TemplateService.getTemplateById('123')

      expect(result.id).toBe('123')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123')
    })

    it('should throw error if template not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      await expect(TemplateService.getTemplateById('123')).rejects.toThrow('Template not found')
    })
  })
})
