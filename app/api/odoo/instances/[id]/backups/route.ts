import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'

/**
 * GET /api/odoo/instances/[id]/backups
 * List backups for an instance
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instanceService = getOdooInstanceService()
    const backups = await instanceService.getBackups(id)

    return NextResponse.json({ backups })
  } catch (error: any) {
    console.error('[API] Error listing backups:', error)
    return NextResponse.json({ error: error.message || 'Failed to list backups' }, { status: 500 })
  }
}

/**
 * POST /api/odoo/instances/[id]/backups
 * Create a backup
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const backupType = body.type || 'manual'

    const instanceService = getOdooInstanceService()
    const backup = await instanceService.createBackup(id, backupType, user.id)

    return NextResponse.json({ backup }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error creating backup:', error)
    return NextResponse.json({ error: error.message || 'Failed to create backup' }, { status: 500 })
  }
}
