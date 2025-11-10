'use client'

import { Email } from '@/lib/services/email-service'
import { AlertCircle, Clock, TrendingUp, MessageSquare } from 'lucide-react'

interface EmailAIInsightsProps {
  email: Email
}

export function EmailAIInsights({ email }: EmailAIInsightsProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">AI Analizi</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Category */}
        {email.ai_category && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Kategori:</span>
            <span
              className={`text-sm px-2 py-1 rounded ${
                email.ai_category === 'urgent'
                  ? 'bg-red-100 text-red-800'
                  : email.ai_category === 'high'
                    ? 'bg-orange-100 text-orange-800'
                    : email.ai_category === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {email.ai_category === 'urgent' && 'Acil'}
              {email.ai_category === 'high' && 'Yüksek Öncelik'}
              {email.ai_category === 'medium' && 'Orta Öncelik'}
              {email.ai_category === 'low' && 'Düşük Öncelik'}
            </span>
          </div>
        )}

        {/* Sentiment */}
        {email.ai_sentiment && (
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Duygu:</span>
            <span
              className={`text-sm px-2 py-1 rounded ${
                email.ai_sentiment === 'positive'
                  ? 'bg-green-100 text-green-800'
                  : email.ai_sentiment === 'negative'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {email.ai_sentiment === 'positive' && 'Pozitif'}
              {email.ai_sentiment === 'negative' && 'Negatif'}
              {email.ai_sentiment === 'neutral' && 'Nötr'}
            </span>
          </div>
        )}

        {/* Priority Score */}
        {email.ai_priority_score !== undefined && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Öncelik Skoru:</span>
            <span className="text-sm font-semibold text-gray-900">
              {(email.ai_priority_score * 100).toFixed(0)}%
            </span>
          </div>
        )}

        {/* Suggested Action */}
        {email.ai_suggested_action && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Önerilen Aksiyon:</span>
            <span className="text-sm text-gray-900 capitalize">{email.ai_suggested_action}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {email.ai_summary && (
        <div className="pt-2 border-t border-blue-200">
          <p className="text-sm text-gray-700">{email.ai_summary}</p>
        </div>
      )}
    </div>
  )
}


