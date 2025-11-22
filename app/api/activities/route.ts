import { NextRequest, NextResponse } from 'next/server'
import { ActivityLogService } from '@/lib/services/activity-log-service'

/**
 * GET /api/activities
 * Get activities with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const companyId = searchParams.get('companyId') || undefined

    const result = await ActivityLogService.getActivities({
      entityType,
      startDate,
      endDate,
      companyId,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/activities
 * Log a new activity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, entityType, description, entityId, ...metadata } = body

    // Validate required fields
    if (!action || !entityType || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: action, entityType, description' },
        { status: 400 }
      )
    }

    const result = await ActivityLogService.logActivity(action, entityType, description, {
      entityId,
      ...metadata,
    })

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

