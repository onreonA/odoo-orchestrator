import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getMeetingNotificationService } from '@/lib/services/meeting-notification-service'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { consultant_id, company_id, requested_date, duration_minutes, meeting_type, notes } = body

  // Validation
  if (!consultant_id || !requested_date || !duration_minutes || !meeting_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  // Use profile company_id if company_id not provided
  const finalCompanyId = company_id || profile?.company_id

  if (!finalCompanyId) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
  }

  // Check if consultant allows meeting requests
  const { data: consultantCalendar } = await supabase
    .from('consultant_calendar')
    .select('privacy_settings')
    .eq('consultant_id', consultant_id)
    .single()

  if (consultantCalendar?.privacy_settings?.allow_meeting_requests === false) {
    return NextResponse.json(
      { error: 'Consultant does not accept meeting requests' },
      { status: 403 }
    )
  }

  // Check if requested date is in the future
  const requestedDate = new Date(requested_date)
  if (requestedDate < new Date()) {
    return NextResponse.json({ error: 'Requested date must be in the future' }, { status: 400 })
  }

  // Check for conflicts (same consultant, same time)
  const { data: conflictingMeetings } = await supabase
    .from('meeting_requests')
    .select('id')
    .eq('consultant_id', consultant_id)
    .eq('status', 'approved')
    .gte(
      'requested_date',
      new Date(requestedDate.getTime() - duration_minutes * 60000).toISOString()
    )
    .lte(
      'requested_date',
      new Date(requestedDate.getTime() + duration_minutes * 60000).toISOString()
    )

  if (conflictingMeetings && conflictingMeetings.length > 0) {
    return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 })
  }

  // Create meeting request
  const { data: meeting, error } = await supabase
    .from('meeting_requests')
    .insert({
      consultant_id,
      company_id: finalCompanyId,
      requested_by: user.id,
      requested_date: requestedDate.toISOString(),
      duration_minutes,
      meeting_type,
      notes: notes || null,
      status: consultantCalendar?.privacy_settings?.auto_approve ? 'approved' : 'pending',
      approved_at: consultantCalendar?.privacy_settings?.auto_approve
        ? new Date().toISOString()
        : null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send notifications
  try {
    const notificationService = getMeetingNotificationService()
    await notificationService.notifyMeetingRequestCreated(meeting.id)
  } catch (notificationError) {
    console.error('Failed to send notification:', notificationError)
    // Don't fail the request if notification fails
  }

  return NextResponse.json({ meeting })
}
