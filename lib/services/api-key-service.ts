import { createClient } from '@/lib/supabase/server'

export class ApiKeyService {
  /**
   * Delete API key
   */
  static async deleteApiKey(keyId: string): Promise<{ error?: { message: string } }> {
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('api_keys').delete().eq('id', keyId)

      if (error) {
        return { error: { message: error.message } }
      }

      return {}
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to delete API key' } }
    }
  }

  /**
   * Revoke API key
   */
  static async revokeApiKey(keyId: string): Promise<{
    data?: any
    error?: { message: string }
  }> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', keyId)
        .select()
        .single()

      if (error) {
        return { error: { message: error.message } }
      }

      return { data }
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to revoke API key' } }
    }
  }

  /**
   * Validate API key
   */
  static async validateApiKey(apiKey: string): Promise<{
    data?: any
    error?: { message: string }
  }> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, user_id, revoked_at')
        .eq('key', apiKey)
        .single()

      if (error || !data) {
        return { error: { message: 'Invalid API key' } }
      }

      if (data.revoked_at) {
        return { error: { message: 'API key has been revoked' } }
      }

      return { data }
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to validate API key' } }
    }
  }

  /**
   * Check rate limit
   */
  static async checkRateLimit(
    apiKeyId: string,
    window: 'minute' | 'hour' | 'day'
  ): Promise<{ allowed: boolean; error?: { message: string } }> {
    // TODO: Implement rate limiting logic
    return { allowed: true }
  }

  /**
   * Log API request
   */
  static async logRequest(apiKeyId: string, logData: any): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.from('api_key_logs').insert({
        api_key_id: apiKeyId,
        ...logData,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      // Silently fail - logging is not critical
      console.error('Failed to log API request:', error)
    }
  }
}

