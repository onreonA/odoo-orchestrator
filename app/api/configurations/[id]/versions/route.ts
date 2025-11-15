import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/configurations/[id]/versions
 * Get version history for a configuration
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { data: versions, error } = await supabase
      .from('configuration_versions')
      .select('*, profiles(full_name, email)')
      .eq('configuration_id', id)
      .order('version_number', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ versions })
  } catch (error: any) {
    console.error('[Configurations Versions API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
