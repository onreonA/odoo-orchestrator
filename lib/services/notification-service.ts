import { createClient } from '@/lib/supabase/server'

export interface NotificationInput {
  userId: string
  title: string
  message: string
  notificationType: string
  data?: Record<string, any>
}

export class NotificationService {
  private supabase: any

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Send a notification to a user
   */
  async sendNotification(input: NotificationInput): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase.from('notifications').insert({
      user_id: input.userId,
      title: input.title,
      message: input.message,
      notification_type: input.notificationType,
      data: input.data || {},
      is_read: false,
    })

    if (error) {
      throw new Error(`Failed to send notification: ${error.message}`)
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit: number = 50) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get notifications: ${error.message}`)
    }

    return data || []
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`)
    }

    return count || 0
  }
}

let notificationServiceInstance: NotificationService | null = null

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService()
  }
  return notificationServiceInstance
}
