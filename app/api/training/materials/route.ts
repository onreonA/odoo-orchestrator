import { NextRequest, NextResponse } from 'next/server'
import { TrainingService } from '@/lib/services/training-service'

/**
 * GET /api/training/materials
 * Get training materials
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || undefined

    const result = await TrainingService.getMaterials({ category })

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
 * POST /api/training/materials
 * Create training material
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, type, category, content_url } = body

    if (!title || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, type' },
        { status: 400 }
      )
    }

    const result = await TrainingService.createMaterial({
      title,
      description,
      type,
      category,
      content_url,
    })

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

