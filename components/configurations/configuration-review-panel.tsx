'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Clock, User, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Review {
  id: string
  reviewer_id: string
  reviewer?: {
    full_name: string
    email: string
  }
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes'
  comments?: string
  suggested_changes?: any
  reviewed_at?: string
  created_at: string
}

interface ConfigurationReviewPanelProps {
  configurationId: string
  currentStatus: string
  canReview?: boolean
  onReviewSubmitted?: () => void
}

export function ConfigurationReviewPanel({
  configurationId,
  currentStatus,
  canReview = false,
  onReviewSubmitted,
}: ConfigurationReviewPanelProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    status: 'approved' as 'approved' | 'rejected' | 'needs_changes',
    comments: '',
  })

  useEffect(() => {
    fetchReviews()
  }, [configurationId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/configurations/${configurationId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviewHistory?.reviews || [])
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // First, submit for review (this creates pending reviews)
      const submitResponse = await fetch(`/api/configurations/${configurationId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerIds: [], // Backend will use current user as reviewer
        }),
      })

      if (!submitResponse.ok) {
        const data = await submitResponse.json()
        throw new Error(data.error || 'Review gönderilemedi')
      }

      const submitData = await submitResponse.json()
      const reviewId = submitData.reviews?.[0]?.id

      // Then, update the review with the actual status and comments
      if (reviewId) {
        const updateResponse = await fetch(
          `/api/configurations/${configurationId}/reviews/${reviewId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: reviewForm.status,
              comments: reviewForm.comments,
            }),
          }
        )

        if (!updateResponse.ok) {
          const data = await updateResponse.json()
          throw new Error(data.error || 'Review güncellenemedi')
        }
      }

      setShowReviewForm(false)
      setReviewForm({ status: 'approved', comments: '' })
      fetchReviews()
      onReviewSubmitted?.()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: Review['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'needs_changes':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'needs_changes':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Review Geçmişi
        </h3>
        {canReview && currentStatus === 'draft' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            Review Gönder
          </Button>
        )}
      </div>

      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Durum</label>
              <select
                value={reviewForm.status}
                onChange={e =>
                  setReviewForm({
                    ...reviewForm,
                    status: e.target.value as 'approved' | 'rejected' | 'needs_changes',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="approved">Onayla</option>
                <option value="rejected">Reddet</option>
                <option value="needs_changes">Değişiklik Gerekli</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Yorumlar</label>
              <textarea
                value={reviewForm.comments}
                onChange={e => setReviewForm({ ...reviewForm, comments: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Review yorumlarınızı yazın..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} size="sm">
                {submitting ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowReviewForm(false)}
              >
                İptal
              </Button>
            </div>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Henüz review yok</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div
              key={review.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(review.status)}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(review.status)}`}
                  >
                    {review.status === 'pending'
                      ? 'Beklemede'
                      : review.status === 'approved'
                        ? 'Onaylandı'
                        : review.status === 'rejected'
                          ? 'Reddedildi'
                          : 'Değişiklik Gerekli'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {review.reviewed_at
                    ? format(new Date(review.reviewed_at), 'dd MMM yyyy HH:mm', { locale: tr })
                    : format(new Date(review.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                </span>
              </div>
              {review.reviewer && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{review.reviewer.full_name || review.reviewer.email || 'Bilinmiyor'}</span>
                </div>
              )}
              {review.comments && (
                <p className="text-sm text-gray-700 mt-2">{review.comments}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

