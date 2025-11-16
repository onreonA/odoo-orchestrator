/**
 * Kickoff Configuration Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getKickoffConfigurationService } from '@/lib/services/kickoff-configuration-service'
import { ConfigurationGeneratorAgent } from '@/lib/ai/agents/configuration-generator-agent'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock ConfigurationGeneratorAgent
const mockGeneratorAgent = {
  generateFromNaturalLanguage: vi.fn(),
}

vi.mock('@/lib/ai/agents/configuration-generator-agent', () => ({
  ConfigurationGeneratorAgent: class {
    constructor(companyId: string) {}
    generateFromNaturalLanguage = mockGeneratorAgent.generateFromNaturalLanguage
  },
}))

import { createClient } from '@/lib/supabase/server'

describe('KickoffConfigurationService', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
      limit: vi.fn(() => mockSupabase),
      single: vi.fn(),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    mockGeneratorAgent.generateFromNaturalLanguage.mockReset()
  })

  describe('extractKickoffAnswers', () => {
    it('should extract kick-off answers from discovery data', async () => {
      const service = getKickoffConfigurationService()

      // Mock company data
      ;(mockSupabase.from as any) = vi.fn((table: string) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'company-123',
                    name: 'Test Company',
                    industry: 'Manufacturing',
                    size: 'medium',
                  },
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'discoveries') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: 'discovery-123',
                        company_id: 'company-123',
                        extracted_requirements: {
                          crm: {
                            sales_process: 'B2B',
                            lead_source: 'Website',
                          },
                          mrp: {
                            production_type: 'Make to Order',
                            bom_levels: 3,
                          },
                        },
                        ai_summary: {
                          suggested_modules: ['crm', 'mrp'],
                        },
                      },
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          }
        }
        return mockSupabase
      })

      const result = await service.extractKickoffAnswers('company-123')

      expect(result).not.toBeNull()
      expect(result?.companyInfo.name).toBe('Test Company')
      expect(result?.companyInfo.industry).toBe('Manufacturing')
      expect(result?.modules.length).toBeGreaterThan(0)
    })

    it('should return null if company not found', async () => {
      const service = getKickoffConfigurationService()

      ;(mockSupabase.from as any) = vi.fn((table: string) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              })),
            })),
          }
        }
        return mockSupabase
      })

      const result = await service.extractKickoffAnswers('non-existent-company')

      expect(result).toBeNull()
    })

    it('should handle missing discovery data gracefully', async () => {
      const service = getKickoffConfigurationService()

      ;(mockSupabase.from as any) = vi.fn((table: string) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'company-123',
                    name: 'Test Company',
                    industry: 'Manufacturing',
                  },
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'discoveries') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          }
        }
        return mockSupabase
      })

      const result = await service.extractKickoffAnswers('company-123')

      expect(result).not.toBeNull()
      expect(result?.modules.length).toBe(0)
    })
  })

  describe('generateAllConfigurations', () => {
    it('should generate configurations for all modules', async () => {
      const service = getKickoffConfigurationService()

      // Mock extractKickoffAnswers
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'company-123',
                    name: 'Test Company',
                    industry: 'Manufacturing',
                  },
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'discoveries') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: 'discovery-123',
                        extracted_requirements: {
                          crm: { sales_process: 'B2B' },
                        },
                      },
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          }
        }
        return mockSupabase
      }) as any

      // Mock generator agent
      mockGeneratorAgent.generateFromNaturalLanguage.mockResolvedValue({
        configurationId: 'config-123',
        type: 'model',
        name: 'CRM Configuration',
        generatedCode: 'class CRMConfig(models.Model): ...',
        filePath: 'models/crm_config.py',
        dependencies: ['crm'],
        estimatedComplexity: 'medium',
      })

      const result = await service.generateAllConfigurations('company-123', 'instance-123')

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].configurationId).toBe('config-123')
      expect(mockGeneratorAgent.generateFromNaturalLanguage).toHaveBeenCalled()
    })

    it('should return empty array if no kick-off answers found', async () => {
      const service = getKickoffConfigurationService()

      ;(mockSupabase.from as any) = vi.fn((table: string) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'company-123',
                    name: 'Test Company',
                    industry: 'Manufacturing',
                  },
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'discoveries') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          }
        }
        return mockSupabase
      }) as any

      const result = await service.generateAllConfigurations('company-123', 'instance-123')

      expect(result).toEqual([])
      expect(mockGeneratorAgent.generateFromNaturalLanguage).not.toHaveBeenCalled()
    })

    it('should continue generating even if one module fails', async () => {
      const service = getKickoffConfigurationService()

      ;(mockSupabase.from as any) = vi.fn((table: string) => {
        if (table === 'companies') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'company-123',
                    name: 'Test Company',
                    industry: 'Manufacturing',
                  },
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'discoveries') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: 'discovery-123',
                        extracted_requirements: {
                          crm: { sales_process: 'B2B' },
                          mrp: { production_type: 'MTO' },
                        },
                      },
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          }
        }
        return mockSupabase
      }) as any

      // First call fails, second succeeds
      mockGeneratorAgent.generateFromNaturalLanguage
        .mockRejectedValueOnce(new Error('Generation failed'))
        .mockResolvedValueOnce({
          configurationId: 'config-456',
          type: 'workflow',
          name: 'MRP Workflow',
          generatedCode: '...',
          filePath: 'workflows/mrp.xml',
          dependencies: ['mrp'],
          estimatedComplexity: 'high',
        })

      const result = await service.generateAllConfigurations('company-123', 'instance-123')

      // Should have at least one successful configuration
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].configurationId).toBe('config-456')
    })
  })
})

