import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleCalendarIntegration } from '@/lib/integrations/google-calendar'
import { CalendarSyncService } from '@/lib/services/calendar-sync-service'

/**
 * GET /api/calendar/syncs/google/oauth
 * Initiate Google Calendar OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name') || 'Google Calendar'
    const companyId = searchParams.get('companyId') || undefined

    // Create Google Calendar integration
    const googleConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/calendar/syncs/google/oauth/callback`,
    }

    const googleCalendar = new GoogleCalendarIntegration(googleConfig)
    const authUrl = googleCalendar.getAuthUrl()

    // Add state parameter with sync name and companyId
    const state = encodeURIComponent(JSON.stringify({ name, companyId }))
    const urlWithState = `${authUrl}&state=${state}`

    return NextResponse.redirect(urlWithState)
  } catch (error: any) {
    console.error('Google OAuth Init Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/calendar/syncs/google/oauth/callback
 * Handle Google Calendar OAuth callback
 */
export async function GET_CALLBACK(request: NextRequest) {
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
    const state = searchParams.get('state') // Can include sync name, companyId, etc.

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
    const syncName = state ? decodeURIComponent(state) : 'Google Calendar'
    const { data: sync, error: syncError } = await CalendarSyncService.createSync(
      {
        name: syncName,
        provider: 'google',
        sync_direction: 'bidirectional',
        access_token: accessToken,
        refresh_token: refreshToken,
        external_calendar_id: primaryCalendar.id,
        external_calendar_name: primaryCalendar.name,
      },
      user.id
    )

    if (syncError || !sync) {
      return NextResponse.redirect(
        `/calendar/syncs?error=${encodeURIComponent(syncError?.message || 'sync_failed')}`
      )
    }

    // Redirect to sync detail page
    return NextResponse.redirect(`/calendar/syncs/${sync.id}?success=true`)
  } catch (error: any) {
    console.error('Google OAuth Init Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
