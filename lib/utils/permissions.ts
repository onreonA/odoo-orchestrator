import { SupabaseClient } from '@supabase/supabase-js'

export interface RequireRoleResult {
  allowed: boolean
  userId?: string
  reason?: string
}

/**
 * Check if user has required role(s)
 * @param supabase Supabase client
 * @param allowedRoles Array of allowed roles
 * @returns Permission result with userId if allowed
 */
export async function requireRole(
  supabase: SupabaseClient,
  allowedRoles: string[]
): Promise<RequireRoleResult> {
  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { allowed: false, reason: 'Not authenticated' }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { allowed: false, reason: 'Profile not found' }
    }

    // Check if user has required role
    if (!allowedRoles.includes(profile.role)) {
      return {
        allowed: false,
        reason: `Required role: ${allowedRoles.join(' or ')}`,
      }
    }

    return { allowed: true, userId: user.id }
  } catch (error: any) {
    return { allowed: false, reason: error.message || 'Permission check failed' }
  }
}

export interface RequireCompanyAccessResult {
  allowed: boolean
  userId?: string
  companyId?: string
  reason?: string
}

/**
 * Check if user has access to a company
 */
export async function requireCompanyAccess(
  supabase: SupabaseClient,
  companyId?: string
): Promise<RequireCompanyAccessResult> {
  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { allowed: false, reason: 'Not authenticated' }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { allowed: false, reason: 'Profile not found' }
    }

    // Super admin can access all companies
    if (profile.role === 'super_admin') {
      return { allowed: true, userId: user.id, companyId: companyId || profile.company_id || undefined }
    }

    // If companyId is provided, check if user belongs to that company
    if (companyId) {
      if (profile.company_id !== companyId) {
        return { allowed: false, reason: 'Access denied to this company' }
      }
      return { allowed: true, userId: user.id, companyId }
    }

    // If no companyId provided, return user's company
    return { allowed: true, userId: user.id, companyId: profile.company_id || undefined }
  } catch (error: any) {
    return { allowed: false, reason: error.message || 'Permission check failed' }
  }
}

