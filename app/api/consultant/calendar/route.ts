import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get consultant calendar
  const { data: calendar, error } = await supabase
    .from('consultant_calendar')
    .select('*')
    .eq('consultant_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ calendar: calendar || null })
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is consultant or super_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'consultant' && profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { consultant_id, working_hours, privacy_settings, availability_slots, timezone } = body

  // Verify consultant_id matches user
  if (consultant_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if calendar exists
  const { data: existingCalendar } = await supabase
    .from('consultant_calendar')
    .select('id')
    .eq('consultant_id', user.id)
    .single()

  if (existingCalendar) {
    // Update existing calendar
    const updateData: any = {}
    if (working_hours !== undefined) updateData.working_hours = working_hours
    if (privacy_settings !== undefined) updateData.privacy_settings = privacy_settings
    if (availability_slots !== undefined) updateData.availability_slots = availability_slots
    if (timezone !== undefined) updateData.timezone = timezone

    const { data, error } = await supabase
      .from('consultant_calendar')
      .update(updateData)
      .eq('consultant_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ calendar: data })
  } else {
    // Create new calendar
    const { data, error } = await supabase
      .from('consultant_calendar')
      .insert({
        consultant_id: user.id,
        working_hours: working_hours || {},
        privacy_settings: privacy_settings || {
          show_availability: true,
          show_details: false,
          allow_meeting_requests: true,
          auto_approve: false,
        },
        availability_slots: availability_slots || [],
        timezone: timezone || 'Europe/Istanbul',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ calendar: data })
  }
}

