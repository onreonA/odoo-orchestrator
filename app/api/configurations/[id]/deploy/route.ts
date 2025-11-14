import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfigurationDeploymentService } from '@/lib/services/configuration-deployment-service'

/**
 * POST /api/configurations/[id]/deploy
 * Deploy configuration to Odoo instance
 */
export async function POST(
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
    const body = await request.json()
    const { instanceId, options } = body

    if (!instanceId) {
      return NextResponse.json({ error: 'instanceId is required' }, { status: 400 })
    }

    // Check permissions
    const { data: configuration } = await supabase
      .from('configurations')
      .select('company_id, status')
      .eq('id', id)
      .single()

    if (!configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    if (configuration.status !== 'approved' && configuration.status !== 'draft') {
      return NextResponse.json(
        { error: `Configuration must be approved before deployment. Current status: ${configuration.status}` },
        { status: 400 }
      )
    }

    const deploymentService = getConfigurationDeploymentService()
    const result = await deploymentService.deployConfiguration(id, instanceId, options)

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('[Configurations Deploy API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

