/**
 * Permissions Service
 * 
 * Bu servis, rol bazlı erişim kontrolü ve izin yönetimi için kullanılır.
 */

import { createClient } from '@/lib/supabase/server'

export type UserRole = 'super_admin' | 'company_admin' | 'company_user' | 'company_viewer'

export interface UserPermissions {
  canViewAllCompanies: boolean
  canManageCompanies: boolean
  canManageUsers: boolean
  canManageProjects: boolean
  canViewProjects: boolean
  canManageSupportTickets: boolean
  canViewSupportTickets: boolean
  canManageTemplates: boolean
  canViewTemplates: boolean
  canManageDiscoveries: boolean
  canViewDiscoveries: boolean
  canAccessAdminPanel: boolean
  canAccessCustomerPortal: boolean
}

export interface PermissionCheck {
  resource: 'company' | 'project' | 'discovery' | 'ticket' | 'template' | 'user'
  action: 'view' | 'create' | 'update' | 'delete' | 'manage'
  resourceId?: string
}

export class PermissionsService {
  /**
   * Kullanıcının rolünü getir
   */
  static async getUserRole(userId: string): Promise<UserRole | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return data.role as UserRole
  }

  /**
   * Kullanıcının company_id'sini getir
   */
  static async getUserCompanyId(userId: string): Promise<string | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return data.company_id
  }

  /**
   * Kullanıcının izinlerini getir
   */
  static async getUserPermissions(userId: string): Promise<UserPermissions> {
    const role = await this.getUserRole(userId)

    if (!role) {
      // Varsayılan olarak hiçbir izin yok
      return this.getDefaultPermissions()
    }

    return this.getPermissionsForRole(role)
  }

  /**
   * Role göre izinleri getir
   */
  static getPermissionsForRole(role: UserRole): UserPermissions {
    switch (role) {
      case 'super_admin':
        return {
          canViewAllCompanies: true,
          canManageCompanies: true,
          canManageUsers: true,
          canManageProjects: true,
          canViewProjects: true,
          canManageSupportTickets: true,
          canViewSupportTickets: true,
          canManageTemplates: true,
          canViewTemplates: true,
          canManageDiscoveries: true,
          canViewDiscoveries: true,
          canAccessAdminPanel: true,
          canAccessCustomerPortal: true,
        }

      case 'company_admin':
        return {
          canViewAllCompanies: false,
          canManageCompanies: false, // Sadece kendi firmasını yönetebilir
          canManageUsers: true, // Kendi firmasının kullanıcılarını
          canManageProjects: true, // Kendi firmasının projelerini
          canViewProjects: true,
          canManageSupportTickets: true,
          canViewSupportTickets: true,
          canManageTemplates: false,
          canViewTemplates: true,
          canManageDiscoveries: true,
          canViewDiscoveries: true,
          canAccessAdminPanel: true,
          canAccessCustomerPortal: true,
        }

      case 'company_user':
        return {
          canViewAllCompanies: false,
          canManageCompanies: false,
          canManageUsers: false,
          canManageProjects: false,
          canViewProjects: true, // Sadece kendi firmasının projelerini
          canManageSupportTickets: true, // Kendi ticket'larını
          canViewSupportTickets: true,
          canManageTemplates: false,
          canViewTemplates: true,
          canManageDiscoveries: false,
          canViewDiscoveries: true, // Sadece kendi firmasının discovery'lerini
          canAccessAdminPanel: false,
          canAccessCustomerPortal: true,
        }

      case 'company_viewer':
        return {
          canViewAllCompanies: false,
          canManageCompanies: false,
          canManageUsers: false,
          canManageProjects: false,
          canViewProjects: true, // Sadece görüntüleme
          canManageSupportTickets: false,
          canViewSupportTickets: true, // Sadece görüntüleme
          canManageTemplates: false,
          canViewTemplates: true,
          canManageDiscoveries: false,
          canViewDiscoveries: true, // Sadece görüntüleme
          canAccessAdminPanel: false,
          canAccessCustomerPortal: true,
        }

      default:
        return this.getDefaultPermissions()
    }
  }

  /**
   * Varsayılan izinler (hiçbir izin yok)
   */
  private static getDefaultPermissions(): UserPermissions {
    return {
      canViewAllCompanies: false,
      canManageCompanies: false,
      canManageUsers: false,
      canManageProjects: false,
      canViewProjects: false,
      canManageSupportTickets: false,
      canViewSupportTickets: false,
      canManageTemplates: false,
      canViewTemplates: false,
      canManageDiscoveries: false,
      canViewDiscoveries: false,
      canAccessAdminPanel: false,
      canAccessCustomerPortal: false,
    }
  }

  /**
   * İzin kontrolü yap
   */
  static async checkPermission(
    userId: string,
    check: PermissionCheck
  ): Promise<{ allowed: boolean; reason?: string }> {
    const permissions = await this.getUserPermissions(userId)
    const role = await this.getUserRole(userId)

    if (!role) {
      return { allowed: false, reason: 'User role not found' }
    }

    // Super admin her şeyi yapabilir
    if (role === 'super_admin') {
      return { allowed: true }
    }

    // Resource ve action'a göre kontrol
    switch (check.resource) {
      case 'company':
        if (check.action === 'view' || check.action === 'create') {
          return { allowed: permissions.canViewProjects || permissions.canManageCompanies }
        }
        if (check.action === 'update' || check.action === 'delete' || check.action === 'manage') {
          // Kendi firmasını yönetebilir mi kontrol et
          if (check.resourceId) {
            const userCompanyId = await this.getUserCompanyId(userId)
            return {
              allowed: permissions.canManageCompanies && userCompanyId === check.resourceId,
              reason: userCompanyId !== check.resourceId ? 'Can only manage own company' : undefined,
            }
          }
          return { allowed: permissions.canManageCompanies }
        }
        break

      case 'project':
        if (check.action === 'view') {
          return { allowed: permissions.canViewProjects }
        }
        if (check.action === 'create' || check.action === 'update' || check.action === 'delete' || check.action === 'manage') {
          // Kendi firmasının projesini yönetebilir mi kontrol et
          if (check.resourceId) {
            const canManage = await this.canManageResource(userId, 'project', check.resourceId)
            return { allowed: permissions.canManageProjects && canManage }
          }
          return { allowed: permissions.canManageProjects }
        }
        break

      case 'discovery':
        if (check.action === 'view') {
          return { allowed: permissions.canViewDiscoveries }
        }
        if (check.action === 'create' || check.action === 'update' || check.action === 'delete' || check.action === 'manage') {
          if (check.resourceId) {
            const canManage = await this.canManageResource(userId, 'discovery', check.resourceId)
            return { allowed: permissions.canManageDiscoveries && canManage }
          }
          return { allowed: permissions.canManageDiscoveries }
        }
        break

      case 'ticket':
        if (check.action === 'view') {
          return { allowed: permissions.canViewSupportTickets }
        }
        if (check.action === 'create' || check.action === 'update' || check.action === 'delete' || check.action === 'manage') {
          if (check.resourceId) {
            const canManage = await this.canManageResource(userId, 'ticket', check.resourceId)
            return { allowed: permissions.canManageSupportTickets && canManage }
          }
          return { allowed: permissions.canManageSupportTickets }
        }
        break

      case 'user':
        if (check.action === 'view' || check.action === 'create' || check.action === 'update' || check.action === 'delete' || check.action === 'manage') {
          // Kendi firmasının kullanıcılarını yönetebilir mi kontrol et
          if (check.resourceId) {
            const canManage = await this.canManageResource(userId, 'user', check.resourceId)
            return { allowed: permissions.canManageUsers && canManage }
          }
          return { allowed: permissions.canManageUsers }
        }
        break

      case 'template':
        if (check.action === 'view') {
          return { allowed: permissions.canViewTemplates }
        }
        if (check.action === 'create' || check.action === 'update' || check.action === 'delete' || check.action === 'manage') {
          return { allowed: permissions.canManageTemplates }
        }
        break
    }

    return { allowed: false, reason: 'Permission denied' }
  }

  /**
   * Resource'u yönetebilir mi kontrol et (aynı company'de mi)
   */
  private static async canManageResource(
    userId: string,
    resourceType: 'project' | 'discovery' | 'ticket' | 'user',
    resourceId: string
  ): Promise<boolean> {
    const supabase = await createClient()
    const userCompanyId = await this.getUserCompanyId(userId)

    if (!userCompanyId) return false

    // Super admin her şeyi yönetebilir
    const role = await this.getUserRole(userId)
    if (role === 'super_admin') return true

    // Resource'un company_id'sini kontrol et
    let resourceCompanyId: string | null = null

    switch (resourceType) {
      case 'project':
        const { data: project } = await supabase.from('projects').select('company_id').eq('id', resourceId).single()
        resourceCompanyId = project?.company_id || null
        break

      case 'discovery':
        const { data: discovery } = await supabase.from('discoveries').select('company_id').eq('id', resourceId).single()
        resourceCompanyId = discovery?.company_id || null
        break

      case 'ticket':
        const { data: ticket } = await supabase.from('support_tickets').select('company_id').eq('id', resourceId).single()
        resourceCompanyId = ticket?.company_id || null
        break

      case 'user':
        const { data: user } = await supabase.from('profiles').select('company_id').eq('id', resourceId).single()
        resourceCompanyId = user?.company_id || null
        break
    }

    return resourceCompanyId === userCompanyId
  }

  /**
   * Kullanıcının belirli bir company'ye erişimi var mı kontrol et
   */
  static async canAccessCompany(userId: string, companyId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    const userCompanyId = await this.getUserCompanyId(userId)

    // Super admin her şeye erişebilir
    if (role === 'super_admin') return true

    // Kendi firmasına erişebilir
    return userCompanyId === companyId
  }

  /**
   * Kullanıcının belirli bir projeye erişimi var mı kontrol et
   */
  static async canAccessProject(userId: string, projectId: string): Promise<boolean> {
    const supabase = await createClient()
    const role = await this.getUserRole(userId)
    const userCompanyId = await this.getUserCompanyId(userId)

    // Super admin her şeye erişebilir
    if (role === 'super_admin') return true

    // Projenin company_id'sini kontrol et
    const { data: project } = await supabase.from('projects').select('company_id').eq('id', projectId).single()

    if (!project) return false

    return project.company_id === userCompanyId
  }
}

