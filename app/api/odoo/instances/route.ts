import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOdooInstanceService, InstanceConfig } from '@/lib/services/odoo-instance-service'

/**
 * GET /api/odoo/instances
 * List all Odoo instances
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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const instanceService = getOdooInstanceService()

    // Super admins see all instances
    if (profile.role === 'super_admin') {
      const instances = await instanceService.getAllInstances()
      return NextResponse.json({ instances })
    }

    // Company admins see their own instance
    if (profile.company_id) {
      const instance = await instanceService.getInstanceInfo(profile.company_id)
      return NextResponse.json({ instances: instance ? [instance] : [] })
    }

    return NextResponse.json({ instances: [] })
  } catch (error: any) {
    console.error('[API] Error listing instances:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list instances' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/odoo/instances
 * Create a new Odoo instance
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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only super admins and company admins can create instances
    if (profile.role !== 'super_admin' && profile.role !== 'company_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      companyId,
      deploymentMethod,
      instanceName,
      databaseName,
      version,
      adminUsername,
      adminPassword,
      subscriptionTier,
      region,
      odooComAccountId,
      odooComSubdomain,
    } = body

    // Validate required fields
    if (
      !companyId ||
      !deploymentMethod ||
      !instanceName ||
      !databaseName ||
      !adminUsername ||
      !adminPassword
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Super admins can create for any company, company admins only for their own
    if (profile.role !== 'super_admin' && profile.company_id !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const instanceService = getOdooInstanceService()

    const config: InstanceConfig = {
      deploymentMethod,
      instanceName,
      databaseName,
      version: version || '17.0',
      adminUsername,
      adminPassword,
      subscriptionTier,
      region,
      odooComAccountId,
      odooComSubdomain,
    }

    const instance = await instanceService.createInstance(companyId, config, user.id)

    return NextResponse.json({ instance }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error creating instance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create instance' },
      { status: 500 }
    )
  }
}
