import { createClient } from '@/lib/supabase/server'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  event_type: 'meeting' | 'call' | 'task' | 'reminder' | 'block' | 'other'
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  start_time: string
  end_time: string
  timezone?: string
  all_day: boolean
  location?: string
  meeting_url?: string
  organizer_id?: string
  attendees?: string[]
  external_attendees?: string[]
  company_id?: string
  project_id?: string
  discovery_id?: string
  energy_level?: string
  preparation_notes?: string
  auto_prepared: boolean
  is_recurring: boolean
  recurrence_rule?: string
  recurrence_end_date?: string
  parent_event_id?: string
  synced_with_external: boolean
  external_event_id?: string
  external_calendar_id?: string
  last_synced_at?: string
  is_private: boolean
  visibility: 'public' | 'company' | 'private'
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreateCalendarEventInput {
  title: string
  description?: string
  event_type?: CalendarEvent['event_type']
  start_time: string
  end_time: string
  timezone?: string
  all_day?: boolean
  location?: string
  meeting_url?: string
  attendees?: string[]
  external_attendees?: string[]
  company_id?: string
  project_id?: string
  discovery_id?: string
  is_recurring?: boolean
  recurrence_rule?: string
  recurrence_end_date?: string
  is_private?: boolean
  visibility?: CalendarEvent['visibility']
}

export interface UpdateCalendarEventInput extends Partial<CreateCalendarEventInput> {
  status?: CalendarEvent['status']
}

export class CalendarService {
  /**
   * Get calendar events for a date range
   */
  static async getEvents(params: {
    startDate?: string
    endDate?: string
    companyId?: string
    projectId?: string
    userId?: string
  }): Promise<{ data: CalendarEvent[] | null; error: any }> {
    const supabase = await createClient()
    let query = supabase
      .from('calendar_events')
      .select('*')
      .order('start_time', { ascending: true })

    if (params.startDate) {
      query = query.gte('start_time', params.startDate)
    }

    if (params.endDate) {
      query = query.lte('end_time', params.endDate)
    }

    if (params.companyId) {
      query = query.eq('company_id', params.companyId)
    }

    if (params.projectId) {
      query = query.eq('project_id', params.projectId)
    }

    if (params.userId) {
      query = query.or(`organizer_id.eq.${params.userId},attendees.cs.{${params.userId}}`)
    }

    return await query
  }

  /**
   * Get a single event by ID
   */
  static async getEventById(id: string): Promise<{ data: CalendarEvent | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('calendar_events').select('*').eq('id', id).single()

    return { data, error }
  }

  /**
   * Create a new calendar event
   */
  static async createEvent(
    input: CreateCalendarEventInput,
    userId: string
  ): Promise<{ data: CalendarEvent | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...input,
        organizer_id: userId,
        created_by: userId,
        status: 'scheduled',
        event_type: input.event_type || 'meeting',
        all_day: input.all_day || false,
        is_recurring: input.is_recurring || false,
        synced_with_external: false,
        is_private: input.is_private || false,
        visibility: input.visibility || 'company',
        timezone: input.timezone || 'Europe/Istanbul',
        attendees: input.attendees || [],
        external_attendees: input.external_attendees || [],
      })
      .select()
      .single()

    return { data, error }
  }

  /**
   * Update an existing calendar event
   */
  static async updateEvent(
    id: string,
    input: UpdateCalendarEventInput
  ): Promise<{ data: CalendarEvent | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Delete a calendar event
   */
  static async deleteEvent(id: string): Promise<{ error: any }> {
    const supabase = await createClient()
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)

    return { error }
  }

  /**
   * Get events for a specific month
   */
  static async getEventsForMonth(
    year: number,
    month: number,
    companyId?: string
  ): Promise<{
    data: CalendarEvent[] | null
    error: any
  }> {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    return this.getEvents({
      startDate,
      endDate,
      companyId,
    })
  }

  /**
   * Get events for a specific week
   */
  static async getEventsForWeek(
    startDate: string,
    companyId?: string
  ): Promise<{
    data: CalendarEvent[] | null
    error: any
  }> {
    const endDate = new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    return this.getEvents({
      startDate,
      endDate,
      companyId,
    })
  }

  /**
   * Get events for a specific day
   */
  static async getEventsForDay(
    date: string,
    companyId?: string
  ): Promise<{
    data: CalendarEvent[] | null
    error: any
  }> {
    const startDate = new Date(date).toISOString()
    const endDate = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString()

    return this.getEvents({
      startDate,
      endDate,
      companyId,
    })
  }
}
