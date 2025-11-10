/**
 * Webhook Service
 * 
 * Webhook yönetimi ve delivery
 * Sprint 5
 */

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export interface Webhook {
  id: string
  name: string
  url: string
  secret: string
  user_id: string
  company_id?: string
  events: string[]
  status: 'active' | 'inactive' | 'failed'
  max_retries: number
  retry_delay_seconds: number
  success_count: number
  failure_count: number
  last_triggered_at?: string
  last_success_at?: string
  last_failure_at?: string
  last_error?: string
  created_at: string
  updated_at: string
}

export class WebhookService {
  /**
   * Generate webhook secret
   */
  static generateSecret(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Create webhook signature
   */
  static createSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createSignature(payload, secret)
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  }

  /**
   * Create webhook
   */
  static async createWebhook(
    name: string,
    url: string,
    events: string[],
    options?: {
      companyId?: string
      maxRetries?: number
      retryDelaySeconds?: number
    }
  ): Promise<{ data: Webhook | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get company_id if not provided
    let companyId = options?.companyId
    if (!companyId) {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      companyId = profile?.company_id || undefined
    }

    const secret = this.generateSecret()

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        name,
        url,
        secret,
        user_id: user.id,
        company_id: companyId || null,
        events,
        max_retries: options?.maxRetries || 3,
        retry_delay_seconds: options?.retryDelaySeconds || 60,
      })
      .select()
      .single()

    return { data, error }
  }

  /**
   * Get webhooks
   */
  static async getWebhooks(options?: {
    companyId?: string
    userId?: string
  }): Promise<{ data: Webhook[] | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    let query = supabase.from('webhooks').select('*').order('created_at', { ascending: false })

    if (options?.companyId) {
      query = query.eq('company_id', options.companyId)
    } else if (options?.userId) {
      query = query.eq('user_id', options.userId)
    } else {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    return { data, error }
  }

  /**
   * Trigger webhook
   */
  static async triggerWebhook(
    webhookId: string,
    eventType: string,
    eventData: any
  ): Promise<{ success: boolean; error?: any }> {
    const supabase = await createClient()

    // Get webhook
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single()

    if (webhookError || !webhook) {
      return { success: false, error: { message: 'Webhook not found' } }
    }

    if (webhook.status !== 'active') {
      return { success: false, error: { message: 'Webhook is not active' } }
    }

    if (!webhook.events.includes(eventType)) {
      return { success: false, error: { message: 'Event type not subscribed' } }
    }

    // Create delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhookId,
        event_type: eventType,
        event_data: eventData,
        status: 'pending',
        attempt_number: 1,
      })
      .select()
      .single()

    if (deliveryError) {
      return { success: false, error: deliveryError }
    }

    // Send webhook (async)
    this.sendWebhookDelivery(webhook, delivery.id, eventType, eventData).catch((error) => {
      console.error('Webhook delivery error:', error)
    })

    return { success: true }
  }

  /**
   * Send webhook delivery
   */
  private static async sendWebhookDelivery(
    webhook: Webhook,
    deliveryId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    const supabase = await createClient()

    const payload = JSON.stringify({
      event: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
    })

    const signature = this.createSignature(payload, webhook.secret)

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
        },
        body: payload,
      })

      if (response.ok) {
        // Success
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'success',
            status_code: response.status,
            delivered_at: new Date().toISOString(),
          })
          .eq('id', deliveryId)
      } else {
        // Failed - retry if possible
        const { data: delivery } = await supabase
          .from('webhook_deliveries')
          .select('attempt_number')
          .eq('id', deliveryId)
          .single()

        const attemptNumber = (delivery?.attempt_number || 0) + 1

        if (attemptNumber <= webhook.max_retries) {
          // Schedule retry
          const nextRetryAt = new Date()
          nextRetryAt.setSeconds(nextRetryAt.getSeconds() + webhook.retry_delay_seconds)

          await supabase
            .from('webhook_deliveries')
            .update({
              status: 'retrying',
              status_code: response.status,
              attempt_number: attemptNumber,
              next_retry_at: nextRetryAt.toISOString(),
            })
            .eq('id', deliveryId)

          // Retry after delay
          setTimeout(() => {
            this.sendWebhookDelivery(webhook, deliveryId, eventType, eventData)
          }, webhook.retry_delay_seconds * 1000)
        } else {
          // Max retries reached
          await supabase
            .from('webhook_deliveries')
            .update({
              status: 'failed',
              status_code: response.status,
              response_body: await response.text(),
            })
            .eq('id', deliveryId)
        }
      }
    } catch (error: any) {
      // Network error - retry if possible
      const { data: delivery } = await supabase
        .from('webhook_deliveries')
        .select('attempt_number')
        .eq('id', deliveryId)
        .single()

      const attemptNumber = (delivery?.attempt_number || 0) + 1

      if (attemptNumber <= webhook.max_retries) {
        const nextRetryAt = new Date()
        nextRetryAt.setSeconds(nextRetryAt.getSeconds() + webhook.retry_delay_seconds)

        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'retrying',
            attempt_number: attemptNumber,
            next_retry_at: nextRetryAt.toISOString(),
          })
          .eq('id', deliveryId)

        setTimeout(() => {
          this.sendWebhookDelivery(webhook, deliveryId, eventType, eventData)
        }, webhook.retry_delay_seconds * 1000)
      } else {
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'failed',
            response_body: error.message,
          })
          .eq('id', deliveryId)
      }
    }
  }

  /**
   * Delete webhook
   */
  static async deleteWebhook(webhookId: string): Promise<{ data: null; error: any }> {
    const supabase = await createClient()

    const { error } = await supabase.from('webhooks').delete().eq('id', webhookId)

    return { data: null, error }
  }
}

