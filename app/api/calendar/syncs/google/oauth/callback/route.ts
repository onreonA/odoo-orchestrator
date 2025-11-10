import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleCalendarIntegration } from '@/lib/integrations/google-calendar'
import { CalendarSyncService } from '@/lib/services/calendar-sync-service'

/**
 * GET /api/calendar/syncs/google/oauth/callback
 * Handle Google Calendar OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect('/login?redirect=/calendar/syncs')
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const stateParam = searchParams.get('state')
    
    // Parse state
    let syncName = 'Google Calendar'
    let companyId: string | undefined = undefined
    if (stateParam) {
      try {
        const state = JSON.parse(decodeURIComponent(stateParam))
        syncName = state.name || syncName
        companyId = state.companyId
      } catch {
        // Fallback to simple string
        syncName = decodeURIComponent(stateParam)
      }
    }

    if (error) {
      return NextResponse.redirect(`/calendar/syncs?error=${encodeURIComponent(error)}`)
    }

    if (!code) {
      return NextResponse.redirect('/calendar/syncs?error=no_code')
    }

    // Exchange code for tokens
    const googleConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/calendar/syncs/google/oauth/callback`,
    }

    const googleCalendar = new GoogleCalendarIntegration(googleConfig)
    const { accessToken, refreshToken } = await googleCalendar.getTokens(code)

    // Get calendar list
    const calendars = await googleCalendar.listCalendars()
    const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0]

    if (!primaryCalendar) {
      return NextResponse.redirect('/calendar/syncs?error=no_calendar')
    }

    // Create sync connection
    const { data: sync, error: syncError } = await CalendarSyncService.createSync(
      {
        name: syncName,
        provider: 'google',
        sync_direction: 'bidirectional',
        access_token: accessToken,
        refresh_token: refreshToken,
        external_calendar_id: primaryCalendar.id,
        external_calendar_name: primaryCalendar.name,
        company_id: companyId,
      },
      user.id
    )

    if (syncError || !sync) {
      return NextResponse.redirect(`/calendar/syncs?error=${encodeURIComponent(syncError?.message || 'sync_failed')}`)
    }

    // Redirect to sync detail page
    return NextResponse.redirect(`/calendar/syncs/${sync.id}?success=true`)
  } catch (error: any) {
    console.error('Google OAuth Callback Error:', error)
    return NextResponse.redirect(`/calendar/syncs?error=${encodeURIComponent(error.message)}`)
  }
}

