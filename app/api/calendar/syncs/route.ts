import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarSyncService, CreateSyncInput } from '@/lib/services/calendar-sync-service'

/**
 * GET /api/calendar/syncs
 * Get all calendar syncs for the current user
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId') || undefined

    const { data, error } = await CalendarSyncService.getSyncs(user.id, companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Calendar Syncs GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/calendar/syncs
 * Create a new calendar sync connection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateSyncInput = await request.json()

    // Validate required fields
    if (!body.name || !body.provider) {
      return NextResponse.json(
        { error: 'Missing required fields: name, provider' },
        { status: 400 }
      )
    }

    const { data, error } = await CalendarSyncService.createSync(body, user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error('Calendar Syncs POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
