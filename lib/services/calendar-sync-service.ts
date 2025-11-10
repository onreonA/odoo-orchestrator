import { createClient } from '@/lib/supabase/server'
import { CalendarService } from './calendar-service'
import { GoogleCalendarIntegration } from '@/lib/integrations/google-calendar'

export interface CalendarSync {
  id: string
  name: string
  provider: 'google' | 'outlook' | 'caldav' | 'custom'
  sync_direction: 'one_way_in' | 'one_way_out' | 'bidirectional'
  status: 'active' | 'paused' | 'error' | 'syncing'
  external_calendar_id?: string
  external_calendar_name?: string
  user_id: string
  company_id?: string
  last_sync_at?: string
  last_sync_status?: string
  last_sync_error?: string
  next_sync_at?: string
}

export interface CreateSyncInput {
  name: string
  provider: CalendarSync['provider']
  sync_direction?: CalendarSync['sync_direction']
  api_endpoint?: string
  api_key?: string
  access_token?: string
  refresh_token?: string
  external_calendar_id?: string
  external_calendar_name?: string
  company_id?: string
}

export class CalendarSyncService {
  /**
   * Get all syncs for a user
   */
  static async getSyncs(userId: string, companyId?: string): Promise<{
    data: CalendarSync[] | null
    error: any
  }> {
    const supabase = await createClient()
    let query = supabase
      .from('calendar_syncs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    return await query
  }

  /**
   * Get a single sync by ID
   */
  static async getSyncById(id: string): Promise<{ data: CalendarSync | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('calendar_syncs')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  }

  /**
   * Create a new sync connection
   */
  static async createSync(
    input: CreateSyncInput,
    userId: string
  ): Promise<{ data: CalendarSync | null; error: any }> {
    const supabase = await createClient()
    
    // Map input fields to database columns
    const insertData: any = {
      name: input.name,
      provider: input.provider,
      sync_direction: input.sync_direction || 'bidirectional',
      status: 'active',
      user_id: userId,
      external_calendar_id: input.external_calendar_id,
      external_calendar_name: input.external_calendar_name,
      company_id: input.company_id,
    }

    // Store sensitive data (in production, these should be encrypted)
    if (input.api_endpoint) insertData.api_endpoint = input.api_endpoint
    if (input.api_key) insertData.api_key = input.api_key
    if (input.access_token) insertData.access_token = input.access_token
    if (input.refresh_token) insertData.refresh_token = input.refresh_token

    const { data, error } = await supabase
      .from('calendar_syncs')
      .insert(insertData)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Update sync connection
   */
  static async updateSync(
    id: string,
    input: Partial<CreateSyncInput & { status?: CalendarSync['status'] }>
  ): Promise<{ data: CalendarSync | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('calendar_syncs')
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
   * Delete sync connection
   */
  static async deleteSync(id: string): Promise<{ error: any }> {
    const supabase = await createClient()
    const { error } = await supabase.from('calendar_syncs').delete().eq('id', id)

    return { error }
  }

  /**
   * Sync events from external calendar to platform
   */
  static async syncFromExternal(syncId: string): Promise<{ synced: number; error?: any }> {
    const supabase = await createClient()

    // Get sync config
    const { data: sync, error: syncError } = await this.getSyncById(syncId)
    if (syncError || !sync) {
      return { synced: 0, error: syncError || 'Sync not found' }
    }

    // Update sync status
    await this.updateSync(syncId, { status: 'syncing' })

    try {
      let syncedCount = 0

      if (sync.provider === 'google') {
        // Get Google Calendar integration
        // Note: In production, access_token and refresh_token should be retrieved from encrypted storage
        const syncDetails = await supabase
          .from('calendar_syncs')
          .select('access_token, refresh_token')
          .eq('id', syncId)
          .single()

        const googleConfig = {
          clientId: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/calendar/syncs/google/oauth/callback`,
          accessToken: (syncDetails.data as any)?.access_token || undefined,
          refreshToken: (syncDetails.data as any)?.refresh_token || undefined,
        }

        const googleCalendar = new GoogleCalendarIntegration(googleConfig)

        // Get events from Google Calendar
        const calendarId = sync.external_calendar_id || 'primary'
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        const googleEvents = await googleCalendar.getEvents(calendarId, {
          timeMin: thirtyDaysAgo.toISOString(),
          timeMax: thirtyDaysLater.toISOString(),
        })

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Convert and save events
        for (const googleEvent of googleEvents) {
          const eventData = GoogleCalendarIntegration.toCalendarEvent(googleEvent)

          // Check if event already exists
          const { data: existingEvents } = await CalendarService.getEvents({
            startDate: eventData.start_time,
            endDate: eventData.end_time,
            userId: user.id,
          })

          const existing = existingEvents?.find(
            e => e.external_event_id === eventData.external_event_id
          )

          if (!existing) {
            // Create new event
            const created = await CalendarService.createEvent(
              {
                ...eventData,
                company_id: sync.company_id || undefined,
              },
              user.id
            )
            
            // Mark as synced with external calendar
            if (created.data) {
              const supabase = await createClient()
              await supabase
                .from('calendar_events')
                .update({
                  synced_with_external: true,
                  external_calendar_id: syncId,
                  last_synced_at: new Date().toISOString(),
                })
                .eq('id', created.data.id)
            }
            syncedCount++
          }
        }
      }

      // Update sync status (using direct Supabase update for fields not in CreateSyncInput)
      const supabaseUpdate = await createClient()
      await supabaseUpdate
        .from('calendar_syncs')
        .update({
          status: 'active',
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success',
          updated_at: new Date().toISOString(),
        })
        .eq('id', syncId)

      return { synced: syncedCount }
    } catch (error: any) {
      // Update sync status with error
      const supabase = await createClient()
      await supabase
        .from('calendar_syncs')
        .update({
          status: 'error',
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'failed',
          last_sync_error: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', syncId)

      return { synced: 0, error: error.message }
    }
  }

  /**
   * Sync events from platform to external calendar
   */
  static async syncToExternal(syncId: string): Promise<{ synced: number; error?: any }> {
    const supabase = await createClient()

    // Get sync config
    const { data: sync, error: syncError } = await this.getSyncById(syncId)
    if (syncError || !sync) {
      return { synced: 0, error: syncError || 'Sync not found' }
    }

    // Update sync status
    await this.updateSync(syncId, { status: 'syncing' })

    try {
      let syncedCount = 0

      if (sync.provider === 'google') {
        // Get tokens from database
        const syncDetails = await supabase
          .from('calendar_syncs')
          .select('access_token, refresh_token')
          .eq('id', syncId)
          .single()

        const googleConfig = {
          clientId: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/calendar/syncs/google/oauth/callback`,
          accessToken: (syncDetails.data as any)?.access_token || undefined,
          refreshToken: (syncDetails.data as any)?.refresh_token || undefined,
        }

        const googleCalendar = new GoogleCalendarIntegration(googleConfig)

        // Get events that need to be synced
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        const now = new Date()
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        const { data: events } = await CalendarService.getEvents({
          startDate: now.toISOString(),
          endDate: thirtyDaysLater.toISOString(),
          userId: user.id,
          companyId: sync.company_id || undefined,
        })

        if (events) {
          const calendarId = sync.external_calendar_id || 'primary'

          for (const event of events) {
            // Only sync events that haven't been synced yet or need update
            if (!event.synced_with_external || event.external_calendar_id !== syncId) {
              const googleEvent = GoogleCalendarIntegration.fromCalendarEvent({
                title: event.title,
                description: event.description,
                start_time: event.start_time,
                end_time: event.end_time,
                location: event.location,
                meeting_url: event.meeting_url,
                all_day: event.all_day,
                attendees: event.attendees,
              })

              if (event.external_event_id) {
                // Update existing event
                await googleCalendar.updateEvent(calendarId, event.external_event_id, googleEvent)
              } else {
                // Create new event
                const created = await googleCalendar.createEvent(calendarId, googleEvent)
                // Update event with external ID (using direct Supabase update)
                const supabase = await createClient()
                await supabase
                  .from('calendar_events')
                  .update({
                    external_event_id: created.id,
                    external_calendar_id: syncId,
                    synced_with_external: true,
                    last_synced_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', event.id)
              }
              syncedCount++
            }
          }
        }
      }

      // Update sync status
      const supabaseUpdate = await createClient()
      await supabaseUpdate
        .from('calendar_syncs')
        .update({
          status: 'active',
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success',
          updated_at: new Date().toISOString(),
        })
        .eq('id', syncId)

      return { synced: syncedCount }
    } catch (error: any) {
      const supabase = await createClient()
      await supabase
        .from('calendar_syncs')
        .update({
          status: 'error',
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'failed',
          last_sync_error: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', syncId)

      return { synced: 0, error: error.message }
    }
  }

  /**
   * Perform bidirectional sync
   */
  static async syncBidirectional(syncId: string): Promise<{
    syncedIn: number
    syncedOut: number
    error?: any
  }> {
    const syncIn = await this.syncFromExternal(syncId)
    const syncOut = await this.syncToExternal(syncId)

    return {
      syncedIn: syncIn.synced,
      syncedOut: syncOut.synced,
      error: syncIn.error || syncOut.error,
    }
  }
}

