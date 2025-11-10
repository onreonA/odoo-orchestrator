/**
 * Admin Users API
 * 
 * Kullanıcı yönetimi endpoint'leri (Company Admin için)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole, requirePermission } from '@/lib/utils/permissions'

/**
 * GET /api/admin/users
 * Kullanıcıları listele (kendi firmasının kullanıcıları)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check permission
    const { allowed, userId, reason } = await requireRole(['super_admin', 'company_admin'])
    if (!allowed) {
      return NextResponse.json({ error: reason || 'Permission denied' }, { status: 403 })
    }

    // Get user's company_id
    const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', userId).single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Build query
    let query = supabase.from('profiles').select('id, email, full_name, role, company_id, created_at')

    // Super admin sees all, company admin sees only own company
    if (profile.role === 'super_admin') {
      // Super admin sees all users
    } else if (profile.role === 'company_admin' && profile.company_id) {
      query = query.eq('company_id', profile.company_id)
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * Yeni kullanıcı ekle
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check permission
    const { allowed, userId, reason } = await requirePermission({
      resource: 'user',
      action: 'create',
    })

    if (!allowed) {
      return NextResponse.json({ error: reason || 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name, role, password } = body

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    // Get user's company_id
    const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', userId).single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Company admin can only create users for their own company
    let targetCompanyId = profile.company_id
    if (profile.role === 'super_admin' && body.company_id) {
      targetCompanyId = body.company_id
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password || 'temp-password-change-me',
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
        company_id: targetCompanyId,
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: newProfile })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

