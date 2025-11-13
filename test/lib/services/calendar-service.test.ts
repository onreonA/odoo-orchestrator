import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CalendarService } from '@/lib/services/calendar-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
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
    gte: vi.fn(() => mockSupabase),
    lte: vi.fn(() => mockSupabase),
    or: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
  }
  return mockSupabase
}

describe('CalendarService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('getEvents', () => {
    it('should fetch events with date range', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Test Event',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
        },
      ]

      mockSupabase.order.mockReturnValue(mockSupabase)
      mockSupabase.lte.mockResolvedValue({ data: mockEvents, error: null } as any)

      const result = await CalendarService.getEvents({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_events')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.gte).toHaveBeenCalledWith('start_time', '2024-01-01')
      expect(mockSupabase.lte).toHaveBeenCalledWith('end_time', '2024-01-31')
      expect(result.data).toEqual(mockEvents)
    })

    it('should filter by company ID', async () => {
      mockSupabase.order.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ data: [], error: null } as any)

      await CalendarService.getEvents({
        companyId: 'company-123',
      })

      expect(mockSupabase.eq).toHaveBeenCalledWith('company_id', 'company-123')
    })

    it('should filter by user ID', async () => {
      mockSupabase.order.mockReturnValue(mockSupabase)
      mockSupabase.or.mockResolvedValue({ data: [], error: null } as any)

      await CalendarService.getEvents({
        userId: 'user-123',
      })

      expect(mockSupabase.or).toHaveBeenCalled()
    })
  })

  describe('getEventById', () => {
    it('should fetch a single event by ID', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
      }

      mockSupabase.single.mockResolvedValue({ data: mockEvent, error: null } as any)

      const result = await CalendarService.getEventById('1')

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_events')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1')
      expect(mockSupabase.single).toHaveBeenCalled()
      expect(result.data).toEqual(mockEvent)
    })
  })

  describe('createEvent', () => {
    it('should create a new event', async () => {
      const input = {
        title: 'New Event',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
      }

      const mockEvent = {
        id: '1',
        ...input,
        organizer_id: 'user-123',
        created_by: 'user-123',
        status: 'scheduled',
        event_type: 'meeting',
        all_day: false,
        is_recurring: false,
        synced_with_external: false,
        is_private: false,
        visibility: 'company',
        timezone: 'Europe/Istanbul',
        attendees: [],
        external_attendees: [],
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockEvent, error: null } as any)

      const result = await CalendarService.createEvent(input, 'user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_events')
      expect(mockSupabase.insert).toHaveBeenCalled()
      expect(result.data).toEqual(mockEvent)
    })

    it('should set default values', async () => {
      const input = {
        title: 'New Event',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: {}, error: null } as any)

      await CalendarService.createEvent(input, 'user-123')

      expect(mockSupabase.insert).toHaveBeenCalled()
      const insertCall = mockSupabase.insert.mock.calls[0]?.[0]
      if (insertCall) {
        expect(insertCall.organizer_id).toBe('user-123')
        expect(insertCall.created_by).toBe('user-123')
        expect(insertCall.status).toBe('scheduled')
        expect(insertCall.event_type).toBe('meeting')
        expect(insertCall.all_day).toBe(false)
      }
    })
  })

  describe('updateEvent', () => {
    it('should update an event', async () => {
      const updateData = {
        title: 'Updated Event',
        status: 'confirmed' as const,
      }

      const mockEvent = {
        id: '1',
        title: 'Updated Event',
        status: 'confirmed',
      }

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: mockEvent, error: null } as any)

      const result = await CalendarService.updateEvent('1', updateData)

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_events')
      expect(mockSupabase.update).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1')
      expect(result.data).toEqual(mockEvent)
    })
  })

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      mockSupabase.delete.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({ error: null } as any)

      const result = await CalendarService.deleteEvent('1')

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_events')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1')
      expect(result.error).toBeNull()
    })
  })

  describe('getEventsForMonth', () => {
    it('should get events for a specific month', async () => {
      // order should return chainable query, not a promise
      mockSupabase.order.mockReturnValue(mockSupabase)
      mockSupabase.lte.mockResolvedValue({ data: [], error: null } as any)

      await CalendarService.getEventsForMonth(2024, 1)

      expect(mockSupabase.gte).toHaveBeenCalled()
      expect(mockSupabase.lte).toHaveBeenCalled()
    })
  })

  describe('getEventsForWeek', () => {
    it('should get events for a specific week', async () => {
      mockSupabase.order.mockReturnValue(mockSupabase)
      mockSupabase.lte.mockResolvedValue({ data: [], error: null } as any)

      await CalendarService.getEventsForWeek('2024-01-15')

      expect(mockSupabase.gte).toHaveBeenCalled()
      expect(mockSupabase.lte).toHaveBeenCalled()
    })
  })

  describe('getEventsForDay', () => {
    it('should get events for a specific day', async () => {
      mockSupabase.order.mockReturnValue(mockSupabase)
      mockSupabase.lte.mockResolvedValue({ data: [], error: null } as any)

      await CalendarService.getEventsForDay('2024-01-15')

      expect(mockSupabase.gte).toHaveBeenCalled()
      expect(mockSupabase.lte).toHaveBeenCalled()
    })
  })
})
