/**
 * Support Tickets API (Portal)
 * 
 * Portal için destek talepleri endpoint'leri
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/support/tickets
 * Kullanıcının firmasının destek taleplerini listele
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company_id
    const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    // Build query
    let query = supabase
      .from('support_tickets')
      .select('id, title, description, status, priority, company_id, created_at, updated_at, resolved_at')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    // Filter by status if provided
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/support/tickets
 * Yeni destek talebi oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, priority = 'medium' } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Get user's company_id
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'User company not found' }, { status: 400 })
    }

    // Create ticket
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        title,
        description,
        priority,
        company_id: profile.company_id,
        status: 'open',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

