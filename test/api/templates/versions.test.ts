import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { GET } from '@/app/api/templates/versions/compare/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Template Versions API', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.clearAllMocks()
  })

  describe('GET /api/templates/versions/compare', () => {
    it('should compare two versions successfully', async () => {
      const version1 = {
        id: 'version-1',
        template_id: 'template-123',
        version: '1.0.0',
        structure: {
          modules: [{ technical_name: 'sale', name: 'Sales' }],
          custom_fields: [{ field_name: 'x_custom_field', label: 'Custom Field' }],
          workflows: [{ name: 'Workflow 1' }],
          dashboards: [{ name: 'Dashboard 1' }],
        },
      }

      const version2 = {
        id: 'version-2',
        template_id: 'template-123',
        version: '1.1.0',
        structure: {
          modules: [
            { technical_name: 'sale', name: 'Sales' },
            { technical_name: 'purchase', name: 'Purchase' },
          ],
          custom_fields: [{ field_name: 'x_custom_field', label: 'Custom Field Updated' }],
          workflows: [{ name: 'Workflow 1' }, { name: 'Workflow 2' }],
          dashboards: [{ name: 'Dashboard 1' }],
        },
      }

      mockSupabase.single
        .mockResolvedValueOnce({ data: version1, error: null })
        .mockResolvedValueOnce({ data: version2, error: null })

      const request = new Request(
        'http://localhost/api/templates/versions/compare?version1=version-1&version2=version-2'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.comparison).toBeDefined()
      expect(data.comparison.modules).toBeDefined()
      expect(data.comparison.custom_fields).toBeDefined()
      expect(data.comparison.workflows).toBeDefined()
      expect(data.comparison.dashboards).toBeDefined()

      // Check that modules comparison shows added module
      expect(data.comparison.modules.added.length).toBe(1)
      expect(data.comparison.modules.added[0].technical_name).toBe('purchase')
    })

    it('should return 400 if version IDs are missing', async () => {
      const request = new Request('http://localhost/api/templates/versions/compare')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing version IDs')
    })

    it('should return 404 if one version not found', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: 'version-1',
            structure: { modules: [] },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        })

      const request = new Request(
        'http://localhost/api/templates/versions/compare?version1=version-1&version2=version-2'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })
  })
})
