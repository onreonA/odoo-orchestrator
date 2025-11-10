import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailService } from '@/lib/services/email-service'

/**
 * GET /api/emails/[id]
 * Get a single email
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
    const { data, error } = await EmailService.getEmailById(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    // Verify ownership through email account
    const { data: account } = await EmailService.getEmailAccountById(data.email_account_id)
    if (!account || account.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark as read when viewing
    if (!data.read) {
      await EmailService.markAsRead(id, true)
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Email GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/emails/[id]
 * Update an email
 */
export async function PUT(
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
    const body = await request.json()

    // Check ownership
    const { data: email } = await EmailService.getEmailById(id)
    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    const { data: account } = await EmailService.getEmailAccountById(email.email_account_id)
    if (!account || account.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await EmailService.updateEmail(id, body)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Email PUT Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/emails/[id]
 * Delete an email
 */
export async function DELETE(
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

    // Check ownership
    const { data: email } = await EmailService.getEmailById(id)
    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    const { data: account } = await EmailService.getEmailAccountById(email.email_account_id)
    if (!account || account.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await EmailService.deleteEmail(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


