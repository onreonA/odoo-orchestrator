import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfigurationReviewService } from '@/lib/services/configuration-review-service'

/**
 * GET /api/reviews/pending
 * Get pending reviews for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviewService = getConfigurationReviewService()
    const reviews = await reviewService.getPendingReviews(user.id)

    return NextResponse.json({ reviews })
  } catch (error: any) {
    console.error('[Reviews Pending API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


