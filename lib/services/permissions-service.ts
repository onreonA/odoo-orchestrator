import { createClient } from '@/lib/supabase/server'

export interface Permissions {
  canViewAllCompanies: boolean
  canManageCompanies: boolean
  canManageUsers: boolean
  canManageProjects: boolean
  canViewProjects?: boolean
  canManageSupportTickets?: boolean
  canAccessAdminPanel: boolean
  canAccessCustomerPortal?: boolean
}

export interface PermissionCheck {
  resource: 'company' | 'project' | 'user' | 'support_ticket'
  action: 'view' | 'create' | 'update' | 'delete'
  resourceId?: string
}

export interface PermissionResult {
  allowed: boolean
  reason?: string
}

export class PermissionsService {
  /**
   * Get user role
   */
  static async getUserRole(userId: string): Promise<string | null> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single()

    if (error || !data) {
      return null
    }

    return data.role
  }

  /**
   * Get user company ID
   */
  static async getUserCompanyId(userId: string): Promise<string | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data.company_id
  }

  /**
   * Get permissions for a role
   */
  static getPermissionsForRole(role: string): Permissions {
    switch (role) {
      case 'super_admin':
        return {
          canViewAllCompanies: true,
          canManageCompanies: true,
          canManageUsers: true,
          canManageProjects: true,
          canAccessAdminPanel: true,
        }
      case 'company_admin':
        return {
          canViewAllCompanies: false,
          canManageCompanies: false, // Only own company
          canManageUsers: true,
          canManageProjects: true,
          canAccessAdminPanel: true,
        }
      case 'company_user':
        return {
          canViewAllCompanies: false,
          canManageCompanies: false,
          canManageUsers: false,
          canManageProjects: false,
          canViewProjects: true,
          canAccessAdminPanel: false,
          canAccessCustomerPortal: true,
        }
      case 'company_viewer':
        return {
          canViewAllCompanies: false,
          canManageCompanies: false,
          canManageUsers: false,
          canManageProjects: false,
          canViewProjects: true,
          canManageSupportTickets: false,
          canAccessAdminPanel: false,
          canAccessCustomerPortal: true,
        }
      default:
        return {
          canViewAllCompanies: false,
          canManageCompanies: false,
          canManageUsers: false,
          canManageProjects: false,
          canAccessAdminPanel: false,
        }
    }
  }

  /**
   * Check if user can access a company
   */
  static async canAccessCompany(userId: string, companyId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    if (!role) {
      return false
    }

    if (role === 'super_admin') {
      return true
    }

    const userCompanyId = await this.getUserCompanyId(userId)
    return userCompanyId === companyId
  }

  /**
   * Check if user can access a project
   */
  static async canAccessProject(userId: string, projectId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    if (!role) {
      return false
    }

    if (role === 'super_admin') {
      return true
    }

    const userCompanyId = await this.getUserCompanyId(userId)
    if (!userCompanyId) {
      return false
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('company_id')
      .eq('id', projectId)
      .single()

    if (error || !data) {
      return false
    }

    return data.company_id === userCompanyId
  }

  /**
   * Check permission for a resource and action
   */
  static async checkPermission(userId: string, check: PermissionCheck): Promise<PermissionResult> {
    const role = await this.getUserRole(userId)
    if (!role) {
      return { allowed: false, reason: 'User not found' }
    }

    const permissions = this.getPermissionsForRole(role)

    // Super admin can do everything
    if (role === 'super_admin') {
      return { allowed: true }
    }

    // Check resource-specific permissions
    switch (check.resource) {
      case 'company':
        if (check.action === 'view' || check.action === 'create') {
          // Company admin can view/create their own company
          if (check.resourceId) {
            const userCompanyId = await this.getUserCompanyId(userId)
            return {
              allowed: userCompanyId === check.resourceId,
              reason:
                userCompanyId !== check.resourceId ? 'Can only access own company' : undefined,
            }
          }
          return { allowed: permissions.canManageCompanies || false }
        }
        // Update/delete requires canManageCompanies
        if (check.resourceId) {
          const userCompanyId = await this.getUserCompanyId(userId)
          if (userCompanyId !== check.resourceId) {
            return { allowed: false, reason: 'Can only manage own company' }
          }
        }
        if (permissions.canManageCompanies) {
          return { allowed: true }
        }
        return { allowed: false, reason: 'Can only manage own company' }

      case 'project':
        if (check.action === 'view') {
          if (check.resourceId) {
            return {
              allowed: await this.canAccessProject(userId, check.resourceId),
              reason: 'Cannot access this project',
            }
          }
          return { allowed: permissions.canViewProjects || false }
        }
        // Create/update/delete requires canManageProjects
        if (permissions.canManageProjects) {
          if (check.resourceId) {
            return {
              allowed: await this.canAccessProject(userId, check.resourceId),
              reason: 'Cannot manage this project',
            }
          }
          return { allowed: true }
        }
        return { allowed: false, reason: 'Insufficient permissions to manage projects' }

      case 'user':
        return {
          allowed: permissions.canManageUsers || false,
          reason: permissions.canManageUsers
            ? undefined
            : 'Insufficient permissions to manage users',
        }

      case 'support_ticket':
        return {
          allowed: permissions.canManageSupportTickets || false,
          reason: permissions.canManageSupportTickets
            ? undefined
            : 'Insufficient permissions to manage support tickets',
        }

      default:
        return { allowed: false, reason: 'Unknown resource type' }
    }
  }
}
