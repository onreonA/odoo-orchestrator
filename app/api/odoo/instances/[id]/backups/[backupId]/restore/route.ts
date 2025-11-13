import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'

/**
 * POST /api/odoo/instances/[id]/backups/[backupId]/restore
 * Restore a backup
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; backupId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id, backupId } = await params

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const instanceService = getOdooInstanceService()
    await instanceService.restoreBackup(id, backupId, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error restoring backup:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restore backup' },
      { status: 500 }
    )
  }
}
