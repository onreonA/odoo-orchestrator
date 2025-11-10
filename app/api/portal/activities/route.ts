/**
 * Portal Activities API
 * 
 * Customer Portal için aktivite kayıtları
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/portal/activities
 * Kullanıcının firmasının aktivitelerini getir
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
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()

    if (!profile || !profile.company_id) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get activities from various sources
    const activities: any[] = []

    // Project updates
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, status, updated_at')
      .eq('company_id', profile.company_id)
      .order('updated_at', { ascending: false })
      .limit(5)

    projects?.forEach((project) => {
      activities.push({
        id: `project-${project.id}`,
        type: 'project',
        description: `${project.name} projesi güncellendi`,
        timestamp: project.updated_at,
      })
    })

    // Support tickets
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id, title, status, created_at')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(5)

    tickets?.forEach((ticket) => {
      activities.push({
        id: `ticket-${ticket.id}`,
        type: 'ticket',
        description: `Destek talebi: ${ticket.title}`,
        timestamp: ticket.created_at,
      })
    })

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const recentActivities = activities.slice(0, 10)

    return NextResponse.json({ success: true, data: recentActivities })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

