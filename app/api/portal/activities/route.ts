import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/portal/activities
 * Get recent activities for customer portal
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get recent activities from various sources
    const activities: any[] = []

    // Get recent projects
    const { data: recentProjects } = await supabase
      .from('projects')
      .select('id, name, status, created_at')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentProjects) {
      recentProjects.forEach((project: any) => {
        activities.push({
          id: `project-${project.id}`,
          type: 'project',
          description: `Proje "${project.name}" ${project.status} durumunda`,
          timestamp: project.created_at,
        })
      })
    }

    // Get recent discoveries
    const { data: recentDiscoveries } = await supabase
      .from('discoveries')
      .select('id, analysis_status, created_at, projects(name)')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentDiscoveries) {
      recentDiscoveries.forEach((discovery: any) => {
        activities.push({
          id: `discovery-${discovery.id}`,
          type: 'discovery',
          description: `Discovery analizi ${discovery.analysis_status} durumunda`,
          timestamp: discovery.created_at,
        })
      })
    }

    // Sort by timestamp and limit to 10 most recent
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const recentActivities = activities.slice(0, 10)

    return NextResponse.json({ success: true, data: recentActivities })
  } catch (error: any) {
    console.error('Error fetching portal activities:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

