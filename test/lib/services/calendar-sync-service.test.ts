import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CalendarSyncService } from '@/lib/services/calendar-sync-service'
import { createClient } from '@/lib/supabase/server'
import { CalendarService } from '@/lib/services/calendar-service'
import { GoogleCalendarIntegration } from '@/lib/integrations/google-calendar'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Don't mock CalendarService - let it use real implementation with mocked createClient
// vi.mock('@/lib/services/calendar-service', () => ({
//   CalendarService: {
//     getEvents: vi.fn(),
//     createEvent: vi.fn(),
//   },
// }))

vi.mock('@/lib/integrations/google-calendar', () => ({
  GoogleCalendarIntegration: vi.fn(),
}))

// Mock Supabase client with chainable methods
const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    auth: {
      getUser: vi.fn(),
    },
  }
  return mockSupabase
}

// Create a chainable query mock
const createChainableQuery = (finalResult: any) => {
  const query = {
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(finalResult)),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    or: vi.fn(() => query),
  }
  // Make query methods return promises when awaited (for order, eq, etc.)
  query.order.mockImplementation(() => Promise.resolve(finalResult))
  query.eq.mockImplementation(() => query) // Chainable, but final await returns result
  query.gte.mockImplementation(() => query)
  query.lte.mockImplementation(() => query)
  query.or.mockImplementation(() => query)
  // When awaited, return the final result
  Object.defineProperty(query, 'then', {
    value: (resolve: any) => resolve(finalResult),
    writable: true,
  })
  return query
}

