import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cached, CacheKeys } from '@/lib/utils/cache'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: templateId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateRange = searchParams.get('range') || '30' // days

  // Cache key
  const cacheKey = CacheKeys.templateAnalytics(templateId, dateRange)

  // Use cache wrapper
  const result = await cached(
    cacheKey,
    async () => {
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      // Execute queries in parallel for better performance
      const [analyticsResult, deploymentsResult, feedbackResult] = await Promise.all([
        supabase
          .from('template_analytics')
          .select('*')
          .eq('template_id', templateId)
          .gte('date', startDate)
          .order('date', { ascending: false }),
        supabase
          .from('template_deployments')
          .select('status, created_at, duration_seconds')
          .eq('template_id', templateId),
        supabase
          .from('template_feedback')
          .select('rating, created_at')
          .eq('template_id', templateId),
      ])

      if (analyticsResult.error) {
        throw new Error(analyticsResult.error.message)
      }

      return {
        analytics: analyticsResult.data || [],
        deployments: deploymentsResult.data || [],
        feedback: feedbackResult.data || [],
      }
    },
    5 * 60 * 1000 // 5 minutes cache TTL
  )

  return NextResponse.json(result)
}
