import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTemplateDeploymentEngine } from '@/lib/services/template-deployment-engine'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'

/**
 * GET /api/odoo/deployments
 * List deployments
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get('instanceId')
    const status = searchParams.get('status')
    const templateType = searchParams.get('templateType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const monitoringService = getDeploymentMonitoringService()

    const deployments = await monitoringService.getDeploymentHistory({
      instanceId: instanceId || undefined,
      templateType: templateType || undefined,
      status: status || undefined,
      limit,
      offset,
    })

    return NextResponse.json({ deployments })
  } catch (error: any) {
    console.error('[API] Error listing deployments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list deployments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/odoo/deployments
 * Create a new deployment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { instanceId, templateId, templateType, customizations } = body

    // Validate required fields
    if (!instanceId || !templateId || !templateType) {
      return NextResponse.json(
        { error: 'Missing required fields: instanceId, templateId, templateType' },
        { status: 400 }
      )
    }

    const deploymentEngine = getTemplateDeploymentEngine()

    const deployment = await deploymentEngine.deployTemplate({
      instanceId,
      templateId,
      templateType,
      customizations,
      userId: user.id,
    })

    return NextResponse.json({ deployment }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error creating deployment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create deployment' },
      { status: 500 }
    )
  }
}
