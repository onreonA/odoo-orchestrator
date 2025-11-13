/**
 * Webhook Detail API
 *
 * Webhook detay ve yönetim endpoint'leri
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/services/webhook-service'

/**
 * DELETE /api/webhooks/[id]
 * Delete webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await WebhookService.deleteWebhook(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
