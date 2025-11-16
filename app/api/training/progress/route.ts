import { NextRequest, NextResponse } from 'next/server'
import { TrainingService } from '@/lib/services/training-service'

/**
 * GET /api/training/progress
 * Get user training progress
 */
export async function GET(request: NextRequest) {
  try {
    const result = await TrainingService.getUserProgress()

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
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
 * POST /api/training/progress
 * Update training progress
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { materialId, progress } = body

    if (!materialId) {
      return NextResponse.json({ error: 'Missing required field: materialId' }, { status: 400 })
    }

    if (!progress) {
      return NextResponse.json({ error: 'Missing required field: progress' }, { status: 400 })
    }

    const result = await TrainingService.updateProgress(materialId, progress)

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
