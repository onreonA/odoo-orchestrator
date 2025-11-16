/**
 * Cached Company Service
 *
 * Company service with caching for better performance
 * Sprint 5 - Performance Optimization
 */

import { createClient } from '@/lib/supabase/server'
import { cache, getCache, deleteCache, clearCache, cacheKeys } from '@/lib/utils/cache'

export class CachedCompanyService {
  /**
   * Get company with cache
   */
  static async getCompany(id: string): Promise<{ data: any | null; error: any }> {
    const cacheKey = cacheKeys.company(id)

    // Try cache first
    const cached = getCache(cacheKey)
    if (cached !== null && cached !== undefined) {
      return { data: cached as any[], error: null }
    }

    // Fetch from database
    const supabase = await createClient()
    const { data, error } = await supabase.from('companies').select('*').eq('id', id).single()

    if (error) {
      return { data: null, error }
    }

    // Cache for 5 minutes
    if (data) {
      cache(cacheKey, data, 300 * 1000)
    }

    return { data, error }
  }

  /**
   * Get company projects with cache
   */
  static async getCompanyProjects(companyId: string): Promise<{ data: any[] | null; error: any }> {
    const cacheKey = cacheKeys.companyProjects(companyId)

    // Try cache first
    const cached = getCache(cacheKey)
    if (cached !== null && cached !== undefined) {
      return { data: cached as any[], error: null }
    }

    // Fetch from database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })

    if (error) {
      return { data: null, error }
    }

    // Cache for 2 minutes
    if (data) {
      cache(cacheKey, data, 120 * 1000)
    }

    return { data, error }
  }

  /**
   * Invalidate company cache
   */
  static invalidateCompanyCache(companyId: string): void {
    deleteCache(cacheKeys.company(companyId))
    deleteCache(cacheKeys.companyProjects(companyId))
    deleteCache(cacheKeys.companyStats(companyId))
  }

  /**
   * Invalidate all company caches
   */
  static invalidateAllCompanyCaches(): void {
    clearCache()
  }
}
