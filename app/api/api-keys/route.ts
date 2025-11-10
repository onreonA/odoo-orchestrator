/**
 * API Keys Management API
 * 
 * API key yönetimi endpoint'leri
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiKeyService } from '@/lib/services/api-key-service'

/**
 * GET /api/api-keys
 * List API keys
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const options = {
      companyId: searchParams.get('companyId') || undefined,
      userId: searchParams.get('userId') || undefined,
    }

    const { data, error } = await ApiKeyService.getApiKeys(options)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Don't expose key_hash, only show prefix
    const safeData = data?.map((key) => ({
      ...key,
      key_hash: undefined, // Remove hash from response
    }))

    return NextResponse.json({ success: true, data: safeData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/api-keys
 * Create new API key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, scopes, rateLimitPerMinute, rateLimitPerHour, rateLimitPerDay, expiresAt, companyId } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await ApiKeyService.createApiKey(name, {
      companyId,
      scopes,
      rateLimitPerMinute,
      rateLimitPerHour,
      rateLimitPerDay,
      expiresAt,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Return key only once (for security)
    return NextResponse.json(
      {
        success: true,
        data: {
          key: data?.key, // Full key shown only once
          apiKey: {
            ...data?.apiKey,
            key_hash: undefined, // Don't expose hash
          },
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

