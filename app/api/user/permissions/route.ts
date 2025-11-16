import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/user/permissions
 * Get current user's permissions and role
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Profile not found',
          data: {
            role: 'user',
            company_id: null,
            permissions: {
              canAccessAdminPanel: false,
              canManageCompanies: false,
              canManageProjects: false,
            },
          },
        },
        { status: 200 }
      )
    }

    const role = profile.role || 'user'
    const isSuperAdmin = role === 'super_admin'
    const isAdmin = role === 'admin' || isSuperAdmin

    const permissions = {
      canAccessAdminPanel: isAdmin,
      canManageCompanies: isAdmin,
      canManageProjects: isAdmin,
    }

    return NextResponse.json({
      success: true,
      data: {
        role,
        company_id: profile.company_id || null,
        permissions,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
