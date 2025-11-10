import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MessagingService, CreateMessageInput } from '@/lib/services/messaging-service'

/**
 * GET /api/messages/threads/[id]/messages
 * Get messages for a thread
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

    const { id: threadId } = await params

    // Verify user is a participant
    const { data: thread } = await MessagingService.getThreadById(threadId)
    if (!thread || !thread.participants.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const { data, error } = await MessagingService.getMessages(threadId, { limit, offset })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Mark as read
    await MessagingService.markAsRead(threadId, user.id)

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Messages GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/messages/threads/[id]/messages
 * Create a new message in a thread
 */
export async function POST(
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

    const { id: threadId } = await params

    // Verify user is a participant
    const { data: thread } = await MessagingService.getThreadById(threadId)
    if (!thread || !thread.participants.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: Omit<CreateMessageInput, 'thread_id'> = await request.json()

    // Validate required fields
    if (!body.content && (!body.attachments || body.attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Missing required field: content or attachments' },
        { status: 400 }
      )
    }

    const { data, error } = await MessagingService.createMessage(
      {
        ...body,
        thread_id: threadId,
      },
      user.id
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error('Messages POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

