import { createClient } from '@/lib/supabase/server'

interface ActivityLog {
  id: string
  action: string
  entity_type: string
  description: string
  user_id: string
  company_id: string
  entity_id?: string
  metadata?: Record<string, any>
  created_at: string
}

interface GetActivitiesOptions {
  entityType?: string
  startDate?: string
  endDate?: string
  companyId?: string
}

interface ActivityStats {
  total: number
  byAction: Record<string, number>
  byEntityType: Record<string, number>
  recent: ActivityLog[]
}

export class ActivityLogService {
  /**
   * Log an activity
   */
  static async logActivity(
    action: string,
    entityType: string,
    description: string,
    metadata?: { entityId?: string; [key: string]: any }
  ): Promise<{ data: ActivityLog | null; error: string | null }> {
    try {
      const supabase = await createClient()

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return { data: null, error: 'Unauthorized' }
      }

      // Get user profile to get company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return { data: null, error: 'User profile not found' }
      }

      // Insert activity log
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          action,
          entity_type: entityType,
          description,
          user_id: user.id,
          company_id: profile.company_id,
          entity_id: metadata?.entityId,
          metadata: metadata || {},
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as ActivityLog, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to log activity' }
    }
  }

  /**
   * Get activities with optional filters
   */
  static async getActivities(
    options?: GetActivitiesOptions
  ): Promise<{ data: ActivityLog[] | null; error: string | null }> {
    try {
      const supabase = await createClient()

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return { data: null, error: 'Unauthorized' }
      }

      // Get user profile to check role and company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return { data: null, error: 'User profile not found' }
      }

      // Build query
      let query = supabase.from('activity_logs').select('*')

      // Apply role-based filtering
      if (profile.role === 'company_user') {
        // Company users can only see their own activities
        query = query.eq('user_id', user.id)
      } else if (profile.role === 'company_admin') {
        // Company admins can see all activities in their company
        query = query.eq('company_id', profile.company_id)
      }
      // super_admin can see all activities (no filter)

      // Apply filters
      if (options?.entityType) {
        query = query.eq('entity_type', options.entityType)
      }

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate)
      }

      if (options?.endDate) {
        query = query.lte('created_at', options.endDate)
      }

      if (options?.companyId) {
        query = query.eq('company_id', options.companyId)
      }

      // Order and limit
      query = query.order('created_at', { ascending: false }).limit(100)

      const { data, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as ActivityLog[], error: null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get activities' }
    }
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(options?: {
    companyId?: string
  }): Promise<{ data: ActivityStats | null; error: string | null }> {
    try {
      const supabase = await createClient()

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return { data: null, error: 'Unauthorized' }
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return { data: null, error: 'User profile not found' }
      }

      // Build query
      let query = supabase.from('activity_logs').select('*')

      // Apply role-based filtering
      if (profile.role === 'company_admin' || profile.role === 'company_user') {
        query = query.eq('company_id', profile.company_id)
      }

      if (options?.companyId) {
        query = query.eq('company_id', options.companyId)
      }

      // Get last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query = query.gte('created_at', thirtyDaysAgo.toISOString())

      const { data, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      // Calculate statistics
      const activities = (data || []) as ActivityLog[]
      const stats: ActivityStats = {
        total: activities.length,
        byAction: {},
        byEntityType: {},
        recent: activities.slice(0, 10),
      }

      activities.forEach(activity => {
        stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1
        stats.byEntityType[activity.entity_type] =
          (stats.byEntityType[activity.entity_type] || 0) + 1
      })

      return { data: stats, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to get activity stats' }
    }
  }
}
