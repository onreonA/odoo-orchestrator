import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getMeetingNotificationService } from '@/lib/services/meeting-notification-service'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

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

  // Get meeting request
  const { data: meeting, error: meetingError } = await supabase
    .from('meeting_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (meetingError || !meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  // Verify consultant_id matches user
  if (meeting.consultant_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update meeting status
  const { data, error } = await supabase
    .from('meeting_requests')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send notifications
  try {
    const notificationService = getMeetingNotificationService()
    await notificationService.notifyMeetingRequestApproved(id)
  } catch (notificationError) {
    console.error('Failed to send notification:', notificationError)
    // Don't fail the request if notification fails
  }

  return NextResponse.json({ meeting: data })
}
