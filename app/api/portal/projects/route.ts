/**
 * Portal Projects API
 * 
 * Customer Portal için proje bilgileri
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyAccess } from '@/lib/utils/permissions'

/**
 * GET /api/portal/projects
 * Kullanıcının firmasının projelerini getir (portal için)
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

    // Get projects for user's company
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, status, phase, company_id, completion_percentage, planned_go_live, actual_go_live')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Get additional data for each project
    const projectsWithDetails = await Promise.all(
      (projects || []).map(async (project) => {
        // Get modules
        const { data: modules } = await supabase
          .from('odoo_modules')
          .select('name, status')
          .eq('project_id', project.id)

        // Get milestones (from project phases)
        const milestones: any[] = []
        const plannedGoLive = (project as any).planned_go_live
        const actualGoLive = (project as any).actual_go_live
        if (plannedGoLive) {
          milestones.push({
            id: 'go-live',
            name: 'Go-Live',
            date: plannedGoLive,
            status: actualGoLive ? 'completed' : new Date(plannedGoLive) < new Date() ? 'overdue' : 'upcoming',
          })
        }

        // Mock training data (TODO: Get from actual training records)
        const training = {
          totalUsers: 20,
          completedUsers: 15,
          percentage: 75,
        }

        // Mock data migration (TODO: Get from actual migration records)
        const dataMigration = {
          status: 'completed' as const,
          percentage: 100,
        }

        return {
          ...project,
          progress: project.completion_percentage || 0,
          milestones,
          modules: (modules || []).map((m) => ({
            name: m.name,
            status: m.status,
            progress: m.status === 'deployed' ? 100 : m.status === 'testing' ? 75 : m.status === 'configuring' ? 50 : 0,
          })),
          training,
          dataMigration,
        }
      })
    )

    return NextResponse.json({ success: true, data: projectsWithDetails })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

