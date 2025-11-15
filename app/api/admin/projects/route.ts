import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/projects
 * Get all projects for admin dashboard
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

    // Get projects
    let query = supabase
      .from('projects')
      .select('id, name, status, company_id, created_at, start_date, end_date')
      .order('created_at', { ascending: false })
      .limit(20)

    if (profile?.company_id) {
      query = query.eq('company_id', profile.company_id)
    }

    const { data: projects, error: projectsError } = await query

    if (projectsError) {
      return NextResponse.json({ success: false, error: projectsError.message }, { status: 400 })
    }

    // Get company names for projects
    const companyIds = [...new Set(projects?.map((p: any) => p.company_id).filter(Boolean) || [])]
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .in('id', companyIds)

    const companyMap = new Map(companies?.map((c: any) => [c.id, c.name]) || [])

    // Enrich projects with company names
    const enrichedProjects = projects?.map((project: any) => ({
      ...project,
      companyName: companyMap.get(project.company_id) || 'Unknown',
      phase: project.status || 'discovery',
      progress:
        project.status === 'live'
          ? 100
          : project.status === 'implementation'
            ? 75
            : project.status === 'planning'
              ? 50
              : 25,
      health_score: 85, // Default health score
    }))

    return NextResponse.json({
      success: true,
      data: enrichedProjects || [],
    })
  } catch (error: any) {
    console.error('Error fetching admin projects:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
