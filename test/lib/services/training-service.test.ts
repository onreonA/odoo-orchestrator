/**
 * Training Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { TrainingService } from '@/lib/services/training-service'

describe('TrainingService', () => {
  const mockSupabase = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('getTrainingMaterials', () => {
    it('should return training materials for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id', role: 'company_user' },
          error: null,
        }),
      }

      const mockMaterialsQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => {
          resolve({
            data: [
              {
                id: 'material-1',
                title: 'Odoo Temelleri',
                description: 'Temel kullanım',
                type: 'document',
                category: 'general',
              },
            ],
            error: null,
          })
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockProfileQuery
        if (table === 'training_materials') return mockMaterialsQuery
        return mockMaterialsQuery
      })

      const result = await TrainingService.getMaterials()

      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(1)
      expect(result.data?.[0].title).toBe('Odoo Temelleri')
    })

    it('should filter materials by category', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id', role: 'company_user' },
          error: null,
        }),
      }

      const mockMaterialsQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => {
          resolve({
            data: [],
            error: null,
          })
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockProfileQuery
        return mockMaterialsQuery
      })

      await TrainingService.getMaterials({ category: 'odoo-basics' })

      expect(mockMaterialsQuery.eq).toHaveBeenCalledWith('category', 'odoo-basics')
    })

    it('should return error if user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Unauthorized' },
      })

      const result = await TrainingService.getMaterials()

      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })
  })

  describe('createMaterial', () => {
    it('should create training material successfully', async () => {
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

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => {
          resolve({
            data: {
              id: 'material-1',
              title: 'Yeni Materyal',
              created_by: 'user-id',
            },
            error: null,
          })
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockProfileQuery
        return mockInsertQuery
      })

      const result = await TrainingService.createMaterial({
        title: 'Yeni Materyal',
        description: 'Açıklama',
        content_url: 'https://example.com',
        type: 'document',
        category: 'general',
        difficulty_level: 'beginner',
        is_required: false,
        order_index: 0,
      })

      expect(result.data).toBeDefined()
      expect(result.data?.title).toBe('Yeni Materyal')
      expect(mockInsertQuery.insert).toHaveBeenCalled()
    })
  })

  describe('updateProgress', () => {
    it('should update training progress successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockMaterialQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      const mockProgressSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }
      mockProgressSelectQuery.select.mockReturnValue(mockProgressSelectQuery)
      mockProgressSelectQuery.eq.mockReturnValue(mockProgressSelectQuery)

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'progress-1',
            user_id: 'user-id',
            material_id: 'material-1',
            progress_percentage: 50,
            status: 'in_progress',
          },
          error: null,
        }),
      }

      // Track calls to training_progress table
      let progressCallCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'training_materials') {
          return mockMaterialQuery
        }
        if (table === 'training_progress') {
          progressCallCount++
          // First call: check existing progress (select)
          if (progressCallCount === 1) return mockProgressSelectQuery
          // Second call: insert new progress
          return mockInsertQuery
        }
        return mockInsertQuery
      })

      const result = await TrainingService.updateProgress('material-1', {
        progress_percentage: 50,
        status: 'in_progress',
      })

      expect(result.data).toBeDefined()
      expect(result.data?.progress_percentage).toBe(50)
    })
  })

  describe('getTrainingStats', () => {
    it('should return training statistics', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id', role: 'company_admin' },
          error: null,
        }),
      }

      const mockMaterialsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => {
          resolve({
            data: [{ id: 'm1' }, { id: 'm2' }],
            error: null,
          })
        }),
      }
      mockMaterialsQuery.select.mockReturnValue(mockMaterialsQuery)
      mockMaterialsQuery.eq.mockReturnValue(mockMaterialsQuery)
      mockMaterialsQuery.or.mockReturnValue(mockMaterialsQuery)

      const mockProgressQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => {
          resolve({
            data: [
              { status: 'completed', quiz_score: 80, time_spent_minutes: 30 },
              { status: 'in_progress', quiz_score: null, time_spent_minutes: 15 },
            ],
            error: null,
          })
        }),
      }
      mockProgressQuery.select.mockReturnValue(mockProgressQuery)
      mockProgressQuery.eq.mockReturnValue(mockProgressQuery)

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'profiles') return mockProfileQuery
        if (table === 'training_materials') return mockMaterialsQuery
        if (table === 'training_progress') return mockProgressQuery
        return mockMaterialsQuery
      })

      const result = await TrainingService.getTrainingStats()

      expect(result.data).toBeDefined()
      expect(result.data?.totalMaterials).toBe(2)
      expect(result.data?.completedMaterials).toBe(1)
      expect(result.data?.inProgressMaterials).toBe(1)
    })
  })
})
