import { createClient } from '@/lib/supabase/server'
import { getNotificationService } from './notification-service'

export interface Review {
  id: string
  configurationId: string
  reviewerId: string
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes'
  comments?: string
  suggestedChanges?: Record<string, any>
  reviewedAt?: string
  createdAt: string
}

export interface ReviewInput {
  configurationId: string
  reviewerIds: string[]
}

export interface ReviewUpdateInput {
  status: 'approved' | 'rejected' | 'needs_changes'
  comments?: string
  suggestedChanges?: Record<string, any>
}

export interface ReviewHistory {
  reviews: Review[]
  currentStatus: 'draft' | 'pending_review' | 'needs_changes' | 'approved' | 'rejected' | 'deployed'
  approvalCount: number
  rejectionCount: number
  needsChangesCount: number
}

class ConfigurationReviewService {
  private supabase: Awaited<ReturnType<typeof createClient>>

  constructor() {
    // Supabase client will be initialized lazily
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Submit configuration for review
   */
  async submitForReview(
    configurationId: string,
    reviewerIds: string[]
  ): Promise<Review[]> {
    const supabase = await this.getSupabase()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get configuration
    const { data: configuration, error: configError } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', configurationId)
      .single()

    if (configError || !configuration) {
      throw new Error(`Configuration not found: ${configError?.message}`)
    }

    // Check if configuration is in draft status
    if (configuration.status !== 'draft') {
      throw new Error(`Configuration is not in draft status. Current status: ${configuration.status}`)
    }

    // Create reviews for each reviewer
    const reviews: Review[] = []
    for (const reviewerId of reviewerIds) {
      const { data: review, error: reviewError } = await supabase
        .from('configuration_reviews')
        .insert({
          configuration_id: configurationId,
          reviewer_id: reviewerId,
          status: 'pending',
        })
        .select()
        .single()

      if (reviewError) {
        console.error(`Failed to create review for reviewer ${reviewerId}:`, reviewError)
        continue
      }

      reviews.push(review as Review)

      // Send notification to reviewer
      try {
        const notificationService = getNotificationService()
        await notificationService.sendNotification({
          userId: reviewerId,
          title: 'Yeni Konfigürasyon İncelemesi',
          message: `${configuration.name} konfigürasyonu sizin incelemenizi bekliyor.`,
          notificationType: 'approval_request',
          detailType: 'configuration_review',
          actionUrl: `/configurations/${configurationId}/review`,
          actionLabel: 'İncele',
        })
      } catch (error) {
        console.error('Failed to send notification:', error)
      }
    }

    // Update configuration status
    await supabase
      .from('configurations')
      .update({
        status: 'pending_review',
      })
      .eq('id', configurationId)

    return reviews
  }

  /**
   * Review configuration
   */
  async reviewConfiguration(
    reviewId: string,
    input: ReviewUpdateInput
  ): Promise<Review> {
    const supabase = await this.getSupabase()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get review
    const { data: review, error: reviewError } = await supabase
      .from('configuration_reviews')
      .select('*, configurations(*)')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      throw new Error(`Review not found: ${reviewError?.message}`)
    }

    // Check if user is the reviewer
    if (review.reviewer_id !== user.id) {
      throw new Error('Unauthorized: You are not the assigned reviewer')
    }

    // Check if review is already completed
    if (review.status !== 'pending') {
      throw new Error(`Review is already ${review.status}`)
    }

    // Update review
    const { data: updatedReview, error: updateError } = await supabase
      .from('configuration_reviews')
      .update({
        status: input.status,
        comments: input.comments,
        suggested_changes: input.suggestedChanges,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update review: ${updateError.message}`)
    }

    // Check if all reviews are completed
    const { data: allReviews } = await supabase
      .from('configuration_reviews')
      .select('status')
      .eq('configuration_id', review.configuration_id)

    const allCompleted = allReviews?.every((r) => r.status !== 'pending')
    const allApproved = allReviews?.every((r) => r.status === 'approved')
    const hasRejection = allReviews?.some((r) => r.status === 'rejected')
    const hasNeedsChanges = allReviews?.some((r) => r.status === 'needs_changes')

    if (allCompleted) {
      let newStatus: string
      if (hasRejection) {
        newStatus = 'rejected'
      } else if (hasNeedsChanges) {
        newStatus = 'needs_changes'
      } else if (allApproved) {
        newStatus = 'approved'
      } else {
        newStatus = 'needs_changes'
      }

      // Update configuration status
      await supabase
        .from('configurations')
        .update({
          status: newStatus,
          reviewed_by: user.id,
        })
        .eq('id', review.configuration_id)

      // Send notification to configuration creator
      try {
        const notificationService = getNotificationService()
        if (review.configurations?.created_by) {
          await notificationService.sendNotification({
            userId: review.configurations.created_by,
            title: 'Konfigürasyon İncelemesi Tamamlandı',
            message: `${review.configurations.name} konfigürasyonu ${newStatus === 'approved' ? 'onaylandı' : newStatus === 'rejected' ? 'reddedildi' : 'değişiklik gerektiriyor'}.`,
            notificationType: 'approval_request',
            detailType: 'configuration_review_complete',
            actionUrl: `/configurations/${review.configuration_id}`,
            actionLabel: 'Görüntüle',
          })
        }
      } catch (error) {
        console.error('Failed to send notification:', error)
      }
    }

    return updatedReview as Review
  }

  /**
   * Get pending reviews for a user
   */
  async getPendingReviews(userId: string): Promise<Review[]> {
    const supabase = await this.getSupabase()

    const { data: reviews, error } = await supabase
      .from('configuration_reviews')
      .select('*, configurations(*)')
      .eq('reviewer_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get pending reviews: ${error.message}`)
    }

    return (reviews || []) as Review[]
  }

