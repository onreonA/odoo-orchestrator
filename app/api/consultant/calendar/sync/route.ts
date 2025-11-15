import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getConsultantCalendarSyncService } from '@/lib/services/consultant-calendar-sync-service'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { sync_type } = body // 'odoo', 'google', 'outlook', 'all'

  const syncService = getConsultantCalendarSyncService()

  try {
    let result

    switch (sync_type) {
      case 'odoo':
        result = await syncService.syncWithOdoo(user.id)
        break
      case 'google':
        result = await syncService.syncWithGoogle(user.id)
        break
      case 'outlook':
        result = await syncService.syncWithOutlook(user.id)
        break
      case 'all':
        result = await syncService.syncAll(user.id)
        break
      default:
        return NextResponse.json({ error: 'Invalid sync_type' }, { status: 400 })
    }

    return NextResponse.json({ result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const syncService = getConsultantCalendarSyncService()
  const status = await syncService.getSyncStatus(user.id)

  return NextResponse.json({ status })
}







