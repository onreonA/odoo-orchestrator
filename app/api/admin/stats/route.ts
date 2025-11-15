import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Get company name if company_id exists
    let companyName = null
    if (profile?.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', profile.company_id)
        .single()
      companyName = company?.name || null
    }

    // Get project counts
    const projectQuery = profile?.company_id
      ? supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id)
      : supabase.from('projects').select('*', { count: 'exact', head: true })

    const { count: totalProjects } = await projectQuery

    const { count: activeProjects } = await (profile?.company_id
      ? supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .in('status', ['discovery', 'planning', 'implementation'])
      : supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .in('status', ['discovery', 'planning', 'implementation']))

    const { count: completedProjects } = await (profile?.company_id
      ? supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .eq('status', 'live')
      : supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'live'))

    // Get user counts
    const userQuery = profile?.company_id
      ? supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id)
      : supabase.from('profiles').select('*', { count: 'exact', head: true })

    const { count: totalUsers } = await userQuery

    // Get ticket counts
    const ticketQuery = profile?.company_id
      ? supabase
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
      : supabase.from('support_tickets').select('*', { count: 'exact', head: true })

    const { count: openTickets } = await ticketQuery.eq('status', 'open')
    const { count: resolvedTickets } = await ticketQuery.eq('status', 'resolved')

    return NextResponse.json({
      success: true,
      data: {
        companyName,
        totalProjects: totalProjects || 0,
        activeProjects: activeProjects || 0,
        completedProjects: completedProjects || 0,
        totalUsers: totalUsers || 0,
        openTickets: openTickets || 0,
        resolvedTickets: resolvedTickets || 0,
      },
    })
  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

