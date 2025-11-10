/**
 * Activity Stats API
 * 
 * Aktivite istatistikleri endpoint'i
 */

import { NextRequest, NextResponse } from 'next/server'
import { ActivityLogService } from '@/lib/services/activity-log-service'

/**
 * GET /api/activities/stats
 * Aktivite istatistiklerini getir
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId') || undefined

    const { data, error } = await ActivityLogService.getActivityStats(companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

