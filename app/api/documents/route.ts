/**
 * Documents API
 * 
 * Doküman yönetimi endpoint'leri
 */

import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/services/document-service'

/**
 * GET /api/documents
 * Dokümanları listele
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      companyId: searchParams.get('companyId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
    }

    const { data, error } = await DocumentService.getDocuments(filters)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/documents
 * Yeni doküman oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = await DocumentService.createDocument(body)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

