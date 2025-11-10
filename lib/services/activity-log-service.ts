/**
 * Activity Log Service
 * 
 * Aktivite kayıtları için servis
 */

import { createClient } from '@/lib/supabase/server'

export interface ActivityLog {
  id: string
  company_id?: string
  project_id?: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  description: string
  metadata?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface ActivityFilters {
  companyId?: string
  projectId?: string
  userId?: string
  entityType?: string
  action?: string
  startDate?: string
  endDate?: string
}

export class ActivityLogService {
  /**
   * Aktivite kaydı oluştur
   */
  static async logActivity(
    action: string,
    entityType: string,
    description: string,
    options?: {
      entityId?: string
      companyId?: string
      projectId?: string
      metadata?: any
    }
  ): Promise<{ data: ActivityLog | null; error: any }> {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Get user's company_id if not provided
      let companyId = options?.companyId
      if (!companyId && user) {
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        companyId = profile?.company_id || undefined
      }

      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          action,
          entity_type: entityType,
          entity_id: options?.entityId,
          description,
          company_id: companyId,
          project_id: options?.projectId,
          user_id: user?.id,
          metadata: options?.metadata || null,
        })
        .select()
        .single()

      return { data, error }
    } catch (error: any) {
      return { data: null, error: { message: error.message } }
    }
  }

  /**
   * Aktivite kayıtlarını listele
   */
  static async getActivities(filters?: ActivityFilters): Promise<{ data: ActivityLog[] | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get user's company_id and role
    const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()

    let query = supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100)

    // Filter by company (if not super admin)
    if (profile?.role !== 'super_admin') {
      if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id)
      } else {
        // User has no company, return empty
        return { data: [], error: null }
      }
    } else if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId)
    }

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    } else if (profile?.role === 'company_user' || profile?.role === 'company_viewer') {
      // Regular users can only see their own activities
      query = query.eq('user_id', user.id)
    }

    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType)
    }

    if (filters?.action) {
      query = query.eq('action', filters.action)
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    const { data, error } = await query

    return { data, error }
  }

  /**
   * Belirli bir entity için aktivite kayıtlarını getir
   */
  static async getActivitiesByEntity(
    entityType: string,
    entityId: string
  ): Promise<{ data: ActivityLog[] | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Aktivite istatistiklerini getir
   */
  static async getActivityStats(companyId?: string): Promise<{ data: any; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get user's company_id
    const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()

    let query = supabase.from('activity_logs').select('action, entity_type, created_at')

    if (profile?.role !== 'super_admin') {
      if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id)
      } else {
        return { data: null, error: { message: 'User company not found' } }
      }
    } else if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error }
    }

    // Calculate stats
    const last24Hours = new Date()
    last24Hours.setHours(last24Hours.getHours() - 24)

    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)

    const stats = {
      total: data?.length || 0,
      last24Hours: data?.filter((log) => new Date(log.created_at) >= last24Hours).length || 0,
      last7Days: data?.filter((log) => new Date(log.created_at) >= last7Days).length || 0,
      byAction: {} as Record<string, number>,
      byEntityType: {} as Record<string, number>,
    }

    data?.forEach((log) => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
      stats.byEntityType[log.entity_type] = (stats.byEntityType[log.entity_type] || 0) + 1
    })

    return { data: stats, error: null }
  }
}

