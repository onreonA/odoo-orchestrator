import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/calendar/events/route'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

vi.mock('@/lib/services/calendar-service', () => ({
  CalendarService: {
    getEvents: vi.fn(),
    createEvent: vi.fn(),
  },
}))

import { CalendarService } from '@/lib/services/calendar-service'

describe('Calendar Events API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
  })

  describe('GET /api/calendar/events', () => {
    it('should return events for authenticated user', async () => {
      const mockEvents: any[] = [
        {
          id: '1',
          title: 'Test Event',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          event_type: 'meeting',
          status: 'scheduled',
          all_day: false,
          auto_prepared: false,
          is_recurring: false,
          synced_with_external: false,
          is_private: false,
          visibility: 'company',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ]

      vi.mocked(CalendarService.getEvents).mockResolvedValue({
        data: mockEvents,
        error: null,
      })

      const url = new URL('http://localhost:3001/api/calendar/events')
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockEvents)
      expect(CalendarService.getEvents).toHaveBeenCalled()
    })

    it('should filter by query parameters', async () => {
      vi.mocked(CalendarService.getEvents).mockResolvedValue({
        data: [],
        error: null,
      })

      const url = new URL('http://localhost:3001/api/calendar/events')
      url.searchParams.set('startDate', '2024-01-01')
      url.searchParams.set('endDate', '2024-01-31')
      url.searchParams.set('companyId', 'company-123')

      const request = new NextRequest(url)
      await GET(request)

      expect(CalendarService.getEvents).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        companyId: 'company-123',
        projectId: undefined,
        userId: 'user-123',
      })
    })

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const url = new URL('http://localhost:3001/api/calendar/events')
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/calendar/events', () => {
    it('should create a new event', async () => {
      const eventData = {
        title: 'New Event',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
      }

      const mockEvent: any = {
        id: '1',
        ...eventData,
        event_type: 'meeting',
        status: 'scheduled',
        all_day: false,
        auto_prepared: false,
        is_recurring: false,
        synced_with_external: false,
        is_private: false,
        visibility: 'company',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      }

      vi.mocked(CalendarService.createEvent).mockResolvedValue({
        data: mockEvent,
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data).toEqual(mockEvent)
      expect(CalendarService.createEvent).toHaveBeenCalledWith(eventData, 'user-123')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3001/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should validate time range', async () => {
      const eventData = {
        title: 'Test Event',
        start_time: '2024-01-15T11:00:00Z',
        end_time: '2024-01-15T10:00:00Z', // End before start
      }

      const request = new NextRequest('http://localhost:3001/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('end_time must be after start_time')
    })

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new NextRequest('http://localhost:3001/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
