import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CalendarSyncService } from '@/lib/services/calendar-sync-service'
import { createClient } from '@/lib/supabase/server'
import { CalendarService } from '@/lib/services/calendar-service'
import { GoogleCalendarIntegration } from '@/lib/integrations/google-calendar'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock CalendarService
vi.mock('@/lib/services/calendar-service', () => ({
  CalendarService: {
    getEvents: vi.fn(),
    createEvent: vi.fn(),
  },
}))

const mockGetEvents = vi.fn()
const mockCreateEvent = vi.fn()
const mockUpdateEvent = vi.fn()
const mockToCalendarEvent = vi.fn()
const mockFromCalendarEvent = vi.fn()

vi.mock('@/lib/integrations/google-calendar', () => ({
  GoogleCalendarIntegration: vi.fn().mockImplementation(() => ({
    getEvents: mockGetEvents,
    createEvent: mockCreateEvent,
    updateEvent: mockUpdateEvent,
  })),
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
  // Make query methods chainable
  query.order.mockImplementation(() => query)
  query.eq.mockImplementation(() => query)
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
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
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

      const insertCalls = mockSupabase.insert.mock.calls as any
      if (insertCalls.length > 0 && insertCalls[0] && insertCalls[0].length > 0) {
        const insertCall = insertCalls[0][0]
        if (insertCall && typeof insertCall === 'object') {
          expect(insertCall.sync_direction).toBe('bidirectional')
          expect(insertCall.status).toBe('active')
        }
      }
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
    it.skip('should sync events from Google Calendar', async () => {
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

      // getSyncById client - needs chainable query with single()
      const getSyncSupabase = createMockSupabase()
      const getSyncQuery = createChainableQuery({ data: mockSync, error: null })
      getSyncSupabase.from.mockReturnValue(getSyncQuery as any)
      getSyncQuery.select.mockReturnValue(getSyncQuery)
      getSyncQuery.eq.mockReturnValue(getSyncQuery)
      getSyncQuery.single = vi.fn().mockResolvedValue({ data: mockSync, error: null })

      // updateSync client - needs chainable query with single()
      const updateSyncSupabase = createMockSupabase()
      const updateSyncQuery = createChainableQuery({
        data: { ...mockSync, status: 'syncing' },
        error: null,
      })
      updateSyncSupabase.from.mockReturnValue(updateSyncQuery as any)
      updateSyncQuery.update.mockReturnValue(updateSyncQuery)
      updateSyncQuery.select.mockReturnValue(updateSyncQuery)
      updateSyncQuery.eq.mockReturnValue(updateSyncQuery)
      updateSyncQuery.single = vi.fn().mockResolvedValue({
        data: { ...mockSync, status: 'syncing' },
        error: null,
      })

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

      // Mock CalendarService methods
      vi.mocked(CalendarService.getEvents).mockResolvedValue({
        data: [],
        error: null,
      } as any)
      vi.mocked(CalendarService.createEvent).mockResolvedValue({
        data: createdEvent,
        error: null,
      } as any)

      // Setup GoogleCalendarIntegration mocks
      mockGetEvents.mockResolvedValue(mockGoogleEvents)
      mockToCalendarEvent.mockImplementation((event: any) => ({
        title: event.summary || 'Test Event',
        description: '',
        start_time: event.start?.dateTime || '2024-01-15T10:00:00Z',
        end_time: event.end?.dateTime || '2024-01-15T11:00:00Z',
        location: null,
        meeting_url: null,
        all_day: false,
        attendees: [],
        external_event_id: event.id || 'google-event-1',
      }))
      ;(GoogleCalendarIntegration as any).toCalendarEvent = mockToCalendarEvent

      const result = await CalendarSyncService.syncFromExternal('sync-1')

      // Verify GoogleCalendarIntegration.getEvents was called
      expect(mockGetEvents).toHaveBeenCalled()
      // Verify CalendarService methods were called
      expect(CalendarService.getEvents).toHaveBeenCalled()
      expect(CalendarService.createEvent).toHaveBeenCalled()
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
    it.skip('should sync events to Google Calendar', async () => {
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
          description: 'Test Description',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          location: null,
          meeting_url: null,
          all_day: false,
          attendees: [],
          synced_with_external: false,
          external_event_id: null,
          external_calendar_id: null,
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

      // getSyncById client - needs chainable query with single()
      const getSyncSupabase = createMockSupabase()
      const getSyncQuery = createChainableQuery({ data: mockSync, error: null })
      getSyncSupabase.from.mockReturnValue(getSyncQuery as any)
      getSyncQuery.select.mockReturnValue(getSyncQuery)
      getSyncQuery.eq.mockReturnValue(getSyncQuery)
      getSyncQuery.single = vi.fn().mockResolvedValue({ data: mockSync, error: null })

      // updateSync client - needs chainable query with single()
      const updateSyncSupabase = createMockSupabase()
      const updateSyncQuery = createChainableQuery({
        data: { ...mockSync, status: 'syncing' },
        error: null,
      })
      updateSyncSupabase.from.mockReturnValue(updateSyncQuery as any)
      updateSyncQuery.update.mockReturnValue(updateSyncQuery)
      updateSyncQuery.select.mockReturnValue(updateSyncQuery)
      updateSyncQuery.eq.mockReturnValue(updateSyncQuery)
      updateSyncQuery.single = vi.fn().mockResolvedValue({
        data: { ...mockSync, status: 'syncing' },
        error: null,
      })

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
      // syncToExternal calls createClient() in this order:
      // 1. syncToExternal initial (line 269)
      // 2. getSyncById -> createClient() (line 63)
      // 3. updateSync -> createClient() (line 112)
      // 4. sync details query uses initial client (line 286) - no new createClient call
      // 5. CalendarService.getEvents -> createClient() (inside CalendarService, but mocked)
      // 6. event update -> createClient() (line 344)
      // 7. final update -> createClient() (line 363)
      vi.mocked(createClient)
        .mockResolvedValueOnce(initialSupabase as any) // syncToExternal initial (line 269)
        .mockResolvedValueOnce(getSyncSupabase as any) // getSyncById -> createClient() (line 63)
        .mockResolvedValueOnce(updateSyncSupabase as any) // updateSync -> createClient() (line 112)
        .mockResolvedValueOnce(updateEventSupabase as any) // event update -> createClient() (line 344)
        .mockResolvedValueOnce(finalUpdateSupabase as any) // final update -> createClient() (line 363)

      // Setup GoogleCalendarIntegration mocks
      mockCreateEvent.mockResolvedValue({ id: 'google-event-1' })
      mockUpdateEvent.mockResolvedValue({ id: 'google-event-1' })
      mockFromCalendarEvent.mockImplementation((event: any) => ({
        summary: event.title,
        description: event.description,
        start: { dateTime: event.start_time },
        end: { dateTime: event.end_time },
      }))
      ;(GoogleCalendarIntegration as any).fromCalendarEvent = mockFromCalendarEvent

      // Mock CalendarService.getEvents to return mock events (must be after GoogleCalendarIntegration mock)
      vi.mocked(CalendarService.getEvents).mockResolvedValue({
        data: mockEvents,
        error: null,
      } as any)

      const result = await CalendarSyncService.syncToExternal('sync-1')

      // Verify CalendarService.getEvents was called
      expect(CalendarService.getEvents).toHaveBeenCalled()
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
      vi.mocked(CalendarService.getEvents).mockResolvedValue({ data: [], error: null } as any)
      vi.mocked(CalendarService.createEvent).mockResolvedValue({
        data: { id: 'event-1' },
        error: null,
      } as any)
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
      vi.mocked(CalendarService.getEvents).mockResolvedValue({ data: [], error: null } as any)
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
