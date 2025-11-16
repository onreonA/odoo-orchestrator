import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfigurationReviewService } from '@/lib/services/configuration-review-service'

/**
 * GET /api/configurations/[id]/reviews
 * Get review history for a configuration
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

    const reviewService = getConfigurationReviewService()
    const reviewHistory = await reviewService.getReviewHistory(id)

    // Fetch reviewer details
    const reviewIds = reviewHistory.reviews.map((r: any) => r.reviewer_id).filter(Boolean)
    if (reviewIds.length > 0) {
      const { data: reviewers } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', reviewIds)

      const reviewersMap = new Map(reviewers?.map((r: any) => [r.id, r]) || [])
      reviewHistory.reviews = reviewHistory.reviews.map((review: any) => ({
        ...review,
        reviewer: reviewersMap.get(review.reviewer_id) || null,
      }))
    }

    return NextResponse.json({ reviewHistory })
  } catch (error: any) {
    console.error('[Configurations Reviews API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/configurations/[id]/reviews
 * Submit configuration for review
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
    const body = await request.json()
    let { reviewerIds } = body

    // If reviewerIds not provided, use current user as reviewer
    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      reviewerIds = [user.id]
    }

    const reviewService = getConfigurationReviewService()
    const reviews = await reviewService.submitForReview(id, reviewerIds)

    return NextResponse.json({ reviews }, { status: 201 })
  } catch (error: any) {
    console.error('[Configurations Reviews API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
