/**
 * Admin Stats API
 * 
 * Company Admin için istatistikler
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/utils/permissions'

/**
 * GET /api/admin/stats
 * Company Admin için istatistikleri getir
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

    let companyId: string | null = null
    if (profile.role === 'company_admin' && profile.company_id) {
      companyId = profile.company_id
    }

    // Get company name
    let companyName: string | undefined
    if (companyId) {
      const { data: company } = await supabase.from('companies').select('name').eq('id', companyId).single()
      companyName = company?.name
    }

    // Build queries
    let projectsQuery = supabase.from('projects').select('id, status')
    let usersQuery = supabase.from('profiles').select('id')
    let ticketsQuery = supabase.from('support_tickets').select('id, status')

    // Filter by company if not super admin
    if (companyId) {
      projectsQuery = projectsQuery.eq('company_id', companyId)
      usersQuery = usersQuery.eq('company_id', companyId)
      ticketsQuery = ticketsQuery.eq('company_id', companyId)
    }

    // Execute queries
    const [projectsResult, usersResult, ticketsResult] = await Promise.all([
      projectsQuery,
      usersQuery,
      ticketsQuery,
    ])

    const projects = projectsResult.data || []
    const users = usersResult.data || []
    const tickets = ticketsResult.data || []

    // Calculate stats
    const totalProjects = projects.length
    const activeProjects = projects.filter((p) => p.status === 'in_progress' || p.status === 'testing').length
    const completedProjects = projects.filter((p) => p.status === 'completed').length
    const totalUsers = users.length
    const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length
    const resolvedTickets = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalUsers,
        openTickets,
        resolvedTickets,
        companyName,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

