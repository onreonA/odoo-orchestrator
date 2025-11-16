import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConsultantCalendarSyncService } from '@/lib/services/consultant-calendar-sync-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/odoo-xmlrpc-client', () => ({
  OdooXMLRPCClient: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
  })),
}))

const createMockSupabase = () => {
  const queryChain = {
    select: vi.fn(() => queryChain),
    eq: vi.fn(() => queryChain),
    single: vi.fn(),
  }

  return {
    from: vi.fn((_table?: string) => queryChain),
  }
}

describe('ConsultantCalendarSyncService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('syncWithOdoo', () => {
    it('should return error if sync not enabled', async () => {
      const mockCalendar = {
        consultant_id: 'consultant-123',
        sync_settings: { sync_odoo: false },
      }

      const queryChain = mockSupabase.from('consultant_calendar') as any
      queryChain.single.mockResolvedValue({
        data: mockCalendar,
        error: null,
      })

      const service = new ConsultantCalendarSyncService()
      const result = await service.syncWithOdoo('consultant-123')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Odoo sync not enabled')
    })

    it('should return error if no company found', async () => {
      const mockCalendar = {
        consultant_id: 'consultant-123',
        sync_settings: { sync_odoo: true },
      }

      let callCount = 0
      const originalFrom = mockSupabase.from
      ;(mockSupabase.from as any).mockImplementation((table?: string) => {
        if (table === 'consultant_calendar') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockCalendar,
                    error: null,
                  })
                ),
              }
              return chain
            }),
          }
        }
        if (table === 'profiles') {
          callCount++
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: null, // No company found
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

      const service = new ConsultantCalendarSyncService()
      const result = await service.syncWithOdoo('consultant-123')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('No company found')
    })
  })

  describe('syncWithGoogle', () => {
    it('should return error if sync not enabled', async () => {
      const mockCalendar = {
        consultant_id: 'consultant-123',
        sync_settings: { sync_google: false },
      }

      const queryChain = mockSupabase.from('consultant_calendar') as any
      queryChain.single.mockResolvedValue({
        data: mockCalendar,
        error: null,
      })

      const service = new ConsultantCalendarSyncService()
      const result = await service.syncWithGoogle('consultant-123')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Google sync not enabled')
    })
  })

  describe('syncWithOutlook', () => {
    it('should return error if sync not enabled', async () => {
      const mockCalendar = {
        consultant_id: 'consultant-123',
        sync_settings: { sync_outlook: false },
      }

      const queryChain = mockSupabase.from('consultant_calendar') as any
      queryChain.single.mockResolvedValue({
        data: mockCalendar,
        error: null,
      })

      const service = new ConsultantCalendarSyncService()
      const result = await service.syncWithOutlook('consultant-123')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Outlook sync not enabled')
    })
  })

  describe('getSyncStatus', () => {
    it('should return sync status', async () => {
      const mockCalendar = {
        sync_settings: {
          sync_odoo: true,
          sync_google: false,
          sync_outlook: false,
        },
      }

      const queryChain = mockSupabase.from('consultant_calendar') as any
      queryChain.single.mockResolvedValue({
        data: mockCalendar,
        error: null,
      })

      const service = new ConsultantCalendarSyncService()
      const status = await service.getSyncStatus('consultant-123')

      expect(status.syncEnabled.odoo).toBe(true)
      expect(status.syncEnabled.google).toBe(false)
      expect(status.syncEnabled.outlook).toBe(false)
    })
  })
})
