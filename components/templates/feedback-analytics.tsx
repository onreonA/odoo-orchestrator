'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Star, TrendingUp, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react'

interface FeedbackStats {
  total: number
  avgRating: number
  recentAvgRating: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  sentimentDistribution: {
    positive: number
    neutral: number
    negative: number
  }
  commonIssues: Array<{ type: string; count: number }>
  commonSuggestions: Array<{ type: string; count: number }>
  recentCount: number
}

interface FeedbackAnalyticsProps {
  templateId: string
}

export function FeedbackAnalytics({ templateId }: FeedbackAnalyticsProps) {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/templates/${templateId}/feedback/stats`)
        if (!response.ok) {
          throw new Error('Feedback stats alınamadı')
        }

        const data = await response.json()
        setStats(data.stats)
      } catch (err: any) {
        setError(err.message || 'Bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [templateId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const maxRatingCount = Math.max(...Object.values(stats.ratingDistribution))
  const maxSentimentCount = Math.max(...Object.values(stats.sentimentDistribution))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        <h2 className="text-xl font-semibold">Feedback Analytics</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Toplam Feedback</span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-600">Ortalama Rating</span>
          </div>
          <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">
            Son 30 gün: {stats.recentAvgRating.toFixed(1)}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Pozitif</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.sentimentDistribution.positive}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-600">Negatif</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {stats.sentimentDistribution.negative}
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5" />
          Rating Dağılımı
        </h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
            const barWidth = maxRatingCount > 0 ? (count / maxRatingCount) * 100 : 0

            return (
              <div key={rating}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rating} Yıldız</span>
                    <div className="flex">
                      {[...Array(rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {count} ({percentage.toFixed(1)}%)
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Sentiment Dağılımı
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Pozitif', value: stats.sentimentDistribution.positive, color: 'green' },
            { label: 'Nötr', value: stats.sentimentDistribution.neutral, color: 'gray' },
            { label: 'Negatif', value: stats.sentimentDistribution.negative, color: 'red' },
          ].map(sentiment => {
            const percentage = stats.total > 0 ? (sentiment.value / stats.total) * 100 : 0
            const barWidth = maxSentimentCount > 0 ? (sentiment.value / maxSentimentCount) * 100 : 0

            return (
              <div key={sentiment.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{sentiment.label}</span>
                  <div className="text-sm text-gray-600">
                    {sentiment.value} ({percentage.toFixed(1)}%)
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${sentiment.color}-500 h-2 rounded-full transition-all`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Common Issues */}
      {stats.commonIssues.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Yaygın Sorunlar
          </h3>
          <div className="space-y-2">
            {stats.commonIssues.map((issue, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <span className="text-sm font-medium">{issue.type}</span>
                <span className="text-sm text-gray-600">{issue.count} kez bildirildi</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Suggestions */}
      {stats.commonSuggestions.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Yaygın Öneriler
          </h3>
          <div className="space-y-2">
            {stats.commonSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
              >
                <span className="text-sm font-medium">{suggestion.type}</span>
                <span className="text-sm text-gray-600">{suggestion.count} kez önerildi</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



