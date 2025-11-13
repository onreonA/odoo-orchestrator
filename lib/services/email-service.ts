import { createClient } from '@/lib/supabase/server'

export interface EmailAccount {
  id: string
  email_address: string
  display_name?: string
  provider?: string
  sync_enabled: boolean
  sync_frequency: number
  last_synced_at?: string
  last_sync_status?: string
  user_id: string
  company_id?: string
  created_at: string
  updated_at: string
}

export interface Email {
  id: string
  subject: string
  body_text?: string
  body_html?: string
  email_status: 'received' | 'sent' | 'draft' | 'archived' | 'deleted'
  email_priority: 'urgent' | 'high' | 'normal' | 'low'
  from_address: string
  from_name?: string
  to_addresses: string[]
  cc_addresses?: string[]
  bcc_addresses?: string[]
  reply_to?: string
  thread_id?: string
  in_reply_to?: string
  email_references?: string[]
  message_id?: string
  external_id?: string
  attachments?: Array<{ name: string; url: string; size: number; type: string }>
  ai_category?: string
  ai_sentiment?: string
  ai_summary?: string
  ai_priority_score?: number
  ai_suggested_action?: string
  ai_draft_response?: string
  auto_responded: boolean
  auto_response_sent_at?: string
  email_account_id: string
  company_id?: string
  project_id?: string
  read: boolean
  starred: boolean
  created_at: string
  updated_at: string
}

export interface CreateEmailAccountInput {
  email_address: string
  display_name?: string
  provider?: string
  imap_host?: string
  imap_port?: number
  imap_username?: string
  imap_password?: string
  imap_ssl?: boolean
  smtp_host?: string
  smtp_port?: number
  smtp_username?: string
  smtp_password?: string
  smtp_ssl?: boolean
  oauth_provider?: string
  oauth_access_token?: string
  oauth_refresh_token?: string
  sync_enabled?: boolean
  sync_frequency?: number
  company_id?: string
}

export interface CreateEmailInput {
  subject: string
  body_text?: string
  body_html?: string
  to_addresses: string[]
  cc_addresses?: string[]
  bcc_addresses?: string[]
  reply_to?: string
  in_reply_to?: string
  email_references?: string[]
  attachments?: Array<{ name: string; url: string; size: number; type: string }>
  email_account_id: string
  company_id?: string
  project_id?: string
}

export class EmailService {
  /**
   * Get all email accounts for a user
   */
  static async getEmailAccounts(
    userId: string,
    companyId?: string
  ): Promise<{
    data: EmailAccount[] | null
    error: any
  }> {
    const supabase = await createClient()
    let query = supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    return await query
  }

  /**
   * Get a single email account by ID
   */
  static async getEmailAccountById(id: string): Promise<{ data: EmailAccount | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('email_accounts').select('*').eq('id', id).single()

    return { data, error }
  }

  /**
   * Create a new email account
   */
  static async createEmailAccount(
    input: CreateEmailAccountInput,
    userId: string
  ): Promise<{ data: EmailAccount | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('email_accounts')
      .insert({
        ...input,
        user_id: userId,
        sync_enabled: input.sync_enabled ?? true,
        sync_frequency: input.sync_frequency ?? 5,
      })
      .select()
      .single()

    return { data, error }
  }

  /**
   * Update email account
   */
  static async updateEmailAccount(
    id: string,
    input: Partial<CreateEmailAccountInput>
  ): Promise<{ data: EmailAccount | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('email_accounts')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Delete email account
   */
  static async deleteEmailAccount(id: string): Promise<{ error: any }> {
    const supabase = await createClient()
    const { error } = await supabase.from('email_accounts').delete().eq('id', id)

    return { error }
  }

  /**
   * Get emails for a user
   */
  static async getEmails(options?: {
    userId?: string
    emailAccountId?: string
    companyId?: string
    projectId?: string
    status?: Email['email_status']
    priority?: Email['email_priority']
    read?: boolean
    starred?: boolean
    threadId?: string
    limit?: number
    offset?: number
  }): Promise<{ data: Email[] | null; error: any }> {
    const supabase = await createClient()

    // Get current user if not provided
    let userId = options?.userId
    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id
    }

    if (!userId) {
      return { data: null, error: 'User not authenticated' }
    }

    let query = supabase
      .from('emails')
      .select(
        `
        *,
        email_accounts!inner(user_id)
      `
      )
      .eq('email_accounts.user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.emailAccountId) {
      query = query.eq('email_account_id', options.emailAccountId)
    }

    if (options?.companyId) {
      query = query.eq('company_id', options.companyId)
    }

    if (options?.projectId) {
      query = query.eq('project_id', options.projectId)
    }

    if (options?.status) {
      query = query.eq('email_status', options.status)
    }

    if (options?.priority) {
      query = query.eq('email_priority', options.priority)
    }

    if (options?.read !== undefined) {
      query = query.eq('read', options.read)
    }

    if (options?.starred !== undefined) {
      query = query.eq('starred', options.starred)
    }

    if (options?.threadId) {
      query = query.eq('thread_id', options.threadId)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    return await query
  }

  /**
   * Get a single email by ID
   */
  static async getEmailById(id: string): Promise<{ data: Email | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('emails').select('*').eq('id', id).single()

    return { data, error }
  }

  /**
   * Create a new email (draft or sent)
   */
  static async createEmail(
    input: CreateEmailInput,
    userId: string
  ): Promise<{ data: Email | null; error: any }> {
    const supabase = await createClient()

    // Get email account to verify ownership and get email address
    const { data: account } = await supabase
      .from('email_accounts')
      .select('user_id, email_address')
      .eq('id', input.email_account_id)
      .single()

    if (!account || account.user_id !== userId) {
      return { data: null, error: 'Email account not found or access denied' }
    }

    const { data, error } = await supabase
      .from('emails')
      .insert({
        ...input,
        from_address: account.email_address,
        email_status: 'draft',
        read: false,
        starred: false,
      })
      .select()
      .single()

    return { data, error }
  }

  /**
   * Update email
   */
  static async updateEmail(
    id: string,
    input: Partial<
      CreateEmailInput & { read?: boolean; starred?: boolean; email_status?: Email['email_status'] }
    >
  ): Promise<{ data: Email | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('emails')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Delete email
   */
  static async deleteEmail(id: string): Promise<{ error: any }> {
    const supabase = await createClient()
    const { error } = await supabase.from('emails').delete().eq('id', id)

    return { error }
  }

  /**
   * Mark email as read/unread
   */
  static async markAsRead(
    id: string,
    read: boolean = true
  ): Promise<{ data: Email | null; error: any }> {
    return this.updateEmail(id, { read })
  }

  /**
   * Star/unstar email
   */
  static async starEmail(
    id: string,
    starred: boolean = true
  ): Promise<{ data: Email | null; error: any }> {
    return this.updateEmail(id, { starred })
  }
}