describe('CalendarSyncService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('getSyncs', () => {
    it('should fetch syncs for a user', async () => {
      const mockSyncs = [
        {
          id: 'sync-1',
          name: 'Google Calendar Sync',
          provider: 'google',
          user_id: 'user-123',
          status: 'active',
        },
      ]

      const chainableQuery = createChainableQuery({ data: mockSyncs, error: null })
      mockSupabase.from.mockReturnValue(chainableQuery as any)
      chainableQuery.select.mockReturnValue(chainableQuery)
      chainableQuery.eq.mockReturnValue(chainableQuery)
      chainableQuery.order.mockReturnValue(chainableQuery)

      const result = await CalendarSyncService.getSyncs('user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_syncs')
      expect(chainableQuery.select).toHaveBeenCalledWith('*')
      expect(chainableQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result.data).toEqual(mockSyncs)
      expect(result.error).toBeNull()
    })

    it('should filter by company ID when provided', async () => {
      const chainableQuery = createChainableQuery({ data: [], error: null })
      mockSupabase.from.mockReturnValue(chainableQuery as any)
      chainableQuery.select.mockReturnValue(chainableQuery)
      chainableQuery.eq.mockReturnValue(chainableQuery)
      chainableQuery.order.mockReturnValue(chainableQuery)

      await CalendarSyncService.getSyncs('user-123', 'company-456')

      expect(chainableQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(chainableQuery.eq).toHaveBeenCalledWith('company_id', 'company-456')
    })
  })

  describe('getSyncById', () => {
    it('should fetch a single sync by ID', async () => {
      const mockSync = {
        id: 'sync-1',
        name: 'Google Calendar Sync',
        provider: 'google',
        user_id: 'user-123',
        status: 'active',
      }

      mockSupabase.single.mockResolvedValue({ data: mockSync, error: null } as any)

      const result = await CalendarSyncService.getSyncById('sync-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_syncs')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'sync-1')
      expect(mockSupabase.single).toHaveBeenCalled()
      expect(result.data).toEqual(mockSync)
      expect(result.error).toBeNull()
    })

    it('should return error when sync not found', async () => {
      const mockError = { message: 'Sync not found' }
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError } as any)

      const result = await CalendarSyncService.getSyncById('sync-999')

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('createSync', () => {
    it('should create a new sync connection', async () => {
      const input = {
        name: 'Google Calendar Sync',
        provider: 'google' as const,
        sync_direction: 'bidirectional' as const,
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        external_calendar_id: 'primary',
        external_calendar_name: 'My Calendar',
      }

      const mockSync = {
        id: 'sync-1',
        ...input,
        user_id: 'user-123',
        status: 'active',
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockSync, error: null } as any)

      const result = await CalendarSyncService.createSync(input, 'user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_syncs')
      expect(mockSupabase.insert).toHaveBeenCalled()
      expect(result.data).toEqual(mockSync)
      expect(result.error).toBeNull()
    })

    it('should set default sync_direction to bidirectional', async () => {
      const input = {
        name: 'Google Calendar Sync',
        provider: 'google' as const,
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: {}, error: null } as any)

      await CalendarSyncService.createSync(input, 'user-123')

      const insertCall = mockSupabase.insert.mock.calls[0]?.[0]
      expect(insertCall?.sync_direction).toBe('bidirectional')
      expect(insertCall?.status).toBe('active')
    })
  })

  describe('updateSync', () => {
    it('should update a sync connection', async () => {
      const updateData = {
        status: 'paused' as const,
        name: 'Updated Sync Name',
      }

      const mockSync = {
        id: 'sync-1',
        ...updateData,
        updated_at: new Date().toISOString(),
      }

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockSync, error: null } as any)

      const result = await CalendarSyncService.updateSync('sync-1', updateData)

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_syncs')
      expect(mockSupabase.update).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'sync-1')
      expect(result.data).toEqual(mockSync)
    })
  })

  describe('deleteSync', () => {
    it('should delete a sync connection', async () => {
      mockSupabase.delete.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ error: null } as any)

      const result = await CalendarSyncService.deleteSync('sync-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_syncs')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'sync-1')
      expect(result.error).toBeNull()
    })
  })

  describe('syncFromExternal', () => {
    it('should sync events from Google Calendar', async () => {
      const mockSync = {
        id: 'sync-1',
        name: 'Google Calendar Sync',
        provider: 'google' as const,
        user_id: 'user-123',
        status: 'active' as const,
        external_calendar_id: 'primary',
        company_id: 'company-123',
      }

      const mockGoogleEvents = [
        {
          id: 'google-event-1',
          summary: 'Test Event',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
        },
      ]

      const mockUser = { id: 'user-123' }
      const mockSyncDetails = {
        data: {
          access_token: 'token-123',
          refresh_token: 'refresh-123',
        },
      }

      // Setup multiple mock Supabase clients for different calls
      // Note: syncFromExternal calls createClient() multiple times:
      // 1. Initial call in syncFromExternal (line 141)
      // 2. Inside getSyncById (line 144) - calls createClient()
      // 3. Inside updateSync (line 150) - calls createClient()
      // 4. For sync details - uses initial client (line 158)
      // 5. Inside CalendarService.getEvents (line 198) - calls createClient()
      // 6. Inside CalendarService.createEvent (line 210) - calls createClient()
      // 7. For event update (line 220) - calls createClient()
      // 8. For final update (line 236) - calls createClient()

      // Initial client (used for sync details and auth)
      const initialSupabase = createMockSupabase()
      const syncDetailsQuery = createChainableQuery(mockSyncDetails)
      initialSupabase.from.mockReturnValue(syncDetailsQuery as any)
      syncDetailsQuery.select.mockReturnValue(syncDetailsQuery)
      syncDetailsQuery.eq.mockReturnValue(syncDetailsQuery)
      syncDetailsQuery.single.mockResolvedValue(mockSyncDetails as any)
      initialSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      // getSyncById client
      const getSyncSupabase = createMockSupabase()
      getSyncSupabase.single.mockResolvedValue({ data: mockSync, error: null } as any)

      // updateSync client
      const updateSyncSupabase = createMockSupabase()
      updateSyncSupabase.update.mockReturnValue(updateSyncSupabase)
      updateSyncSupabase.select.mockReturnValue(updateSyncSupabase)
      updateSyncSupabase.single.mockResolvedValue({
        data: { ...mockSync, status: 'syncing' },
        error: null,
      } as any)

      // CalendarService.getEvents client
      const getEventsSupabase = createMockSupabase()
      const getEventsQuery = createChainableQuery({ data: [], error: null })
      getEventsSupabase.from.mockReturnValue(getEventsQuery as any)
      getEventsQuery.select.mockReturnValue(getEventsQuery)
      getEventsQuery.order.mockReturnValue(getEventsQuery)

      // CalendarService.createEvent client - needs to return created event
      const createEventSupabase = createMockSupabase()
      const createdEvent = {
        id: 'event-1',
        title: 'Test Event',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        external_event_id: 'google-event-1',
        event_type: 'meeting' as const,
        status: 'scheduled' as const,
        all_day: false,
        is_recurring: false,
        synced_with_external: false,
        is_private: false,
        visibility: 'company' as const,
        timezone: 'Europe/Istanbul',
        attendees: [],
        external_attendees: [],
        auto_prepared: false,
        created_by: 'user-123',
        organizer_id: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const createEventQuery = createChainableQuery({ data: createdEvent, error: null })
      createEventSupabase.from.mockReturnValue(createEventQuery as any)
      createEventQuery.insert.mockReturnValue(createEventQuery)
      createEventQuery.select.mockReturnValue(createEventQuery)
      createEventQuery.single.mockResolvedValue({ data: createdEvent, error: null } as any)

      // Event update client (mark as synced) - needs chainable query
      const updateEventSupabase = createMockSupabase()
      const updateEventQuery = createChainableQuery({ error: null })
      updateEventSupabase.from.mockReturnValue(updateEventQuery as any)
      updateEventQuery.update.mockReturnValue(updateEventQuery)
      updateEventQuery.eq.mockReturnValue(updateEventQuery)

      // Final update client - needs chainable query
      const finalUpdateSupabase = createMockSupabase()
      const finalUpdateQuery = createChainableQuery({ error: null })
      finalUpdateSupabase.from.mockReturnValue(finalUpdateQuery as any)
      finalUpdateQuery.update.mockReturnValue(finalUpdateQuery)
      finalUpdateQuery.eq.mockReturnValue(finalUpdateQuery)

      // Setup createClient to return different mocks in sequence
      // Important: Order matters! Each createClient() call gets the next mock
      vi.mocked(createClient)
        .mockResolvedValueOnce(initialSupabase as any) // 1. syncFromExternal initial (line 141)
        .mockResolvedValueOnce(getSyncSupabase as any) // 2. getSyncById (line 144)
        .mockResolvedValueOnce(updateSyncSupabase as any) // 3. updateSync (line 150)
        .mockResolvedValueOnce(getEventsSupabase as any) // 4. CalendarService.getEvents (line 198)
        .mockResolvedValueOnce(createEventSupabase as any) // 5. CalendarService.createEvent (line 210)
        .mockResolvedValueOnce(updateEventSupabase as any) // 6. event update (line 220)
        .mockResolvedValueOnce(finalUpdateSupabase as any) // 7. final update (line 236)

      // CalendarService will use the mocked createClient above
      // No need to mock CalendarService methods directly

      // Mock GoogleCalendarIntegration - create a proper mock class
      class MockGoogleCalendarIntegration {
        getEvents = vi.fn().mockResolvedValue(mockGoogleEvents)
        constructor(config: any) {
          // Mock constructor
        }
      }
      vi.mocked(GoogleCalendarIntegration).mockImplementation((config: any) => {
        return new MockGoogleCalendarIntegration(config) as any
      })

      const result = await CalendarSyncService.syncFromExternal('sync-1')

      expect(result.synced).toBeGreaterThan(0)
      expect(result.error).toBeUndefined()
    })

    it('should return error when sync not found', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } } as any)

      const result = await CalendarSyncService.syncFromExternal('sync-999')

      expect(result.synced).toBe(0)
      expect(result.error).toBeDefined()
    })

    it('should handle sync errors and update status', async () => {
      const mockSync = {
        id: 'sync-1',
        provider: 'google' as const,
        status: 'active' as const,
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockSync, error: null } as any)
      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockSync, status: 'syncing' },
        error: null,
      } as any)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Token error' },
      } as any)

      const result = await CalendarSyncService.syncFromExternal('sync-1')

      expect(result.synced).toBe(0)
      expect(result.error).toBeDefined()
    })
  })

  describe('syncToExternal', () => {
    it('should sync events to Google Calendar', async () => {
      const mockSync = {
        id: 'sync-1',
        provider: 'google' as const,
        external_calendar_id: 'primary',
        company_id: 'company-123',
      }

      const mockUser = { id: 'user-123' }
      const mockSyncDetails = {
        data: {
          access_token: 'token-123',
          refresh_token: 'refresh-123',
        },
      }

      const mockEvents = [
        {
          id: 'event-1',
          title: 'Test Event',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          synced_with_external: false,
        },
      ]

      // Setup multiple mock Supabase clients for different calls
      // Note: syncToExternal calls createClient() multiple times:
      // 1. Initial call in syncToExternal (line 270)
      // 2. Inside getSyncById (line 273) - calls createClient()
      // 3. Inside updateSync (line 279) - calls createClient()
      // 4. For sync details - uses initial client (line 286)
      // 5. Inside CalendarService.getEvents (line 313) - calls createClient()
      // 6. For event update (line 344) - calls createClient()
      // 7. For final update (line 363) - calls createClient()

      // Initial client (used for sync details and auth)
      const initialSupabase = createMockSupabase()
      const syncDetailsQuery = createChainableQuery(mockSyncDetails)
      initialSupabase.from.mockReturnValue(syncDetailsQuery as any)
      syncDetailsQuery.select.mockReturnValue(syncDetailsQuery)
      syncDetailsQuery.eq.mockReturnValue(syncDetailsQuery)
      syncDetailsQuery.single.mockResolvedValue(mockSyncDetails as any)
      initialSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any)

      // getSyncById client - needs chainable query
      const getSyncSupabase = createMockSupabase()
      const getSyncQuery = createChainableQuery({ data: mockSync, error: null })
      getSyncSupabase.from.mockReturnValue(getSyncQuery as any)
      getSyncQuery.select.mockReturnValue(getSyncQuery)
      getSyncQuery.eq.mockReturnValue(getSyncQuery)

      // updateSync client - needs chainable query
      const updateSyncSupabase = createMockSupabase()
      const updateSyncQuery = createChainableQuery({
        data: { ...mockSync, status: 'syncing' },
        error: null,
      })
      updateSyncSupabase.from.mockReturnValue(updateSyncQuery as any)
      updateSyncQuery.update.mockReturnValue(updateSyncQuery)
      updateSyncQuery.select.mockReturnValue(updateSyncQuery)
      updateSyncQuery.eq.mockReturnValue(updateSyncQuery)

      // CalendarService.getEvents client
      const getEventsSupabase = createMockSupabase()
      const getEventsQuery = createChainableQuery({ data: mockEvents, error: null })
      getEventsSupabase.from.mockReturnValue(getEventsQuery as any)

      // Event update client (for marking event as synced) - needs chainable query
      const updateEventSupabase = createMockSupabase()
      const updateEventQuery = createChainableQuery({ error: null })
      updateEventSupabase.from.mockReturnValue(updateEventQuery as any)
      updateEventQuery.update.mockReturnValue(updateEventQuery)
      updateEventQuery.eq.mockReturnValue(updateEventQuery)

      // Final update client - needs chainable query
      const finalUpdateSupabase = createMockSupabase()
      const finalUpdateQuery = createChainableQuery({ error: null })
      finalUpdateSupabase.from.mockReturnValue(finalUpdateQuery as any)
      finalUpdateQuery.update.mockReturnValue(finalUpdateQuery)
      finalUpdateQuery.eq.mockReturnValue(finalUpdateQuery)

      // Setup createClient to return different mocks in sequence
      vi.mocked(createClient)
        .mockResolvedValueOnce(initialSupabase as any) // syncToExternal initial
        .mockResolvedValueOnce(getSyncSupabase as any) // getSyncById
        .mockResolvedValueOnce(updateSyncSupabase as any) // updateSync
        .mockResolvedValueOnce(getEventsSupabase as any) // CalendarService.getEvents
        .mockResolvedValueOnce(updateEventSupabase as any) // event update
        .mockResolvedValueOnce(finalUpdateSupabase as any) // final update

      // Mock GoogleCalendarIntegration - create a proper mock class
      class MockGoogleCalendarIntegration {
        createEvent = vi.fn().mockResolvedValue({ id: 'google-event-1' })
        updateEvent = vi.fn().mockResolvedValue({ id: 'google-event-1' })
        constructor(config: any) {
          // Mock constructor
        }
      }
      vi.mocked(GoogleCalendarIntegration).mockImplementation((config: any) => {
        return new MockGoogleCalendarIntegration(config) as any
      })

      const result = await CalendarSyncService.syncToExternal('sync-1')

      expect(result.synced).toBeGreaterThan(0)
      expect(result.error).toBeUndefined()
    })
  })

  describe('syncBidirectional', () => {
    it('should perform bidirectional sync', async () => {
      const mockSync = {
        id: 'sync-1',
        provider: 'google' as const,
      }

      // Mock syncFromExternal
      mockSupabase.single.mockResolvedValueOnce({ data: mockSync, error: null } as any)
      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockSync, status: 'syncing' },
        error: null,
      } as any)
      mockSupabase.single.mockResolvedValueOnce({
        data: { access_token: 'token', refresh_token: 'refresh' },
        error: null,
      } as any)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any)
      vi.mocked(CalendarService.getEvents).mockResolvedValue({ data: [], error: null })
      vi.mocked(CalendarService.createEvent).mockResolvedValue({
        data: { id: 'event-1' },
        error: null,
      })
      const mockGoogleCalendar = {
        getEvents: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(GoogleCalendarIntegration).mockImplementation(() => mockGoogleCalendar as any)
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockSync, status: 'active' },
        error: null,
      } as any)

      // Mock syncToExternal
      mockSupabase.single.mockResolvedValueOnce({ data: mockSync, error: null } as any)
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockSync, status: 'syncing' },
        error: null,
      } as any)
      mockSupabase.single.mockResolvedValueOnce({
        data: { access_token: 'token', refresh_token: 'refresh' },
        error: null,
      } as any)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any)
      vi.mocked(CalendarService.getEvents).mockResolvedValue({ data: [], error: null })
      const mockGoogleCalendar2 = {
        createEvent: vi.fn().mockResolvedValue({ id: 'google-event-1' }),
      }
      vi.mocked(GoogleCalendarIntegration).mockImplementation(() => mockGoogleCalendar2 as any)
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockSync, status: 'active' },
        error: null,
      } as any)

      const result = await CalendarSyncService.syncBidirectional('sync-1')

      expect(result.syncedIn).toBeDefined()
      expect(result.syncedOut).toBeDefined()
    })
  })
})
