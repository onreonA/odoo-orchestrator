/**
 * Installed Modules API
 * 
 * Yüklü modüller endpoint'leri
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { ModuleService } from '@/lib/services/module-service'

/**
 * GET /api/modules/installed
 * Yüklü modülleri listele
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const options = {
      companyId: searchParams.get('companyId') || undefined,
      userId: searchParams.get('userId') || undefined,
      status: searchParams.get('status') as 'installed' | 'active' | 'inactive' | undefined,
    }

    const { data, error } = await ModuleService.getInstalledModules(options)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

