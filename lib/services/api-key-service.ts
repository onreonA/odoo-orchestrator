/**
 * API Key Service
 * 
 * API key yönetimi ve authentication
 * Sprint 5
 */

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export interface ApiKey {
  id: string
  name: string
  key_prefix: string
  user_id: string
  company_id?: string
  status: 'active' | 'inactive' | 'revoked'
  scopes: string[]
  rate_limit_per_minute: number
  rate_limit_per_hour: number
  rate_limit_per_day: number
  last_used_at?: string
  request_count: number
  created_at: string
  expires_at?: string
}

export class ApiKeyService {
  /**
   * Generate a new API key
   */
  static generateKey(): { key: string; hash: string; prefix: string } {
    // Generate random key
    const key = `sk_live_${crypto.randomBytes(32).toString('hex')}`
    const hash = crypto.createHash('sha256').update(key).digest('hex')
    const prefix = key.substring(0, 12) // First 12 chars for display

    return { key, hash, prefix }
  }

  /**
   * Create a new API key
   */
  static async createApiKey(
    name: string,
    options?: {
      companyId?: string
      scopes?: string[]
      rateLimitPerMinute?: number
      rateLimitPerHour?: number
      rateLimitPerDay?: number
      expiresAt?: string
    }
  ): Promise<{ data: { key: string; apiKey: ApiKey } | null; error: any }> {
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

    // Generate key
    const { key, hash, prefix } = this.generateKey()

    // Create API key record
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        name,
        key_hash: hash,
        key_prefix: prefix,
        user_id: user.id,
        company_id: companyId || null,
        scopes: options?.scopes || [],
        rate_limit_per_minute: options?.rateLimitPerMinute || 60,
        rate_limit_per_hour: options?.rateLimitPerHour || 1000,
        rate_limit_per_day: options?.rateLimitPerDay || 10000,
        expires_at: options?.expiresAt || null,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data: { key, apiKey }, error: null }
  }

  /**
   * Validate API key
   */
  static async validateApiKey(key: string): Promise<{ data: ApiKey | null; error: any }> {
    const supabase = await createClient()
    const hash = crypto.createHash('sha256').update(key).digest('hex')

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hash)
      .eq('status', 'active')
      .single()

    if (error || !apiKey) {
      return { data: null, error: { message: 'Invalid API key' } }
    }

    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return { data: null, error: { message: 'API key expired' } }
    }

    return { data: apiKey, error: null }
  }

  /**
   * Check rate limit
   */
  static async checkRateLimit(
    apiKeyId: string,
    timeWindow: 'minute' | 'hour' | 'day'
  ): Promise<{ allowed: boolean; error?: any }> {
    const supabase = await createClient()

    // Get API key
    const { data: apiKey } = await supabase.from('api_keys').select('*').eq('id', apiKeyId).single()

    if (!apiKey) {
      return { allowed: false, error: { message: 'API key not found' } }
    }

    // Get limit based on time window
    const limit =
      timeWindow === 'minute'
        ? apiKey.rate_limit_per_minute
        : timeWindow === 'hour'
          ? apiKey.rate_limit_per_hour
          : apiKey.rate_limit_per_day

    // Calculate time range
    const now = new Date()
    const startTime = new Date(now)
    if (timeWindow === 'minute') {
      startTime.setMinutes(startTime.getMinutes() - 1)
    } else if (timeWindow === 'hour') {
      startTime.setHours(startTime.getHours() - 1)
    } else {
      startTime.setDate(startTime.getDate() - 1)
    }

    // Count requests in time window
    const { count, error } = await supabase
      .from('api_requests')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('created_at', startTime.toISOString())

    if (error) {
      return { allowed: false, error }
    }

    const allowed = (count || 0) < limit

    return { allowed, error: allowed ? undefined : { message: 'Rate limit exceeded' } }
  }

  /**
   * Log API request
   */
  static async logRequest(
    apiKeyId: string,
    request: {
      method: string
      endpoint: string
      statusCode: number
      requestBody?: any
      responseBody?: any
      ipAddress?: string
      userAgent?: string
      responseTimeMs?: number
    }
  ): Promise<{ data: any | null; error: any }> {
    const supabase = await createClient()

    const { data, error } = await supabase.from('api_requests').insert({
      api_key_id: apiKeyId,
      method: request.method,
      endpoint: request.endpoint,
      status_code: request.statusCode,
      request_body: request.requestBody || null,
      response_body: request.responseBody || null,
      ip_address: request.ipAddress || null,
      user_agent: request.userAgent || null,
      response_time_ms: request.responseTimeMs || null,
    })

    return { data, error }
  }

  /**
   * Get API keys for user/company
   */
  static async getApiKeys(options?: {
    companyId?: string
    userId?: string
  }): Promise<{ data: ApiKey[] | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    let query = supabase.from('api_keys').select('*').order('created_at', { ascending: false })

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
   * Revoke API key
   */
  static async revokeApiKey(apiKeyId: string): Promise<{ data: ApiKey | null; error: any }> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('api_keys')
      .update({ status: 'revoked' })
      .eq('id', apiKeyId)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Delete API key
   */
  static async deleteApiKey(apiKeyId: string): Promise<{ data: null; error: any }> {
    const supabase = await createClient()

    const { error } = await supabase.from('api_keys').delete().eq('id', apiKeyId)

    return { data: null, error }
  }
}

