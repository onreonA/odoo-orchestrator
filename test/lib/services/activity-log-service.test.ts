/**
 * Activity Log Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActivityLogService } from '@/lib/services/activity-log-service'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

describe('ActivityLogService', () => {
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

  describe('logActivity', () => {
    it('should log activity successfully', async () => {
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
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'log-1',
            action: 'create',
            entity_type: 'document',
            description: 'Document created',
            user_id: 'user-id',
            company_id: 'company-id',
          },
          error: null,
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockProfileQuery
        if (table === 'activity_logs') return mockInsertQuery
        return mockInsertQuery
      })

      const result = await ActivityLogService.logActivity('create', 'document', 'Document created', {
        entityId: 'doc-1',
      })

      expect(result.data).toBeDefined()
      expect(result.data?.action).toBe('create')
      expect(result.data?.entity_type).toBe('document')
      expect(mockInsertQuery.insert).toHaveBeenCalled()
    })

    it('should return error if user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Unauthorized' },
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockProfileQuery as any)

      const result = await ActivityLogService.logActivity('create', 'document', 'Test')

      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })
  })

  describe('getActivities', () => {
    it('should return activities for authenticated user', async () => {
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

      const mockActivitiesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => {
          resolve({
            data: [
              {
                id: 'log-1',
                action: 'create',
                entity_type: 'document',
                description: 'Document created',
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          })
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockProfileQuery
        if (table === 'activity_logs') return mockActivitiesQuery
        return mockActivitiesQuery
      })

      const result = await ActivityLogService.getActivities()

      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(1)
      expect(result.data?.[0].action).toBe('create')
    })

    it('should filter activities by entity type', async () => {
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

      const mockActivitiesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => {
          resolve({
            data: [],
            error: null,
          })
        }),
      }
      // Ensure chainable methods
      mockActivitiesQuery.select.mockReturnValue(mockActivitiesQuery)
      mockActivitiesQuery.eq.mockReturnValue(mockActivitiesQuery)
      mockActivitiesQuery.order.mockReturnValue(mockActivitiesQuery)
      mockActivitiesQuery.limit.mockReturnValue(mockActivitiesQuery)

      // Initial query from supabase.from()
      const initialQuery = {
        select: vi.fn().mockReturnValue(mockActivitiesQuery),
        order: vi.fn().mockReturnValue(mockActivitiesQuery),
        limit: vi.fn().mockReturnValue(mockActivitiesQuery),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockProfileQuery
        if (table === 'activity_logs') return initialQuery
        return mockActivitiesQuery
      })

      await ActivityLogService.getActivities({ entityType: 'document' })

      expect(mockActivitiesQuery.eq).toHaveBeenCalledWith('entity_type', 'document')
    })

    it('should restrict activities for company_user role', async () => {
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

      const mockActivitiesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => {
          resolve({
            data: [],
            error: null,
          })
        }),
      }
      // Ensure chainable methods
      mockActivitiesQuery.select.mockReturnValue(mockActivitiesQuery)
      mockActivitiesQuery.eq.mockReturnValue(mockActivitiesQuery)
      mockActivitiesQuery.order.mockReturnValue(mockActivitiesQuery)
      mockActivitiesQuery.limit.mockReturnValue(mockActivitiesQuery)

      // Initial query from supabase.from()
      const initialQuery = {
        select: vi.fn().mockReturnValue(mockActivitiesQuery),
        order: vi.fn().mockReturnValue(mockActivitiesQuery),
        limit: vi.fn().mockReturnValue(mockActivitiesQuery),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockProfileQuery
        if (table === 'activity_logs') return initialQuery
        return mockActivitiesQuery
      })

      await ActivityLogService.getActivities()

      // Should filter by user_id for company_user
      expect(mockActivitiesQuery.eq).toHaveBeenCalledWith('user_id', 'user-id')
    })
  })

  describe('getActivityStats', () => {
    it('should return activity statistics', async () => {
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

      const mockActivitiesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => {
          resolve({
            data: [
              { action: 'create', entity_type: 'document', created_at: new Date().toISOString() },
              { action: 'update', entity_type: 'document', created_at: new Date().toISOString() },
              { action: 'create', entity_type: 'project', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            ],
            error: null,
          })
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return mockProfileQuery
        return mockActivitiesQuery
      })

      const result = await ActivityLogService.getActivityStats()

      expect(result.data).toBeDefined()
      expect(result.data?.total).toBe(3)
      expect(result.data?.byAction).toBeDefined()
      expect(result.data?.byEntityType).toBeDefined()
    })
  })
})

