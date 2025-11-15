import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TemplateLibraryService } from '@/lib/services/template-library-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('TemplateLibraryService', () => {
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
    vi.clearAllMocks()
  })

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      const template = {
        template_id: 'test-template-v1',
        name: 'Test Template',
        type: 'kickoff' as const,
        version: '1.0',
        industry: 'furniture',
        structure: {
          modules: [
            {
              name: 'Sales',
              technical_name: 'sale',
            },
          ],
        },
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: { id: '123', ...template },
        error: null,
      })

      const service = new TemplateLibraryService()
      const result = await service.createTemplate(template)

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(mockSupabase.insert).toHaveBeenCalledWith(template)
    })

    it('should handle database errors', async () => {
      const template = {
        template_id: 'test-template-v1',
        name: 'Test Template',
        type: 'kickoff' as const,
        version: '1.0',
        industry: 'furniture',
        structure: {},
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const service = new TemplateLibraryService()
      const result = await service.createTemplate(template)

      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })
  })

  describe('getTemplateById', () => {
    it('should get template by template_id', async () => {
      const mockTemplate = {
        id: '123',
        template_id: 'test-template-v1',
        name: 'Test Template',
        type: 'kickoff',
        version: '1.0',
        industry: 'furniture',
        status: 'published',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockTemplate,
        error: null,
      })

      const service = new TemplateLibraryService()
      const result = await service.getTemplateById('test-template-v1')

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockTemplate)
      expect(mockSupabase.eq).toHaveBeenCalledWith('template_id', 'test-template-v1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'published')
    })

    it('should handle template not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      const service = new TemplateLibraryService()
      const result = await service.getTemplateById('non-existent')

      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })
  })

  describe('getTemplates', () => {
    it('should get all published templates', async () => {
      const mockTemplates = [
        {
          id: '1',
          template_id: 'template-1',
          name: 'Template 1',
          status: 'published',
        },
        {
          id: '2',
          template_id: 'template-2',
          name: 'Template 2',
          status: 'published',
        },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockTemplates,
        error: null,
      })

      const service = new TemplateLibraryService()
      const result = await service.getTemplates()

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockTemplates)
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'published')
    })

    it('should filter by type', async () => {
      const mockTemplates = [
        {
          id: '1',
          template_id: 'template-1',
          name: 'Kickoff Template',
          type: 'kickoff',
        },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockTemplates,
        error: null,
      })

      const service = new TemplateLibraryService()
      const result = await service.getTemplates({ type: 'kickoff' })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockTemplates)
      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'kickoff')
    })

    it('should filter by industry', async () => {
      const mockTemplates = [
        {
          id: '1',
          template_id: 'template-1',
          name: 'Furniture Template',
          industry: 'furniture',
        },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockTemplates,
        error: null,
      })

      const service = new TemplateLibraryService()
      const result = await service.getTemplates({ industry: 'furniture' })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockTemplates)
      expect(mockSupabase.eq).toHaveBeenCalledWith('industry', 'furniture')
    })

    it('should filter by is_featured', async () => {
      const mockTemplates = [
        {
          id: '1',
          template_id: 'template-1',
          name: 'Featured Template',
          is_featured: true,
        },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockTemplates,
        error: null,
      })

      const service = new TemplateLibraryService()
      const result = await service.getTemplates({ is_featured: true })

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockTemplates)
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_featured', true)
    })

    it('should return empty array on error', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const service = new TemplateLibraryService()
      const result = await service.getTemplates()

      expect(result.error).toBeDefined()
      expect(result.data).toEqual([])
    })
  })

  describe('updateTemplate', () => {
    it('should update template successfully', async () => {
      const updates = {
        name: 'Updated Template Name',
        description: 'Updated description',
      }

      const updatedTemplate = {
        id: '123',
        template_id: 'test-template-v1',
        ...updates,
      }

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: updatedTemplate,
        error: null,
      })

      const service = new TemplateLibraryService()
      const result = await service.updateTemplate('test-template-v1', updates)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(updatedTemplate)
      expect(mockSupabase.eq).toHaveBeenCalledWith('template_id', 'test-template-v1')
    })

    it('should handle update errors', async () => {
      const updates = {
        name: 'Updated Template Name',
      }

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      const service = new TemplateLibraryService()
      const result = await service.updateTemplate('test-template-v1', updates)

      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })
  })

  describe('incrementUsage', () => {
    it('should increment usage count', async () => {
      const currentTemplate = {
        id: '123',
        template_id: 'test-template-v1',
        usage_count: 5,
      }

      // Mock first call (get current usage)
      mockSupabase.single
        .mockResolvedValueOnce({
          data: currentTemplate,
          error: null,
        })
        // Mock second call (update usage)
        .mockResolvedValueOnce({
          data: { ...currentTemplate, usage_count: 6 },
          error: null,
        })

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)

      const service = new TemplateLibraryService()
      const result = await service.incrementUsage('test-template-v1')

      expect(result.error).toBeNull()
      expect(result.data.usage_count).toBe(6)
      expect(mockSupabase.update).toHaveBeenCalledWith({ usage_count: 6 })
    })

    it('should handle template with no usage count', async () => {
      const currentTemplate = {
        id: '123',
        template_id: 'test-template-v1',
        usage_count: null,
      }

      mockSupabase.single
        .mockResolvedValueOnce({
          data: currentTemplate,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...currentTemplate, usage_count: 1 },
          error: null,
        })

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)

      const service = new TemplateLibraryService()
      const result = await service.incrementUsage('test-template-v1')

      expect(result.error).toBeNull()
      expect(result.data.usage_count).toBe(1)
      expect(mockSupabase.update).toHaveBeenCalledWith({ usage_count: 1 })
    })

    it('should handle increment errors', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { usage_count: 5 },
        error: null,
      })

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      })

      const service = new TemplateLibraryService()
      const result = await service.incrementUsage('test-template-v1')

      expect(result.error).toBeDefined()
    })
  })
})







