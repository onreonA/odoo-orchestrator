/**
 * Admin Projects API
 * 
 * Company Admin için proje listesi
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/utils/permissions'

/**
 * GET /api/admin/projects
 * Company Admin için projeleri listele
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
    let query = supabase
      .from('projects')
      .select('id, name, status, phase, company_id, progress, health_score')
      .order('created_at', { ascending: false })

    // Filter by company if not super admin
    if (profile.role === 'company_admin' && profile.company_id) {
      query = query.eq('company_id', profile.company_id)
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

