/**
 * Module Stats API
 * 
 * Modül istatistikleri endpoint'i
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { ModuleService } from '@/lib/services/module-service'

/**
 * GET /api/modules/stats
 * Modül istatistiklerini getir
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await ModuleService.getModuleStats()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

