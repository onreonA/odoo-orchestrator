import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'

/**
 * GET /api/odoo/deployments/[id]/logs
 * Get deployment logs
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

    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') as 'debug' | 'info' | 'warning' | 'error' | undefined
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const since = searchParams.get('since') || undefined

    const monitoringService = getDeploymentMonitoringService()
    const logs = await monitoringService.getDeploymentLogs(id, {
      level,
      limit,
      offset,
      since,
    })

    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error('[API] Error getting deployment logs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get deployment logs' },
      { status: 500 }
    )
  }
}
