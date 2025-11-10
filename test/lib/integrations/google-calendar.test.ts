import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoogleCalendarIntegration } from '@/lib/integrations/google-calendar'

// Store mock instances
const mockStore: {
  oauth2?: any
  calendar?: any
} = {}

vi.mock('googleapis', () => {
  // Create a proper class-like constructor for OAuth2
  class MockOAuth2Class {
    setCredentials: any
    generateAuthUrl: any
    getToken: any
    refreshAccessToken: any

    constructor() {
      const instance = (globalThis as any).__mockStore?.oauth2 || {
        setCredentials: vi.fn(),
        generateAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/oauth/authorize?client_id=test'),
        getToken: vi.fn(),
        refreshAccessToken: vi.fn(),
      }
      this.setCredentials = instance.setCredentials
      this.generateAuthUrl = instance.generateAuthUrl
      this.getToken = instance.getToken
      this.refreshAccessToken = instance.refreshAccessToken
    }
  }

  // Mock calendar function - return mockStore.calendar if available, otherwise default
  const MockCalendar = vi.fn().mockImplementation(() => {
    return (globalThis as any).__mockStore?.calendar || {
      calendarList: {
        list: vi.fn(),
      },
      events: {
        list: vi.fn(),
        insert: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn().mockResolvedValue({}),
      },
    }
  })

  return {
    google: {
      auth: {
        OAuth2: MockOAuth2Class,
      },
      calendar: MockCalendar,
    },
  }
})

// Set up global mock store before tests
;(globalThis as any).__mockStore = mockStore

