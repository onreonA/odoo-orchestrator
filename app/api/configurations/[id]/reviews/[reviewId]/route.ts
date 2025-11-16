import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfigurationReviewService } from '@/lib/services/configuration-review-service'

/**
 * PUT /api/configurations/[id]/reviews/[reviewId]
 * Update a review (approve/reject/needs_changes)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, reviewId } = await params
    const body = await request.json()
    const { status, comments, suggestedChanges } = body

    if (!status || !['approved', 'rejected', 'needs_changes'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved, rejected, or needs_changes' },
        { status: 400 }
      )
    }

    const reviewService = getConfigurationReviewService()
    const review = await reviewService.reviewConfiguration(reviewId, {
      status,
      comments,
      suggestedChanges,
    })

    return NextResponse.json({ review })
  } catch (error: any) {
    console.error('[Configurations Review API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
