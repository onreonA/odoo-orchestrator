import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/utils/permissions'

/**
 * GET /api/admin/stats
 * Get admin statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check permissions
    const permission = await requireRole(supabase, ['company_admin', 'super_admin'])
    if (!permission.allowed) {
      return NextResponse.json({ error: permission.reason || 'Permission denied' }, { status: 403 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', permission.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let companyName = null
    let companyFilter = {}

    // If company_admin, filter by company_id
    if (profile.role === 'company_admin' && profile.company_id) {
      companyFilter = { company_id: profile.company_id }

      // Get company name
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', profile.company_id)
        .single()

      companyName = company?.name || null
    }

    // Get projects stats
    let projectsQuery = supabase.from('projects').select('id, status')
    if (profile.role === 'company_admin' && profile.company_id) {
      projectsQuery = projectsQuery.eq('company_id', profile.company_id)
    }
    const { data: projects } = await projectsQuery

    // Get users stats
    let usersQuery = supabase.from('profiles').select('id')
    if (profile.role === 'company_admin' && profile.company_id) {
      usersQuery = usersQuery.eq('company_id', profile.company_id)
    }
    const { data: users } = await usersQuery

    // Get tickets stats
    let ticketsQuery = supabase.from('support_tickets').select('id, status')
    if (profile.role === 'company_admin' && profile.company_id) {
      ticketsQuery = ticketsQuery.eq('company_id', profile.company_id)
    }
    const { data: tickets } = await ticketsQuery

    // Calculate stats
    const totalProjects = projects?.length || 0
    const activeProjects =
      projects?.filter((p: any) => p.status === 'in_progress' || p.status === 'testing').length || 0
    const completedProjects = projects?.filter((p: any) => p.status === 'completed').length || 0
    const totalUsers = users?.length || 0
    const openTickets =
      tickets?.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length || 0
    const resolvedTickets = tickets?.filter((t: any) => t.status === 'resolved').length || 0

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
