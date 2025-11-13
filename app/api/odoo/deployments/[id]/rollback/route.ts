import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTemplateDeploymentEngine } from '@/lib/services/template-deployment-engine'

/**
 * POST /api/odoo/deployments/[id]/rollback
 * Rollback a deployment
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const deploymentEngine = getTemplateDeploymentEngine()
    await deploymentEngine.rollbackDeployment(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error rolling back deployment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to rollback deployment' },
      { status: 500 }
    )
  }
}
