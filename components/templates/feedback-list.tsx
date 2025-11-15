'use client'

import { Star, User, Building2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Feedback {
  id: string
  rating: number
  feedback_text: string | null
  sentiment: string | null
  issues: any[] | null
  suggestions: any[] | null
  created_at: string
  user: {
    id: string
    full_name: string
    email: string
  } | null
  company: {
    id: string
    name: string
  } | null
}

interface FeedbackListProps {
  templateId: string
  feedbackList: Feedback[]
  userId: string
}

export function FeedbackList({ templateId, feedbackList, userId }: FeedbackListProps) {
  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-700'
      case 'negative':
        return 'bg-red-100 text-red-700'
      case 'neutral':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getSentimentLabel = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'Pozitif'
      case 'negative':
        return 'Negatif'
      case 'neutral':
        return 'Nötr'
      default:
        return 'Bilinmiyor'
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Feedback Listesi</h2>

      {feedbackList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Henüz feedback yok</div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map(feedback => (
            <div
              key={feedback.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {feedback.user && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        {feedback.user.full_name}
                      </div>
                    )}
                    {feedback.company && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Building2 className="w-4 h-4" />
                        {feedback.company.name}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(feedback.created_at), 'd MMMM yyyy', { locale: tr })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= feedback.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm font-medium">{feedback.rating} / 5</span>
                    {feedback.sentiment && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getSentimentColor(
                          feedback.sentiment
                        )}`}
                      >
                        {getSentimentLabel(feedback.sentiment)}
                      </span>
                    )}
                  </div>
                  {feedback.feedback_text && (
                    <p className="text-sm text-gray-700 mb-2">{feedback.feedback_text}</p>
                  )}
                </div>
              </div>

              {/* Issues */}
              {feedback.issues && feedback.issues.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm font-medium text-red-700 mb-2">Sorunlar:</div>
                  <div className="space-y-1">
                    {feedback.issues.map((issue: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {issue.type}: {issue.description} ({issue.severity})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm font-medium text-blue-700 mb-2">Öneriler:</div>
                  <div className="space-y-1">
                    {feedback.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {suggestion.type}: {suggestion.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}





