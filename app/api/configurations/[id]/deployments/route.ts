import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/configurations/[id]/deployments
 * Get deployment history for a configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: deployments, error } = await supabase
      .from('configuration_deployments')
      .select(`
        *,
        odoo_instances(id, name)
      `)
      .eq('configuration_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    // Transform to match component interface
    const transformedDeployments = deployments?.map((d: any) => ({
      id: d.id,
      instance_id: d.instance_id,
      instance: d.odoo_instances ? { name: d.odoo_instances.name } : null,
      status: d.status,
      progress: d.progress || 0,
      current_step: d.current_step,
      error_message: d.error_message,
      started_at: d.started_at,
      completed_at: d.completed_at,
      duration_seconds: d.duration_seconds,
    }))

    return NextResponse.json({ deployments: transformedDeployments || [] })
  } catch (error: any) {
    console.error('[Configurations Deployments API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




