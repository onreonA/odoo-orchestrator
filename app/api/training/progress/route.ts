/**
 * Training Progress API
 * 
 * Eğitim ilerlemesi endpoint'leri
 */

import { NextRequest, NextResponse } from 'next/server'
import { TrainingService } from '@/lib/services/training-service'

/**
 * GET /api/training/progress
 * Kullanıcının eğitim ilerlemesini getir
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined

    const { data, error } = await TrainingService.getUserProgress(userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/training/progress
 * Eğitim ilerlemesini güncelle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { materialId, progress } = body

    if (!materialId) {
      return NextResponse.json({ error: 'materialId is required' }, { status: 400 })
    }

    const { data, error } = await TrainingService.updateProgress(materialId, progress)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

