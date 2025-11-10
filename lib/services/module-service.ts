/**
 * Module Service
 * 
 * Plugin/modül sistemi için servis
 * Sprint 5
 */

import { createClient } from '@/lib/supabase/server'

export interface Module {
  id: string
  name: string
  slug: string
  description?: string
  long_description?: string
  icon_url?: string
  banner_url?: string
  version: string
  author?: string
  author_url?: string
  homepage_url?: string
  repository_url?: string
  license: string
  type: 'core' | 'optional' | 'custom'
  category: 'productivity' | 'analytics' | 'integration' | 'personal' | 'business' | 'custom'
  tags: string[]
  dependencies: string[]
  conflicts_with: string[]
  min_platform_version?: string
  required_permissions: string[]
  has_settings: boolean
  settings_schema?: any
  is_official: boolean
  is_featured: boolean
  is_premium: boolean
  install_count: number
  rating: number
  review_count: number
  entry_point?: string
  files?: any
  created_at: string
  updated_at: string
  published_at?: string
  deprecated_at?: string
}

export interface ModuleInstance {
  id: string
  module_id: string
  company_id?: string
  user_id?: string
  status: 'available' | 'installed' | 'active' | 'inactive' | 'error'
  version: string
  settings: any
  installed_at: string
  activated_at?: string
  deactivated_at?: string
  last_error?: string
  last_error_at?: string
}

export interface ModuleSettings {
  id: string
  instance_id: string
  key: string
  value: any
  created_at: string
  updated_at: string
}