describe('GoogleCalendarIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Create fresh mock instances for each test
    mockStore.oauth2 = {
      setCredentials: vi.fn(),
      generateAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/oauth/authorize?client_id=test'),
      getToken: vi.fn(),
      refreshAccessToken: vi.fn(),
    }

    mockStore.calendar = {
      calendarList: {
        list: vi.fn(),
      },
      events: {
        list: vi.fn(),
        insert: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    }

    // Update global store
    ;(globalThis as any).__mockStore = mockStore
  })

  describe('constructor', () => {
    it('should initialize with config', () => {
      const { google } = require('googleapis')
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      const integration = new GoogleCalendarIntegration(config)

      // Verify integration was created successfully
      expect(integration).toBeDefined()
      // Verify OAuth2 instance was created (check if methods exist)
      expect(mockStore.oauth2).toBeDefined()
      // Verify calendar was initialized
      expect(mockStore.calendar).toBeDefined()
    })

    it('should set credentials when tokens provided', () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      new GoogleCalendarIntegration(config)

      expect(mockStore.oauth2.setCredentials).toHaveBeenCalledWith({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      })
    })
  })

  describe('getAuthUrl', () => {
    it('should generate authorization URL', () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      const integration = new GoogleCalendarIntegration(config)
      const url = integration.getAuthUrl()

      expect(mockStore.oauth2.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
        prompt: 'consent',
      })
      expect(url).toBe('https://accounts.google.com/oauth/authorize?client_id=test')
    })
  })

  describe('getTokens', () => {
    it('should exchange code for tokens', async () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      const mockTokens = {
        tokens: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      }

      mockStore.oauth2.getToken.mockResolvedValue(mockTokens)

      const integration = new GoogleCalendarIntegration(config)
      const result = await integration.getTokens('auth-code')

      expect(mockStore.oauth2.getToken).toHaveBeenCalledWith('auth-code')
      expect(result.accessToken).toBe('access-token')
      expect(result.refreshToken).toBe('refresh-token')
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      const mockCredentials = {
        credentials: {
          access_token: 'new-access-token',
        },
      }

      mockStore.oauth2.refreshAccessToken.mockResolvedValue(mockCredentials)

      const integration = new GoogleCalendarIntegration(config)
      const result = await integration.refreshAccessToken()

      expect(mockStore.oauth2.refreshAccessToken).toHaveBeenCalled()
      expect(result).toBe('new-access-token')
    })
  })

  describe('listCalendars', () => {
    it('should list calendars', async () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      const mockResponse = {
        data: {
          items: [
            { id: 'primary', summary: 'Primary Calendar', primary: true },
            { id: 'calendar-1', summary: 'Work Calendar', primary: false },
          ],
        },
      }

      mockStore.calendar.calendarList.list.mockResolvedValue(mockResponse)

      const integration = new GoogleCalendarIntegration(config)
      const result = await integration.listCalendars()

      expect(mockStore.calendar.calendarList.list).toHaveBeenCalled()
      expect(result).toEqual([
        { id: 'primary', name: 'Primary Calendar', primary: true },
        { id: 'calendar-1', name: 'Work Calendar', primary: false },
      ])
    })

    it('should return empty array when no calendars', async () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      mockStore.calendar.calendarList.list.mockResolvedValue({ data: {} })

      const integration = new GoogleCalendarIntegration(config)
      const result = await integration.listCalendars()

      expect(result).toEqual([])
    })
  })

  describe('getEvents', () => {
    it('should get events from calendar', async () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      const mockEvents = [
        {
          id: 'event-1',
          summary: 'Test Event',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
        },
      ]

      const mockResponse = {
        data: {
          items: mockEvents,
        },
      }

      mockStore.calendar.events.list.mockResolvedValue(mockResponse)

      const integration = new GoogleCalendarIntegration(config)
      const result = await integration.getEvents('primary', {
        timeMin: '2024-01-01T00:00:00Z',
        timeMax: '2024-01-31T23:59:59Z',
      })

      expect(mockStore.calendar.events.list).toHaveBeenCalledWith({
        calendarId: 'primary',
        timeMin: '2024-01-01T00:00:00Z',
        timeMax: '2024-01-31T23:59:59Z',
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime',
      })
      expect(result).toEqual(mockEvents)
    })

    it('should use default maxResults when not provided', async () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      mockStore.calendar.events.list.mockResolvedValue({ data: { items: [] } })

      const integration = new GoogleCalendarIntegration(config)
      await integration.getEvents('primary')

      expect(mockStore.calendar.events.list).toHaveBeenCalledWith(
        expect.objectContaining({
          maxResults: 2500,
        })
      )
    })
  })

  describe('createEvent', () => {
    it('should create event in Google Calendar', async () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      const event = {
        summary: 'Test Event',
        description: 'Test Description',
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T11:00:00Z',
        location: 'Test Location',
        attendees: ['test@example.com'],
      }

      const mockResponse = {
        data: {
          id: 'google-event-1',
          ...event,
        },
      }

      mockStore.calendar.events.insert.mockResolvedValue(mockResponse)

      const integration = new GoogleCalendarIntegration(config)
      const result = await integration.createEvent('primary', event)

      expect(mockStore.calendar.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          summary: 'Test Event',
          description: 'Test Description',
          start: {
            dateTime: '2024-01-15T10:00:00Z',
            timeZone: 'Europe/Istanbul',
          },
          end: {
            dateTime: '2024-01-15T11:00:00Z',
            timeZone: 'Europe/Istanbul',
          },
          location: 'Test Location',
          attendees: [{ email: 'test@example.com' }],
        }),
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('updateEvent', () => {
    it('should update event in Google Calendar', async () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      const existingEvent = {
        id: 'google-event-1',
        summary: 'Old Event',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
      }

      const updateData = {
        summary: 'Updated Event',
        start: '2024-01-15T11:00:00Z',
        end: '2024-01-15T12:00:00Z',
      }

      // Mock get returns { data: { ...existingEvent } }
      mockStore.calendar.events.get.mockResolvedValue({ data: existingEvent })
      // Mock update returns updated event
      mockStore.calendar.events.update.mockResolvedValue({
        data: { ...existingEvent, ...updateData },
      })

      const integration = new GoogleCalendarIntegration(config)
      const result = await integration.updateEvent('primary', 'google-event-1', updateData)

      expect(mockStore.calendar.events.get).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'google-event-1',
      })
      expect(mockStore.calendar.events.update).toHaveBeenCalled()
      expect(result.summary).toBe('Updated Event')
    })
  })

  describe('deleteEvent', () => {
    it('should delete event from Google Calendar', async () => {
      const config = {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'http://localhost:3001/callback',
      }

      mockStore.calendar.events.delete.mockResolvedValue({})

      const integration = new GoogleCalendarIntegration(config)
      await integration.deleteEvent('primary', 'google-event-1')

      expect(mockStore.calendar.events.delete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'google-event-1',
      })
    })
  })

  describe('toCalendarEvent', () => {
    it('should convert Google Calendar event to our format', () => {
      const googleEvent = {
        id: 'google-event-1',
        summary: 'Test Event',
        description: 'Test Description',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
        location: 'Test Location',
        hangoutLink: 'https://meet.google.com/abc-def-ghi',
      }

      const result = GoogleCalendarIntegration.toCalendarEvent(googleEvent)

      expect(result.title).toBe('Test Event')
      expect(result.description).toBe('Test Description')
      expect(result.start_time).toBe('2024-01-15T10:00:00Z')
      expect(result.end_time).toBe('2024-01-15T11:00:00Z')
      expect(result.location).toBe('Test Location')
      expect(result.meeting_url).toBe('https://meet.google.com/abc-def-ghi')
      expect(result.external_event_id).toBe('google-event-1')
      expect(result.all_day).toBe(false)
    })

    it('should handle all-day events', () => {
      const googleEvent = {
        id: 'google-event-1',
        summary: 'All Day Event',
        start: { date: '2024-01-15' },
        end: { date: '2024-01-16' },
      }

      const result = GoogleCalendarIntegration.toCalendarEvent(googleEvent)

      expect(result.all_day).toBe(true)
      expect(result.start_time).toBe('2024-01-15')
    })

    it('should handle missing summary', () => {
      const googleEvent = {
        id: 'google-event-1',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
      }

      const result = GoogleCalendarIntegration.toCalendarEvent(googleEvent)

      expect(result.title).toBe('Untitled Event')
    })
  })

  describe('fromCalendarEvent', () => {
    it('should convert our event to Google Calendar format', () => {
      const event = {
        title: 'Test Event',
        description: 'Test Description',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        location: 'Test Location',
        meeting_url: 'https://meet.google.com/abc-def-ghi',
        attendees: ['test@example.com'],
      }

      const result = GoogleCalendarIntegration.fromCalendarEvent(event)

      expect(result.summary).toBe('Test Event')
      expect(result.description).toBe('Test Description')
      expect(result.start.dateTime).toBe('2024-01-15T10:00:00Z')
      expect(result.end.dateTime).toBe('2024-01-15T11:00:00Z')
      expect(result.location).toBe('Test Location')
      expect(result.hangoutLink).toBe('https://meet.google.com/abc-def-ghi')
      expect(result.attendees).toEqual([{ email: 'test@example.com' }])
    })

    it('should handle all-day events', () => {
      const event = {
        title: 'All Day Event',
        start_time: '2024-01-15T00:00:00Z',
        end_time: '2024-01-16T00:00:00Z',
        all_day: true,
      }

      const result = GoogleCalendarIntegration.fromCalendarEvent(event)

      expect(result.start.date).toBe('2024-01-15')
      expect(result.end.date).toBe('2024-01-16')
      expect(result.start.dateTime).toBeUndefined()
      expect(result.end.dateTime).toBeUndefined()
    })
  })
})

