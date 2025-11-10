import { google } from 'googleapis'

export interface GoogleCalendarConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  accessToken?: string
  refreshToken?: string
}

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  location?: string
  hangoutLink?: string
  attendees?: Array<{ email: string; displayName?: string }>
  recurrence?: string[]
  status?: string
}

export class GoogleCalendarIntegration {
  private oauth2Client: any
  private calendar: any

  constructor(config: GoogleCalendarConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    )

    if (config.accessToken && config.refreshToken) {
      this.oauth2Client.setCredentials({
        access_token: config.accessToken,
        refresh_token: config.refreshToken,
      })
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
    })
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { tokens } = await this.oauth2Client.getToken(code)
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    const { credentials } = await this.oauth2Client.refreshAccessToken()
    return credentials.access_token
  }

  /**
   * List calendars
   */
  async listCalendars(): Promise<Array<{ id: string; name: string; primary?: boolean }>> {
    const response = await this.calendar.calendarList.list()
    return (
      response.data.items?.map((cal: any) => ({
        id: cal.id,
        name: cal.summary,
        primary: cal.primary,
      })) || []
    )
  }

  /**
   * Get events from a calendar
   */
  async getEvents(
    calendarId: string,
    options?: {
      timeMin?: string
      timeMax?: string
      maxResults?: number
    }
  ): Promise<GoogleCalendarEvent[]> {
    const response = await this.calendar.events.list({
      calendarId,
      timeMin: options?.timeMin,
      timeMax: options?.timeMax,
      maxResults: options?.maxResults || 2500,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return response.data.items || []
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(
    calendarId: string,
    event: {
      summary: string
      description?: string
      start: string
      end: string
      location?: string
      attendees?: string[]
    }
  ): Promise<GoogleCalendarEvent> {
    const googleEvent: any = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.start,
        timeZone: 'Europe/Istanbul',
      },
      end: {
        dateTime: event.end,
        timeZone: 'Europe/Istanbul',
      },
    }

    if (event.location) {
      googleEvent.location = event.location
    }

    if (event.attendees && event.attendees.length > 0) {
      googleEvent.attendees = event.attendees.map(email => ({ email }))
    }

    const response = await this.calendar.events.insert({
      calendarId,
      requestBody: googleEvent,
    })

    return response.data
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<{
      summary: string
      description: string
      start: string
      end: string
      location: string
      attendees: string[]
    }>
  ): Promise<GoogleCalendarEvent> {
    // First get the event
    const existingEvent = await this.calendar.events.get({
      calendarId,
      eventId,
    })

    const googleEvent: any = {
      ...existingEvent.data,
    }

    if (event.summary) googleEvent.summary = event.summary
    if (event.description) googleEvent.description = event.description
    if (event.start) {
      googleEvent.start = {
        dateTime: event.start,
        timeZone: 'Europe/Istanbul',
      }
    }
    if (event.end) {
      googleEvent.end = {
        dateTime: event.end,
        timeZone: 'Europe/Istanbul',
      }
    }
    if (event.location) googleEvent.location = event.location
    if (event.attendees) {
      googleEvent.attendees = event.attendees.map((email: string) => ({ email }))
    }

    const response = await this.calendar.events.update({
      calendarId,
      eventId,
      requestBody: googleEvent,
    })

    return response.data
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId,
      eventId,
    })
  }

  /**
   * Convert Google Calendar event to our format
   */
  static toCalendarEvent(googleEvent: GoogleCalendarEvent): {
    title: string
    description?: string
    start_time: string
    end_time: string
    location?: string
    meeting_url?: string
    external_event_id: string
    all_day: boolean
  } {
    const start = googleEvent.start.dateTime || googleEvent.start.date
    const end = googleEvent.end?.dateTime || googleEvent.end?.date
    const allDay = !!googleEvent.start.date

    return {
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description,
      start_time: start || new Date().toISOString(),
      end_time: end || new Date().toISOString(),
      location: googleEvent.location,
      meeting_url: googleEvent.hangoutLink,
      external_event_id: googleEvent.id,
      all_day: allDay,
    }
  }

  /**
   * Convert our event to Google Calendar format
   */
  static fromCalendarEvent(event: {
    title: string
    description?: string
    start_time: string
    end_time: string
    location?: string
    meeting_url?: string
    all_day?: boolean
    attendees?: string[]
  }): any {
    return {
      summary: event.title,
      description: event.description,
      start: event.all_day
        ? { date: event.start_time.split('T')[0] }
        : { dateTime: event.start_time, timeZone: 'Europe/Istanbul' },
      end: event.all_day
        ? { date: event.end_time.split('T')[0] }
        : { dateTime: event.end_time, timeZone: 'Europe/Istanbul' },
      location: event.location,
      hangoutLink: event.meeting_url,
      attendees: event.attendees?.map(email => ({ email })),
    }
  }
}


