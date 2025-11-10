/**
 * Training Stats API
 * 
 * Eğitim istatistikleri endpoint'i
 */

import { NextRequest, NextResponse } from 'next/server'
import { TrainingService } from '@/lib/services/training-service'

/**
 * GET /api/training/stats
 * Eğitim istatistiklerini getir
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined

    const { data, error } = await TrainingService.getTrainingStats(userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

