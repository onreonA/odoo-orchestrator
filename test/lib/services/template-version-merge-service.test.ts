import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TemplateVersionMergeService } from '@/lib/services/template-version-merge-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const createMockSupabase = () => {
  const createSelectChain = () => ({
    select: vi.fn(() => createSelectChain()),
    eq: vi.fn(() => createSelectChain()),
    not: vi.fn(() => createSelectChain()),
    order: vi.fn(() => createSelectChain()),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })

  const createInsertChain = () => ({
    insert: vi.fn(() => createInsertChain()),
    select: vi.fn(() => createInsertChain()),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })

  return {
    from: vi.fn((table: string) => {
      if (table === 'template_versions') {
        return {
          select: vi.fn(() => createSelectChain()),
          insert: vi.fn(() => createInsertChain()),
        }
      }
      return createSelectChain()
    }),
  }
}

describe('TemplateVersionMergeService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('mergeVersions', () => {
    it('should merge versions successfully', async () => {
      const baseVersion = {
        id: 'base-123',
        template_id: 'template-123',
        version: '1.0.0',
        structure: {
          custom_fields: [{ field_name: 'x_test_field', field_type: 'char' }],
        },
      }

      const sourceVersion = {
        id: 'source-123',
        template_id: 'template-123',
        version: '1.1.0',
        structure: {
          custom_fields: [{ field_name: 'x_test_field', field_type: 'text' }],
        },
      }

      const targetVersion = {
        id: 'target-123',
        template_id: 'template-123',
        version: '1.2.0',
        structure: {
          custom_fields: [{ field_name: 'x_test_field', field_type: 'integer' }],
        },
      }

      // Mock version queries (3 calls for base, source, target, then version list, then insert)
      let versionCallCount = 0
      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'template_versions') {
          versionCallCount++
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                order: vi.fn(() => chain),
                limit: vi.fn(() => {
                  if (versionCallCount <= 3) {
                    // First 3 calls: get versions
                    return Promise.resolve({ data: null, error: null })
                  }
                  // 4th call: get version list
                  return Promise.resolve({
                    data: [{ version: '1.2.0' }],
                    error: null,
                  })
                }),
                single: vi.fn(() => {
                  if (versionCallCount === 1)
                    return Promise.resolve({ data: baseVersion, error: null })
                  if (versionCallCount === 2)
                    return Promise.resolve({ data: sourceVersion, error: null })
                  if (versionCallCount === 3)
                    return Promise.resolve({ data: targetVersion, error: null })
                  return Promise.resolve({ data: null, error: null })
                }),
              }
              return chain
            }),
            insert: vi.fn(() => {
              const chain: any = {
                select: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: 'merged-123' },
                    error: null,
                  })
                ),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new TemplateVersionMergeService()
      const result = await service.mergeVersions('base-123', 'source-123', 'target-123', {
        'custom_fields.x_test_field': 'source',
      })

      expect(result.success).toBe(true)
      expect(result.mergedVersionId).toBeDefined()
    })

    it('should return conflicts if versions differ', async () => {
      const baseVersion = {
        id: 'base-123',
        template_id: 'template-123',
        version: '1.0.0',
        structure: { custom_fields: [] },
      }

      const sourceVersion = {
        id: 'source-123',
        template_id: 'template-123',
        version: '1.1.0',
        structure: {
          custom_fields: [{ field_name: 'x_field1', field_type: 'char' }],
        },
      }

      const targetVersion = {
        id: 'target-123',
        template_id: 'template-123',
        version: '1.2.0',
        structure: {
          custom_fields: [{ field_name: 'x_field1', field_type: 'text' }],
        },
      }

      let versionCallCount = 0
      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'template_versions') {
          versionCallCount++
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() => {
                  if (versionCallCount === 1)
                    return Promise.resolve({ data: baseVersion, error: null })
                  if (versionCallCount === 2)
                    return Promise.resolve({ data: sourceVersion, error: null })
                  if (versionCallCount === 3)
                    return Promise.resolve({ data: targetVersion, error: null })
                  return Promise.resolve({ data: null, error: null })
                }),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new TemplateVersionMergeService()
      const result = await service.mergeVersions('base-123', 'source-123', 'target-123')

      expect(result.conflicts.length).toBeGreaterThan(0)
    })
  })

  describe('createBranch', () => {
    it('should create a branch from a version', async () => {
      const baseVersion = {
        id: 'base-123',
        template_id: 'template-123',
        version: '1.0.0',
        structure: { custom_fields: [] },
      }

      let callCount = 0
      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'template_versions') {
          callCount++
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: baseVersion,
                    error: null,
                  })
                ),
              }
              return chain
            }),
            insert: vi.fn(() => {
              const chain: any = {
                select: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: 'branch-123' },
                    error: null,
                  })
                ),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new TemplateVersionMergeService()
      const branchId = await service.createBranch('template-123', 'base-123', 'feature-branch')

      expect(branchId).toBe('branch-123')
    })
  })

  describe('getBranches', () => {
    it('should get all branches for a template', async () => {
      const mockBranches = [
        { id: 'branch-1', branch_name: 'feature-1' },
        { id: 'branch-2', branch_name: 'feature-2' },
      ]

      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'template_versions') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                not: vi.fn(() => chain),
                order: vi.fn(() =>
                  Promise.resolve({
                    data: mockBranches,
                    error: null,
                  })
                ),
              }
              return chain
            }),
            insert: vi.fn(() => {
              const chain: any = {
                select: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: 'branch-123' },
                    error: null,
                  })
                ),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new TemplateVersionMergeService()
      const branches = await service.getBranches('template-123')

      expect(branches).toHaveLength(2)
    })
  })
})