  /**
   * Get review history for a configuration
   */
  async getReviewHistory(configurationId: string): Promise<ReviewHistory> {
    const supabase = await this.getSupabase()

    // Get all reviews
    const { data: reviews, error } = await supabase
      .from('configuration_reviews')
      .select('*, profiles(full_name, email)')
      .eq('configuration_id', configurationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get review history: ${error.message}`)
    }

    // Get configuration status
    const { data: configuration } = await supabase
      .from('configurations')
      .select('status')
      .eq('id', configurationId)
      .single()

    const approvalCount = reviews?.filter((r) => r.status === 'approved').length || 0
    const rejectionCount = reviews?.filter((r) => r.status === 'rejected').length || 0
    const needsChangesCount = reviews?.filter((r) => r.status === 'needs_changes').length || 0

    return {
      reviews: (reviews || []) as Review[],
      currentStatus: (configuration?.status || 'draft') as any,
      approvalCount,
      rejectionCount,
      needsChangesCount,
    }
  }

  /**
   * Approve configuration
   */
  async approveConfiguration(
    configurationId: string,
    reviewerId: string
  ): Promise<void> {
    // Find pending review for this reviewer
    const supabase = await this.getSupabase()

    const { data: review } = await supabase
      .from('configuration_reviews')
      .select('id')
      .eq('configuration_id', configurationId)
      .eq('reviewer_id', reviewerId)
      .eq('status', 'pending')
      .single()

    if (!review) {
      throw new Error('No pending review found for this reviewer')
    }

    await this.reviewConfiguration(review.id, {
      status: 'approved',
    })
  }

  /**
   * Reject configuration
   */
  async rejectConfiguration(
    configurationId: string,
    reviewerId: string,
    reason: string
  ): Promise<void> {
    // Find pending review for this reviewer
    const supabase = await this.getSupabase()

    const { data: review } = await supabase
      .from('configuration_reviews')
      .select('id')
      .eq('configuration_id', configurationId)
      .eq('reviewer_id', reviewerId)
      .eq('status', 'pending')
      .single()

    if (!review) {
      throw new Error('No pending review found for this reviewer')
    }

    await this.reviewConfiguration(review.id, {
      status: 'rejected',
      comments: reason,
    })
  }

  /**
   * Request changes for configuration
   */
  async requestChanges(
    configurationId: string,
    reviewerId: string,
    comments: string,
    suggestedChanges?: Record<string, any>
  ): Promise<void> {
    // Find pending review for this reviewer
    const supabase = await this.getSupabase()

    const { data: review } = await supabase
      .from('configuration_reviews')
      .select('id')
      .eq('configuration_id', configurationId)
      .eq('reviewer_id', reviewerId)
      .eq('status', 'pending')
      .single()

    if (!review) {
      throw new Error('No pending review found for this reviewer')
    }

    await this.reviewConfiguration(review.id, {
      status: 'needs_changes',
      comments,
      suggestedChanges,
    })
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string): Promise<Review> {
    const supabase = await this.getSupabase()

    const { data: review, error } = await supabase
      .from('configuration_reviews')
      .select('*, configurations(*), profiles(full_name, email)')
      .eq('id', reviewId)
      .single()

    if (error || !review) {
      throw new Error(`Review not found: ${error?.message}`)
    }

    return review as Review
  }
}

// Singleton pattern
let instance: ConfigurationReviewService | null = null

export function getConfigurationReviewService(): ConfigurationReviewService {
  if (!instance) {
    instance = new ConfigurationReviewService()
  }
  return instance
}

// Export class for testing
export { ConfigurationReviewService }

