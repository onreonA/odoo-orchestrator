import { createClient } from '@/lib/supabase/server'

export interface MessageThread {
  id: string
  title?: string
  thread_type: 'direct' | 'group' | 'company' | 'project'
  company_id?: string
  project_id?: string
  participants: string[] // Array of profile IDs
  last_message_at?: string
  last_message_preview?: string
  unread_count: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  thread_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'file' | 'system' | 'ai_response'
  attachments?: Array<{ name: string; url: string; size: number; type: string }>
  ai_enhanced: boolean
  ai_summary?: string
  read_by: string[] // Array of profile IDs who read the message
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  notification_type: 'message' | 'mention' | 'system' | 'email' | 'calendar' | 'project'
  title: string
  message: string
  status?: 'read' | 'unread'
  related_id?: string // ID of related entity (message, email, event, etc.)
  related_type?: string // Type of related entity
  read: boolean
  action_url?: string
  created_at: string
}

export interface CreateThreadInput {
  title?: string
  thread_type: MessageThread['thread_type']
  company_id?: string
  project_id?: string
  participants: string[]
}

export interface CreateMessageInput {
  thread_id: string
  content: string
  message_type?: Message['message_type']
  attachments?: Array<{ name: string; url: string; size: number; type: string }>
}

export class MessagingService {
  /**
   * Get all threads for a user
   */
  static async getThreads(
    userId: string,
    options?: {
      companyId?: string
      projectId?: string
      threadType?: MessageThread['thread_type']
    }
  ): Promise<{ data: MessageThread[] | null; error: any }> {
    const supabase = await createClient()

    // Get threads where user is a participant
    let query = supabase
      .from('message_threads')
      .select('*')
      .contains('participants', [userId])
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (options?.companyId) {
      query = query.eq('company_id', options.companyId)
    }

    if (options?.projectId) {
      query = query.eq('project_id', options.projectId)
    }

    if (options?.threadType) {
      query = query.eq('thread_type', options.threadType)
    }

    return await query
  }

  /**
   * Get a single thread by ID
   */
  static async getThreadById(id: string): Promise<{ data: MessageThread | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('message_threads').select('*').eq('id', id).single()

    return { data, error }
  }

  /**
   * Create a new thread
   */
  static async createThread(
    input: CreateThreadInput,
    userId: string
  ): Promise<{ data: MessageThread | null; error: any }> {
    const supabase = await createClient()

    // Ensure creator is in participants
    const participants = input.participants.includes(userId)
      ? input.participants
      : [...input.participants, userId]

    const { data, error } = await supabase
      .from('message_threads')
      .insert({
        ...input,
        participants,
        created_by: userId,
      })
      .select()
      .single()

    return { data, error }
  }

  /**
   * Get messages for a thread
   */
  static async getMessages(
    threadId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ data: Message[] | null; error: any }> {
    const supabase = await createClient()
    let query = supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    return await query
  }

  /**
   * Create a new message
   */
  static async createMessage(
    input: CreateMessageInput,
    userId: string
  ): Promise<{ data: Message | null; error: any }> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...input,
        sender_id: userId,
        message_type: input.message_type || 'text',
        ai_enhanced: input.message_type === 'ai_response',
        read_by: [userId], // Sender has read their own message
      })
      .select()
      .single()

    if (!error && data) {
      // Update thread's last_message_at and last_message_preview
      await supabase
        .from('message_threads')
        .update({
          last_message_at: data.created_at,
          last_message_preview: data.content.substring(0, 100),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.thread_id)

      // Increment unread count for other participants
      const { data: thread } = await this.getThreadById(input.thread_id)
      if (thread) {
        const otherParticipants = thread.participants.filter(p => p !== userId)
        // Update unread count for thread (simple increment for now)
        // In production, you might want to track per-user unread counts
        if (otherParticipants.length > 0) {
          await supabase
            .from('message_threads')
            .update({
              unread_count: (thread.unread_count || 0) + 1,
            })
            .eq('id', input.thread_id)
        }
      }
    }

    return { data, error }
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(threadId: string, userId: string): Promise<{ error: any }> {
    const supabase = await createClient()

    // Mark all unread messages in thread as read
    const { data: messages } = await supabase
      .from('messages')
      .select('id, read_by')
      .eq('thread_id', threadId)
      .neq('sender_id', userId)

    if (messages) {
      for (const message of messages) {
        if (!message.read_by?.includes(userId)) {
          await supabase
            .from('messages')
            .update({
              read_by: [...(message.read_by || []), userId],
            })
            .eq('id', message.id)
        }
      }
    }

    // Reset thread unread count
    await supabase
      .from('message_threads')
      .update({
        unread_count: 0,
      })
      .eq('id', threadId)

    return { error: null }
  }

  /**
   * Get notifications for a user
   */
  static async getNotifications(
    userId: string,
    options?: { read?: boolean; limit?: number }
  ): Promise<{ data: Notification[] | null; error: any }> {
    const supabase = await createClient()
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Map status to read field
    if (options?.read !== undefined) {
      query = query.eq('read', options.read)
    } else {
      // Check status field if read field doesn't exist
      query = query.eq('status', 'unread')
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    // Map status to read if needed
    if (data) {
      data.forEach(notification => {
        if (notification.status && !('read' in notification)) {
          ;(notification as any).read = notification.status === 'read'
        }
      })
    }

    return { data, error }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(
    notificationId: string,
    userId: string
  ): Promise<{ error: any }> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId)

    return { error }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsAsRead(userId: string): Promise<{ error: any }> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .or('read.eq.false,status.eq.unread')

    return { error }
  }
}
