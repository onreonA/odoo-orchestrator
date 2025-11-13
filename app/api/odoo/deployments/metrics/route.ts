import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'

/**
 * GET /api/odoo/deployments/metrics
 * Get overall deployment metrics
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
    const templateType = searchParams.get('templateType')
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const monitoringService = getDeploymentMonitoringService()
    const metrics = await monitoringService.getDeploymentMetrics({
      instanceId: instanceId || undefined,
      templateType: templateType || undefined,
      startDate,
      endDate,
    })

    return NextResponse.json({ metrics })
  } catch (error: any) {
    console.error('[API] Error getting deployment metrics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get deployment metrics' },
      { status: 500 }
    )
  }
}
