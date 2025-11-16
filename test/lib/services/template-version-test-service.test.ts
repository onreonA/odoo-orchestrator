import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TemplateVersionTestService } from '@/lib/services/template-version-test-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const mockValidateTemplateForDeployment = vi.fn(() =>
  Promise.resolve({
    isValid: true,
    errors: [],
  })
)

vi.mock('@/lib/services/template-validation-service', () => ({
  TemplateValidationService: class {
    validateTemplateForDeployment = mockValidateTemplateForDeployment
  },
}))

const createMockSupabase = () => {
  const createSelectChain = () => ({
    select: vi.fn(() => createSelectChain()),
    eq: vi.fn(() => createSelectChain()),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })

  const createUpdateChain = () => ({
    update: vi.fn(() => createUpdateChain()),
    eq: vi.fn(() => Promise.resolve({ error: null })),
  })

  return {
    from: vi.fn((table: string) => {
      if (table === 'template_versions') {
        return {
          select: vi.fn(() => createSelectChain()),
          update: vi.fn(() => createUpdateChain()),
        }
      }
      return createSelectChain()
    }),
  }
}

describe('TemplateVersionTestService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('runTests', () => {
    it('should run all tests successfully', async () => {
      const mockVersion = {
        id: 'version-123',
        template_id: 'template-123',
        structure: {
          type: 'kickoff',
          modules: ['module1'],
          departments: ['dept1'],
          tasks: ['task1'],
          custom_fields: [{ field_name: 'x_test_field', field_type: 'char' }],
          workflows: [
            {
              states: [{ name: 'draft' }, { name: 'done' }],
              transitions: [{ from_state: 'draft', to_state: 'done' }],
            },
          ],
          dashboards: [{ xml_arch: '<graph><field name="test"/></graph>' }],
        },
      }

      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'template_versions') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockVersion,
                    error: null,
                  })
                ),
              }
              return chain
            }),
            update: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => Promise.resolve({ error: null })),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new TemplateVersionTestService()
      const testSuite = await service.runTests('version-123')

      expect(testSuite.versionId).toBe('version-123')
      expect(testSuite.tests.length).toBeGreaterThan(0)
      expect(testSuite.overallStatus).toBeDefined()
    })

    it('should detect failed tests', async () => {
      const mockVersion = {
        id: 'version-123',
        template_id: 'template-123',
        structure: {
          type: 'kickoff',
          // Missing required fields
          custom_fields: [
            { field_name: 'invalid_field', field_type: 'char' }, // Missing x_ prefix
          ],
        },
      }

      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'template_versions') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockVersion,
                    error: null,
                  })
                ),
              }
              return chain
            }),
            update: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => Promise.resolve({ error: null })),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new TemplateVersionTestService()
      const testSuite = await service.runTests('version-123')

      const failedTests = testSuite.tests.filter(t => t.status === 'failed')
      expect(failedTests.length).toBeGreaterThan(0)
    })
  })

  describe('getTestResults', () => {
    it('should get test results if exists', async () => {
      const mockTestResults = {
        versionId: 'version-123',
        tests: [{ testId: 'test-1', testName: 'Test 1', status: 'passed', duration: 100 }],
        overallStatus: 'passed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        duration: 100,
      }

      const mockVersion = {
        id: 'version-123',
        test_results: mockTestResults,
      }

      const originalFrom = mockSupabase.from
      ;(mockSupabase.from as any) = vi.fn((table: string) => {
        if (table === 'template_versions') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockVersion,
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

      const service = new TemplateVersionTestService()
      const results = await service.getTestResults('version-123')

      expect(results).not.toBeNull()
      expect(results?.versionId).toBe('version-123')
    })

    it('should return null if test results not found', async () => {
      const mockVersion = {
        id: 'version-123',
        test_results: null,
      }

      const selectChain = mockSupabase.from('template_versions').select() as any
      selectChain.single.mockResolvedValue({
        data: mockVersion,
        error: null,
      })

      const service = new TemplateVersionTestService()
      const results = await service.getTestResults('version-123')

      expect(results).toBeNull()
    })
  })
})
