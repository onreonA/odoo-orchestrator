import { createClient } from '@/lib/supabase/server'

export class WebhookService {
  static async deleteWebhook(webhookId: string): Promise<{ error?: { message: string } }> {
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('webhooks').delete().eq('id', webhookId)

      if (error) {
        return { error: { message: error.message } }
      }

      return {}
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to delete webhook' } }
    }
  }
}



