import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MessagingService, CreateThreadInput } from '@/lib/services/messaging-service'

/**
 * GET /api/messages/threads
 * Get all message threads for the current user
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
    const projectId = searchParams.get('projectId') || undefined
    const threadType = searchParams.get('threadType') as any

    const { data, error } = await MessagingService.getThreads(user.id, {
      companyId,
      projectId,
      threadType,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Message Threads GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/messages/threads
 * Create a new message thread
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

    const body: CreateThreadInput = await request.json()

    // Validate required fields
    if (!body.thread_type || !body.participants || body.participants.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: thread_type, participants' },
        { status: 400 }
      )
    }

    const { data, error } = await MessagingService.createThread(body, user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error('Message Threads POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
