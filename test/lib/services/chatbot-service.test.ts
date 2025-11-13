/**
 * Chatbot Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatbotService } from '@/lib/services/chatbot-service'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock OpenAI - Define mock function inside the factory
let mockOpenAICreate: ReturnType<typeof vi.fn>
vi.mock('openai', () => {
  mockOpenAICreate = vi.fn()
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockOpenAICreate,
        },
      }
    },
  }
})

import { createClient } from '@/lib/supabase/server'
import { ChatbotService } from '@/lib/services/chatbot-service'

describe('ChatbotService', () => {
  const mockSupabase = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    if (mockOpenAICreate) {
      mockOpenAICreate.mockClear()
    }
  })

  describe('generateResponse', () => {
    it('should generate response with knowledge base context', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      const mockKnowledgeQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => {
          resolve({
            data: [
              {
                id: 'kb-1',
                title: 'Odoo Kullanımı',
                content: 'Odoo kullanım rehberi',
              },
            ],
            error: null,
          })
        }),
      }
      mockKnowledgeQuery.select.mockReturnValue(mockKnowledgeQuery)
      mockKnowledgeQuery.or.mockReturnValue(mockKnowledgeQuery)
      mockKnowledgeQuery.eq.mockReturnValue(mockKnowledgeQuery)
      mockKnowledgeQuery.limit.mockReturnValue(mockKnowledgeQuery)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockProfileQuery
        if (table === 'knowledge_base') return mockKnowledgeQuery
        return mockKnowledgeQuery
      })

      if (mockOpenAICreate) {
        mockOpenAICreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Odoo kullanımı hakkında bilgi',
              },
            },
          ],
        })
      }

      const result = await ChatbotService.generateResponse('Odoo nasıl kullanılır?')

      expect(result.data).toBeDefined()
      expect(result.data?.message).toBe('Odoo kullanımı hakkında bilgi')
      expect(result.data?.sources).toBeDefined()
      expect(result.data?.sources?.length).toBeGreaterThan(0)
    })

    it('should handle errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Unauthorized' },
      })

      // Mock knowledge base query to return empty (will be called even if user is null)
      const mockKnowledgeQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => {
          resolve({
            data: [],
            error: null,
          })
        }),
      }

      mockSupabase.from.mockReturnValue(mockKnowledgeQuery as any)

      const result = await ChatbotService.generateResponse('Test message')

      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })

    it('should include conversation history', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      const mockKnowledgeQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => {
          resolve({
            data: [],
            error: null,
          })
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockProfileQuery
        if (table === 'knowledge_base') return mockKnowledgeQuery
        return mockKnowledgeQuery
      })

      if (mockOpenAICreate) {
        mockOpenAICreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Response',
              },
            },
          ],
        })
      }

      const conversationHistory = [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
      ]

      await ChatbotService.generateResponse('New message', {
        conversationHistory,
      })

      if (mockOpenAICreate) {
        expect(mockOpenAICreate).toHaveBeenCalled()
        const callArgs = mockOpenAICreate.mock.calls[0][0]
        expect(callArgs.messages.length).toBeGreaterThan(2) // system + history + new message
      }
    })
  })

  describe('getProjectInfo', () => {
    it('should return project information', async () => {
      const mockProjectsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              name: 'Project 1',
              status: 'in_progress',
              phase: 'configuration',
              completion_percentage: 50,
            },
          ],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockProjectsQuery as any)

      const result = await ChatbotService.getProjectInfo('company-id')

      expect(result).toContain('Project 1')
      expect(result).toContain('in_progress')
    })

    it('should return message when no projects found', async () => {
      const mockProjectsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockProjectsQuery as any)

      const result = await ChatbotService.getProjectInfo('company-id')

      expect(result).toContain('Henüz aktif proje bulunmuyor')
    })
  })
})
