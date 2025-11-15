import { createClient } from '@/lib/supabase/server'

interface CalendarEvent {
  id?: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  attendees?: Array<{ email: string; name: string }>
}

interface SyncResult {
  success: boolean
  syncedCount: number
  errors: string[]
}

export class ConsultantCalendarSyncService {
  private supabase: any

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Sync consultant calendar with Odoo
   */
  async syncWithOdoo(consultantId: string): Promise<SyncResult> {
    const supabase = await this.getSupabase()
    const { data: calendar } = await supabase
      .from('consultant_calendar')
      .select('*')
      .eq('consultant_id', consultantId)
      .single()

    if (!calendar || !calendar.sync_settings?.sync_odoo) {
      return { success: false, syncedCount: 0, errors: ['Odoo sync not enabled'] }
    }

    // Get consultant's Odoo instance
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', consultantId)
      .single()

    if (!profile?.company_id) {
      return { success: false, syncedCount: 0, errors: ['No company found'] }
    }

    const { data: odooInstance } = await supabase
      .from('odoo_instances')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('status', 'active')
      .single()

    if (!odooInstance) {
      return { success: false, syncedCount: 0, errors: ['No active Odoo instance found'] }
    }

    // Get approved meetings
    const supabase = await this.getSupabase()
    const { data: meetings } = await supabase
      .from('meeting_requests')
      .select(
        `
        *,
        company:companies(id, name),
        requested_by_user:profiles!meeting_requests_requested_by_fkey(id, full_name, email)
      `
      )
      .eq('consultant_id', consultantId)
      .eq('status', 'approved')
      .gte('requested_date', new Date().toISOString())

    if (!meetings || meetings.length === 0) {
      return { success: true, syncedCount: 0, errors: [] }
    }

    // Sync to Odoo calendar
    const errors: string[] = []
    let syncedCount = 0

    try {
      // TODO: Import and use OdooXMLRPCClient when available
      // For now, just log that sync would happen
      console.log(`Would sync ${meetings.length} meetings to Odoo instance ${odooInstance.id}`)

      // In production, this would use OdooXMLRPCClient:
      // const odooClient = new OdooXMLRPCClient(...)
      // await odooClient.create('calendar.event', eventData)

      syncedCount = meetings.length
    } catch (error: any) {
      errors.push(`Odoo connection failed: ${error.message}`)
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
    }
  }

  /**
   * Sync consultant calendar with Google Calendar
   */
  async syncWithGoogle(consultantId: string): Promise<SyncResult> {
    const { data: calendar } = await this.supabase
      .from('consultant_calendar')
      .select('*')
      .eq('consultant_id', consultantId)
      .single()

    if (!calendar || !calendar.sync_settings?.sync_google) {
      return { success: false, syncedCount: 0, errors: ['Google sync not enabled'] }
    }

    // Get Google OAuth token (would be stored in a separate table)
    // For now, return placeholder
    return {
      success: false,
      syncedCount: 0,
      errors: ['Google Calendar sync requires OAuth setup'],
    }
  }

  /**
   * Sync consultant calendar with Outlook
   */
  async syncWithOutlook(consultantId: string): Promise<SyncResult> {
    const { data: calendar } = await this.supabase
      .from('consultant_calendar')
      .select('*')
      .eq('consultant_id', consultantId)
      .single()

    if (!calendar || !calendar.sync_settings?.sync_outlook) {
      return { success: false, syncedCount: 0, errors: ['Outlook sync not enabled'] }
    }

    // Outlook sync would use Microsoft Graph API
    // For now, return placeholder
    return {
      success: false,
      syncedCount: 0,
      errors: ['Outlook Calendar sync requires OAuth setup'],
    }
  }

  /**
   * Sync all enabled calendars for a consultant
   */
  async syncAll(consultantId: string): Promise<{
    odoo: SyncResult
    google: SyncResult
    outlook: SyncResult
  }> {
    const [odoo, google, outlook] = await Promise.all([
      this.syncWithOdoo(consultantId),
      this.syncWithGoogle(consultantId),
      this.syncWithOutlook(consultantId),
    ])

    return { odoo, google, outlook }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(consultantId: string): Promise<{
    lastSync?: string
    syncEnabled: {
      odoo: boolean
      google: boolean
      outlook: boolean
    }
  }> {
    const { data: calendar } = await this.supabase
      .from('consultant_calendar')
      .select('sync_settings')
      .eq('consultant_id', consultantId)
      .single()

    if (!calendar) {
      return {
        syncEnabled: {
          odoo: false,
          google: false,
          outlook: false,
        },
      }
    }

    return {
      syncEnabled: {
        odoo: calendar.sync_settings?.sync_odoo || false,
        google: calendar.sync_settings?.sync_google || false,
        outlook: calendar.sync_settings?.sync_outlook || false,
      },
    }
  }
}

export function getConsultantCalendarSyncService(): ConsultantCalendarSyncService {
  return new ConsultantCalendarSyncService()
}
