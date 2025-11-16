import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cached } from '@/lib/utils/cache'

/**
 * GET /api/templates
 * Get all templates
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

    // Use cache for templates list (templates don't change frequently)
    const templates = await cached(
      'templates:all',
      async () => {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          throw new Error(error.message)
        }

        return data || []
      },
      10 * 60 * 1000 // 10 minutes cache TTL
    )

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
