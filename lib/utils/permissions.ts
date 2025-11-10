/**
 * Permission Helper Functions
 * 
 * API route'larında ve component'lerde kullanılacak helper fonksiyonlar
 */

import { createClient } from '@/lib/supabase/server'
import { PermissionsService, PermissionCheck } from '@/lib/services/permissions-service'

/**
 * API route'larında kullanım için: Kullanıcının izni var mı kontrol et
 */
export async function requirePermission(check: PermissionCheck): Promise<{ allowed: boolean; userId: string; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { allowed: false, userId: '', reason: 'Unauthorized' }
  }

  const result = await PermissionsService.checkPermission(user.id, check)
  return { ...result, userId: user.id }
}

/**
 * API route'larında kullanım için: Belirli bir rol gerektir
 */
export async function requireRole(
  allowedRoles: Array<'super_admin' | 'company_admin' | 'company_user' | 'company_viewer'>
): Promise<{ allowed: boolean; userId: string; role: string | null; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { allowed: false, userId: '', role: null, reason: 'Unauthorized' }
  }

  const role = await PermissionsService.getUserRole(user.id)

  if (!role) {
    return { allowed: false, userId: user.id, role: null, reason: 'User role not found' }
  }

  if (!allowedRoles.includes(role)) {
    return { allowed: false, userId: user.id, role, reason: `Role ${role} not allowed. Required: ${allowedRoles.join(', ')}` }
  }

  return { allowed: true, userId: user.id, role }
}

/**
 * API route'larında kullanım için: Company erişimi kontrol et
 */
export async function requireCompanyAccess(companyId: string): Promise<{ allowed: boolean; userId: string; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { allowed: false, userId: '', reason: 'Unauthorized' }
  }

  const canAccess = await PermissionsService.canAccessCompany(user.id, companyId)

  if (!canAccess) {
    return { allowed: false, userId: user.id, reason: 'Access denied to this company' }
  }

  return { allowed: true, userId: user.id }
}

/**
 * API route'larında kullanım için: Project erişimi kontrol et
 */
export async function requireProjectAccess(projectId: string): Promise<{ allowed: boolean; userId: string; reason?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { allowed: false, userId: '', reason: 'Unauthorized' }
  }

  const canAccess = await PermissionsService.canAccessProject(user.id, projectId)

  if (!canAccess) {
    return { allowed: false, userId: user.id, reason: 'Access denied to this project' }
  }

  return { allowed: true, userId: user.id }
}

/**
 * Component'lerde kullanım için: Kullanıcı izinlerini getir
 */
export async function getUserPermissions() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return await PermissionsService.getUserPermissions(user.id)
}

/**
 * Component'lerde kullanım için: Kullanıcı rolünü getir
 */
export async function getUserRole() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return await PermissionsService.getUserRole(user.id)
}

