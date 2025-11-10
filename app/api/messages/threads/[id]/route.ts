import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MessagingService } from '@/lib/services/messaging-service'

/**
 * GET /api/messages/threads/[id]
 * Get a single message thread
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data, error } = await MessagingService.getThreadById(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Check if user is a participant
    if (!data.participants.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark as read
    await MessagingService.markAsRead(id, user.id)

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Message Thread GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


