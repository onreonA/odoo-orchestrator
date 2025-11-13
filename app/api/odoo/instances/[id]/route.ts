import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'

/**
 * GET /api/odoo/instances/[id]
 * Get instance details
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instanceService = getOdooInstanceService()
    const instance = await instanceService.getInstanceById(id)

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Super admins can see all, company admins only their own
    if (profile.role !== 'super_admin' && instance.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ instance })
  } catch (error: any) {
    console.error('[API] Error getting instance:', error)
    return NextResponse.json({ error: error.message || 'Failed to get instance' }, { status: 500 })
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

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instanceService = getOdooInstanceService()
    const instance = await instanceService.getInstanceById(id)

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only super admins can update instances
    if (profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updates: Partial<any> = {}

    // Only allow updating certain fields
    if (body.status !== undefined) updates.status = body.status
    if (body.health_check_interval !== undefined)
      updates.health_check_interval = body.health_check_interval

    const updatedInstance = await instanceService.updateInstance(id, updates)

    return NextResponse.json({ instance: updatedInstance })
  } catch (error: any) {
    console.error('[API] Error updating instance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update instance' },
      { status: 500 }
    )
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

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const instanceService = getOdooInstanceService()
    await instanceService.deleteInstance(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error deleting instance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete instance' },
      { status: 500 }
    )
  }
}
