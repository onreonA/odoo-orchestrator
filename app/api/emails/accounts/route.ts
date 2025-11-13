import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailService, CreateEmailAccountInput } from '@/lib/services/email-service'

/**
 * GET /api/emails/accounts
 * Get all email accounts for the current user
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

    const { data, error } = await EmailService.getEmailAccounts(user.id, companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Email Accounts GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/emails/accounts
 * Create a new email account
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

    const body: CreateEmailAccountInput = await request.json()

    // Validate required fields
    if (!body.email_address) {
      return NextResponse.json({ error: 'Missing required field: email_address' }, { status: 400 })
    }

    const { data, error } = await EmailService.createEmailAccount(body, user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    console.error('Email Accounts POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
