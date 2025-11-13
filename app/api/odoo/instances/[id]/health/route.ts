import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'

/**
 * GET /api/odoo/instances/[id]/health
 * Check instance health
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
    const healthStatus = await instanceService.checkHealth(id)

    return NextResponse.json({ health: healthStatus })
  } catch (error: any) {
    console.error('[API] Error checking health:', error)
    return NextResponse.json({ error: error.message || 'Failed to check health' }, { status: 500 })
  }
}
