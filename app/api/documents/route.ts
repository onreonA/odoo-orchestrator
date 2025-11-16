import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/services/document-service'

/**
 * GET /api/documents
 * Get documents with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined

    const result = await DocumentService.getDocuments({ category, search })

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
 * POST /api/documents
 * Create a new document
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, category, file_name, file_path, file_size } = body

    if (!title || !category || !file_name || !file_path) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category, file_name, file_path' },
        { status: 400 }
      )
    }

    const result = await DocumentService.createDocument({
      title,
      category,
      file_name,
      file_path,
      file_size,
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

