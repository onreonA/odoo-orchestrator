import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTemplateDeploymentEngine } from '@/lib/services/template-deployment-engine'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'
import { createErrorResponse, logError, ApiErrors } from '@/lib/utils/api-error'

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
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(createErrorResponse(ApiErrors.unauthorized()), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get('instanceId')
    const status = searchParams.get('status')
    const templateType = searchParams.get('templateType')

    // Validate limit and offset
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const limit = limitParam ? parseInt(limitParam, 10) : 50
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        createErrorResponse(ApiErrors.validationError('Limit must be between 1 and 100')),
        { status: 400 }
      )
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        createErrorResponse(ApiErrors.validationError('Offset must be >= 0')),
        { status: 400 }
      )
    }

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
    logError('GET /api/odoo/deployments', error, {
      url: request.url,
    })
    return NextResponse.json(createErrorResponse(error), { status: 500 })
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
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(createErrorResponse(ApiErrors.unauthorized()), { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        createErrorResponse(ApiErrors.validationError('Invalid JSON body')),
        { status: 400 }
      )
    }

    const { instanceId, templateId, templateType, customizations } = body

    // Validate required fields
    const missingFields: string[] = []
    if (!instanceId) missingFields.push('instanceId')
    if (!templateId) missingFields.push('templateId')
    if (!templateType) missingFields.push('templateType')

    if (missingFields.length > 0) {
      return NextResponse.json(createErrorResponse(ApiErrors.missingFields(missingFields)), {
        status: 400,
      })
    }

    // Validate templateType enum
    const validTemplateTypes = ['hr', 'crm', 'accounting', 'inventory', 'project', 'custom']
    if (!validTemplateTypes.includes(templateType)) {
      return NextResponse.json(
        createErrorResponse(
          ApiErrors.validationError(
            `Invalid templateType. Must be one of: ${validTemplateTypes.join(', ')}`
          )
        ),
        { status: 400 }
      )
    }

    const deploymentEngine = getTemplateDeploymentEngine()

    const deployment = await deploymentEngine.deployTemplate({
      instanceId,
      templateId,
      templateType,
      customizations: customizations || {},
      userId: user.id,
    })

    return NextResponse.json({ deployment }, { status: 201 })
  } catch (error: any) {
    const supabaseClient = await createClient()
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()
    logError('POST /api/odoo/deployments', error, {
      userId: user?.id,
    })
    return NextResponse.json(createErrorResponse(error), { status: 500 })
  }
}
