/**
 * API Key Detail API
 * 
 * API key detay ve yönetim endpoint'leri
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiKeyService } from '@/lib/services/api-key-service'

/**
 * DELETE /api/api-keys/[id]
 * Delete API key
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await ApiKeyService.deleteApiKey(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/api-keys/[id]/revoke
 * Revoke API key
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    if (url.pathname.endsWith('/revoke')) {
      const { data, error } = await ApiKeyService.revokeApiKey(id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

