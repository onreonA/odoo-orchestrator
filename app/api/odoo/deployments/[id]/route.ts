import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'

/**
 * GET /api/odoo/deployments/[id]
 * Get deployment status
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

    const monitoringService = getDeploymentMonitoringService()
    const status = await monitoringService.getDeploymentStatus(id)

    return NextResponse.json({ deployment: status })
  } catch (error: any) {
    console.error('[API] Error getting deployment status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get deployment status' },
      { status: 500 }
    )
  }
}
