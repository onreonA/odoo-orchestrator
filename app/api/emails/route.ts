import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailService, CreateEmailInput } from '@/lib/services/email-service'

/**
 * GET /api/emails
 * Get emails for the current user
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
    const emailAccountId = searchParams.get('emailAccountId') || undefined
    const companyId = searchParams.get('companyId') || undefined
    const projectId = searchParams.get('projectId') || undefined
    const status = searchParams.get('status') as any
    const priority = searchParams.get('priority') as any
    const read = searchParams.get('read') === 'true' ? true : searchParams.get('read') === 'false' ? false : undefined
    const starred = searchParams.get('starred') === 'true' ? true : searchParams.get('starred') === 'false' ? false : undefined
    const threadId = searchParams.get('threadId') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const { data, error } = await EmailService.getEmails({
      userId: user.id,
      emailAccountId,
      companyId,
      projectId,
      status,
      priority,
      read,
      starred,
      threadId,
      limit,
      offset,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Emails GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/emails
 * Create a new email (draft)
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

    const body: CreateEmailInput = await request.json()

    // Validate required fields
    if (!body.subject || !body.to_addresses || !body.email_account_id) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, to_addresses, email_account_id' },
        { status: 400 }
      )
    }

    const { data, error } = await EmailService.createEmail(body, user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error('Emails POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


