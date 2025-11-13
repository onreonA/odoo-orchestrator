import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarSyncService } from '@/lib/services/calendar-sync-service'

/**
 * POST /api/calendar/syncs/[id]/sync
 * Trigger a manual sync for a calendar connection
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check ownership
    const { data: sync } = await CalendarSyncService.getSyncById(id)
    if (!sync || sync.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get sync direction from body or use sync config
    const body = await request.json().catch(() => ({}))
    const direction = body.direction || sync.sync_direction

    let result

    if (direction === 'one_way_in') {
      result = await CalendarSyncService.syncFromExternal(id)
    } else if (direction === 'one_way_out') {
      result = await CalendarSyncService.syncToExternal(id)
    } else {
      // bidirectional
      result = await CalendarSyncService.syncBidirectional(id)
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Calendar Sync Trigger Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