export class ModuleService {
  /**
   * Tüm mevcut modülleri listele
   */
  static async getModules(filters?: {
    type?: 'core' | 'optional' | 'custom'
    category?: string
    search?: string
    featured?: boolean
  }): Promise<{ data: Module[] | null; error: any }> {
    const supabase = await createClient()

    let query = supabase.from('modules').select('*').order('is_featured', { ascending: false }).order('install_count', { ascending: false })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.featured) {
      query = query.eq('is_featured', true)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`)
    }

    const { data, error } = await query

    return { data, error }
  }

  /**
   * Tek bir modülü getir
   */
  static async getModule(slug: string): Promise<{ data: Module | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('modules').select('*').eq('slug', slug).single()

    return { data, error }
  }

  /**
   * Kullanıcının/firmanın yüklü modüllerini getir
   */
  static async getInstalledModules(options?: {
    companyId?: string
    userId?: string
    status?: 'installed' | 'active' | 'inactive'
  }): Promise<{ data: ModuleInstance[] | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get user's company_id if not provided
    let companyId = options?.companyId
    if (!companyId) {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      companyId = profile?.company_id || undefined
    }

    let query = supabase
      .from('module_instances')
      .select('*, modules(*)')
      .order('installed_at', { ascending: false })

    if (options?.companyId || companyId) {
      query = query.eq('company_id', options?.companyId || companyId)
    } else if (options?.userId) {
      query = query.eq('user_id', options.userId)
    } else {
      query = query.eq('user_id', user.id)
    }

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    const { data, error } = await query

    return { data, error }
  }

  /**
   * Modül yükle (install)
   */
  static async installModule(
    moduleId: string,
    options?: {
      companyId?: string
      userId?: string
      settings?: any
    }
  ): Promise<{ data: ModuleInstance | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get module info
    const { data: module, error: moduleError } = await supabase.from('modules').select('*').eq('id', moduleId).single()

    if (moduleError || !module) {
      return { data: null, error: { message: 'Module not found' } }
    }

    // Check dependencies
    if (module.dependencies && module.dependencies.length > 0) {
      const { data: installedModules } = await this.getInstalledModules({
        companyId: options?.companyId,
        userId: options?.userId,
      })

      const installedSlugs = installedModules?.map((inst: any) => inst.modules?.slug) || []
      const missingDeps = module.dependencies.filter((dep: string) => !installedSlugs.includes(dep))

      if (missingDeps.length > 0) {
        return { data: null, error: { message: `Missing dependencies: ${missingDeps.join(', ')}` } }
      }
    }

    // Get company_id if not provided
    let companyId = options?.companyId
    if (!companyId && !options?.userId) {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      companyId = profile?.company_id || undefined
    }

    // Create instance
    const { data: instance, error } = await supabase
      .from('module_instances')
      .insert({
        module_id: moduleId,
        company_id: companyId || null,
        user_id: options?.userId || (companyId ? null : user.id),
        version: module.version,
        status: 'installed',
        settings: options?.settings || {},
      })
      .select()
      .single()

    return { data: instance, error }
  }

  /**
   * Modülü aktifleştir (activate)
   */
  static async activateModule(instanceId: string): Promise<{ data: ModuleInstance | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get instance
    const { data: instance, error: instanceError } = await supabase
      .from('module_instances')
      .select('*, modules(*)')
      .eq('id', instanceId)
      .single()

    if (instanceError || !instance) {
      return { data: null, error: { message: 'Instance not found' } }
    }

    // Check conflicts
    const module = instance.modules as any
    if (module.conflicts_with && module.conflicts_with.length > 0) {
      const { data: activeModules } = await this.getInstalledModules({
        companyId: instance.company_id,
        userId: instance.user_id,
        status: 'active',
      })

      const activeSlugs = activeModules?.map((inst: any) => inst.modules?.slug) || []
      const conflicts = module.conflicts_with.filter((conflict: string) => activeSlugs.includes(conflict))

      if (conflicts.length > 0) {
        return { data: null, error: { message: `Conflicts with active modules: ${conflicts.join(', ')}` } }
      }
    }

    // Activate
    const { data: updated, error } = await supabase
      .from('module_instances')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        last_error: null,
        last_error_at: null,
      })
      .eq('id', instanceId)
      .select()
      .single()

    return { data: updated, error }
  }

  /**
   * Modülü deaktifleştir (deactivate)
   */
  static async deactivateModule(instanceId: string): Promise<{ data: ModuleInstance | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    const { data: updated, error } = await supabase
      .from('module_instances')
      .update({
        status: 'inactive',
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', instanceId)
      .select()
      .single()

    return { data: updated, error }
  }

  /**
   * Modülü kaldır (uninstall)
   */
  static async uninstallModule(instanceId: string): Promise<{ data: null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    const { error } = await supabase.from('module_instances').delete().eq('id', instanceId)

    return { data: null, error }
  }

  /**
   * Modül ayarlarını güncelle
   */
  static async updateModuleSettings(
    instanceId: string,
    settings: Record<string, any>
  ): Promise<{ data: ModuleInstance | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get current settings
    const { data: instance } = await supabase.from('module_instances').select('settings').eq('id', instanceId).single()

    if (!instance) {
      return { data: null, error: { message: 'Instance not found' } }
    }

    // Merge settings
    const updatedSettings = {
      ...(instance.settings || {}),
      ...settings,
    }

    const { data: updated, error } = await supabase
      .from('module_instances')
      .update({ settings: updatedSettings })
      .eq('id', instanceId)
      .select()
      .single()

    return { data: updated, error }
  }

  /**
   * Modül istatistiklerini getir
   */
  static async getModuleStats(): Promise<{ data: any | null; error: any }> {
    const supabase = await createClient()

    const { data: modules } = await supabase.from('modules').select('id, install_count, rating')
    const { data: instances } = await supabase.from('module_instances').select('status')

    const totalModules = modules?.length || 0
    const totalInstalls = modules?.reduce((sum, m) => sum + (m.install_count || 0), 0) || 0
    const activeInstances = instances?.filter((i) => i.status === 'active').length || 0
    const averageRating =
      modules && modules.length > 0
        ? modules.reduce((sum, m) => sum + (m.rating || 0), 0) / modules.length
        : 0

    return {
      data: {
        totalModules,
        totalInstalls,
        activeInstances,
        averageRating: Math.round(averageRating * 100) / 100,
      },
      error: null,
    }
  }
}

