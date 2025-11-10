/**
 * Training Materials API
 * 
 * Eğitim materyalleri endpoint'leri
 */

import { NextRequest, NextResponse } from 'next/server'
import { TrainingService } from '@/lib/services/training-service'

/**
 * GET /api/training/materials
 * Eğitim materyallerini listele
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      companyId: searchParams.get('companyId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      category: searchParams.get('category') || undefined,
      type: searchParams.get('type') || undefined,
      isRequired: searchParams.get('isRequired') === 'true' ? true : undefined,
    }

    const { data, error } = await TrainingService.getMaterials(filters)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/training/materials
 * Yeni eğitim materyali oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = await TrainingService.createMaterial(body)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

