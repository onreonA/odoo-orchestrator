import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfigurationDeploymentService } from '@/lib/services/configuration-deployment-service'

/**
 * POST /api/configurations/[id]/rollback
 * Rollback configuration to previous version
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await request.json()
    const { instanceId, targetVersion } = body

    if (!instanceId) {
      return NextResponse.json({ error: 'instanceId is required' }, { status: 400 })
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'super_admin' && profile.role !== 'consultant') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deploymentService = getConfigurationDeploymentService()
    const result = await deploymentService.rollbackConfiguration(id, instanceId, targetVersion)

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('[Configurations Rollback API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
