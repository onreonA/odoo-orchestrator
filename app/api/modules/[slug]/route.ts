/**
 * Module Detail API
 * 
 * Tek bir modülün detaylarını getir
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { ModuleService } from '@/lib/services/module-service'

/**
 * GET /api/modules/[slug]
 * Modül detaylarını getir
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const { data, error } = await ModuleService.getModule(slug)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

