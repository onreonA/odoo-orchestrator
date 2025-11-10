/**
 * Modules API
 * 
 * Modül listesi ve yükleme endpoint'leri
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { ModuleService } from '@/lib/services/module-service'

/**
 * GET /api/modules
 * Tüm mevcut modülleri listele
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      type: searchParams.get('type') as 'core' | 'optional' | 'custom' | undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
    }

    const { data, error } = await ModuleService.getModules(filters)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

