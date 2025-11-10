/**
 * Module Install API
 * 
 * Modül yükleme endpoint'i
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { ModuleService } from '@/lib/services/module-service'

/**
 * POST /api/modules/[id]/install
 * Modülü yükle
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { companyId, userId, settings } = body

    const { data, error } = await ModuleService.installModule(id, {
      companyId,
      userId,
      settings,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

