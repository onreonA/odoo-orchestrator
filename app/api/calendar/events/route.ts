import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarService, CreateCalendarEventInput } from '@/lib/services/calendar-service'

/**
 * GET /api/calendar/events
 * Get calendar events
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
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const companyId = searchParams.get('companyId') || undefined
    const projectId = searchParams.get('projectId') || undefined
    const userId = searchParams.get('userId') || user.id

    const { data, error } = await CalendarService.getEvents({
      startDate,
      endDate,
      companyId,
      projectId,
      userId,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Calendar Events GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/calendar/events
 * Create a new calendar event
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

    const body: CreateCalendarEventInput = await request.json()

    // Validate required fields
    if (!body.title || !body.start_time || !body.end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start_time, end_time' },
        { status: 400 }
      )
    }

    // Validate time range
    if (new Date(body.end_time) <= new Date(body.start_time)) {
      return NextResponse.json({ error: 'end_time must be after start_time' }, { status: 400 })
    }

    const { data, error } = await CalendarService.createEvent(body, user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error('Calendar Events POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
