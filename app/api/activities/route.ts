/**
 * Activities API
 * 
 * Aktivite kayıtları endpoint'leri
 */

import { NextRequest, NextResponse } from 'next/server'
import { ActivityLogService } from '@/lib/services/activity-log-service'

/**
 * GET /api/activities
 * Aktivite kayıtlarını listele
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      companyId: searchParams.get('companyId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      userId: searchParams.get('userId') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      action: searchParams.get('action') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    }

    const { data, error } = await ActivityLogService.getActivities(filters)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/activities
 * Yeni aktivite kaydı oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, entityType, description, entityId, companyId, projectId, metadata } = body

    if (!action || !entityType || !description) {
      return NextResponse.json({ error: 'action, entityType, and description are required' }, { status: 400 })
    }

    const { data, error } = await ActivityLogService.logActivity(action, entityType, description, {
      entityId,
      companyId,
      projectId,
      metadata,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

