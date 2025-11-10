/**
 * Webhooks Management API
 * 
 * Webhook yönetimi endpoint'leri
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/services/webhook-service'

/**
 * GET /api/webhooks
 * List webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const options = {
      companyId: searchParams.get('companyId') || undefined,
      userId: searchParams.get('userId') || undefined,
    }

    const { data, error } = await WebhookService.getWebhooks(options)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Don't expose secret
    const safeData = data?.map((webhook) => ({
      ...webhook,
      secret: undefined, // Remove secret from response
    }))

    return NextResponse.json({ success: true, data: safeData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/webhooks
 * Create webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, events, maxRetries, retryDelaySeconds, companyId } = body

    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Name, URL, and events are required' }, { status: 400 })
    }

    const { data, error } = await WebhookService.createWebhook(name, url, events, {
      companyId,
      maxRetries,
      retryDelaySeconds,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Return webhook with secret only once
    return NextResponse.json(
      {
        success: true,
        data: {
          webhook: {
            ...data,
            secret: data?.secret, // Show secret only once
          },
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

