import { NextRequest, NextResponse } from 'next/server'
import { ActivityLogService } from '@/lib/services/activity-log-service'

/**
 * GET /api/activities/stats
 * Get activity statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId') || undefined

    const result = await ActivityLogService.getActivityStats({ companyId })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



