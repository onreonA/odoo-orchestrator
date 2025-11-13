import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'

/**
 * GET /api/odoo/deployments/[id]/metrics
 * Get deployment metrics
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

    // Get error summary
    const errorSummary = await monitoringService.getErrorSummary(id)

    // Get deployment status
    const status = await monitoringService.getDeploymentStatus(id)

    return NextResponse.json({
      status,
      errorSummary,
    })
  } catch (error: any) {
    console.error('[API] Error getting deployment metrics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get deployment metrics' },
      { status: 500 }
    )
  }
}
