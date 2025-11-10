/**
 * User Permissions API
 * 
 * Client Component'ler için kullanıcı izinlerini getir
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserPermissions, getUserRole } from '@/lib/utils/permissions'

/**
 * GET /api/user/permissions
 * Kullanıcının izinlerini ve rolünü getir
 */
export async function GET(request: NextRequest) {
  try {
    const role = await getUserRole()
    const permissions = await getUserPermissions()

    if (!role || !permissions) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        role,
        permissions,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

