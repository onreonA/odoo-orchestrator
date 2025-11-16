import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'
import { createErrorResponse, logError, ApiErrors } from '@/lib/utils/api-error'

/**
 * GET /api/odoo/instances/[id]
 * Get instance details
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Validate instance ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        createErrorResponse(ApiErrors.validationError('Invalid instance ID')),
        { status: 400 }
      )
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(createErrorResponse(ApiErrors.unauthorized()), { status: 401 })
    }

    const instanceService = getOdooInstanceService()
    const instance = await instanceService.getInstanceById(id)

    if (!instance) {
      return NextResponse.json(createErrorResponse(ApiErrors.notFound('Instance')), { status: 404 })
    }

    // Check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      logError('GET /api/odoo/instances/[id] - Profile fetch error', profileError)
      return NextResponse.json(createErrorResponse(ApiErrors.notFound('Profile')), { status: 404 })
    }

    // Super admins can see all, company admins only their own
    if (profile.role !== 'super_admin' && instance.company_id !== profile.company_id) {
      return NextResponse.json(createErrorResponse(ApiErrors.forbidden()), { status: 403 })
    }

    return NextResponse.json({ instance })
  } catch (error: any) {
    logError('GET /api/odoo/instances/[id]', error, {
      instanceId: (await params).id,
    })
    return NextResponse.json(createErrorResponse(error), { status: 500 })
  }
}

/**
 * PUT /api/odoo/instances/[id]
 * Update instance
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Validate instance ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        createErrorResponse(ApiErrors.validationError('Invalid instance ID')),
        { status: 400 }
      )
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(createErrorResponse(ApiErrors.unauthorized()), { status: 401 })
    }

    const instanceService = getOdooInstanceService()
    const instance = await instanceService.getInstanceById(id)

    if (!instance) {
      return NextResponse.json(createErrorResponse(ApiErrors.notFound('Instance')), { status: 404 })
    }

    // Check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      logError('PUT /api/odoo/instances/[id] - Profile fetch error', profileError)
      return NextResponse.json(createErrorResponse(ApiErrors.notFound('Profile')), { status: 404 })
    }

    // Only super admins can update instances
    if (profile.role !== 'super_admin') {
      return NextResponse.json(createErrorResponse(ApiErrors.forbidden()), { status: 403 })
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

    const updates: Partial<any> = {}

    // Only allow updating certain fields
    if (body.status !== undefined) {
      const validStatuses = ['active', 'inactive', 'maintenance', 'error']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          createErrorResponse(
            ApiErrors.validationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
          ),
          { status: 400 }
        )
      }
      updates.status = body.status
    }

    if (body.health_check_interval !== undefined) {
      const interval = parseInt(body.health_check_interval, 10)
      if (isNaN(interval) || interval < 60 || interval > 86400) {
        return NextResponse.json(
          createErrorResponse(
            ApiErrors.validationError('health_check_interval must be between 60 and 86400 seconds')
          ),
          { status: 400 }
        )
      }
      updates.health_check_interval = interval
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        createErrorResponse(ApiErrors.validationError('No valid fields to update')),
        { status: 400 }
      )
    }

    const updatedInstance = await instanceService.updateInstance(id, updates)

    return NextResponse.json({ instance: updatedInstance })
  } catch (error: any) {
    logError('PUT /api/odoo/instances/[id]', error, {
      instanceId: (await params).id,
    })
    return NextResponse.json(createErrorResponse(error), { status: 500 })
  }
}

/**
 * DELETE /api/odoo/instances/[id]
 * Delete instance
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Validate instance ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        createErrorResponse(ApiErrors.validationError('Invalid instance ID')),
        { status: 400 }
      )
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(createErrorResponse(ApiErrors.unauthorized()), { status: 401 })
    }

    // Check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json(createErrorResponse(ApiErrors.forbidden()), { status: 403 })
    }

    // Verify instance exists before deletion
    const instanceService = getOdooInstanceService()
    const instance = await instanceService.getInstanceById(id)

    if (!instance) {
      return NextResponse.json(createErrorResponse(ApiErrors.notFound('Instance')), { status: 404 })
    }

    await instanceService.deleteInstance(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logError('DELETE /api/odoo/instances/[id]', error, {
      instanceId: (await params).id,
    })
    return NextResponse.json(createErrorResponse(error), { status: 500 })
  }
}
