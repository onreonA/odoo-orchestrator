'use client'

import { useState } from 'react'
import { Star, MessageSquare, AlertCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Deployment {
  id: string
  status: string
  created_at: string
}

interface FeedbackFormProps {
  templateId: string
  companyId: string
  userId: string
  deployments: Deployment[]
}

export function FeedbackForm({ templateId, companyId, userId, deployments }: FeedbackFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    deployment_id: '',
    rating: 0,
    feedback_text: '',
    issues: [] as Array<{ type: string; description: string; severity: string }>,
    suggestions: [] as Array<{ type: string; description: string }>,
  })
  const [hoveredStar, setHoveredStar] = useState(0)
  const [newIssue, setNewIssue] = useState({ type: 'error', description: '', severity: 'medium' })
  const [newSuggestion, setNewSuggestion] = useState({ type: 'improvement', description: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (formData.rating === 0) {
      setError('Lütfen bir rating seçin')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/templates/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          company_id: companyId,
          deployment_id: formData.deployment_id || null,
          rating: formData.rating,
          feedback_text: formData.feedback_text || null,
          issues: formData.issues.length > 0 ? formData.issues : null,
          suggestions: formData.suggestions.length > 0 ? formData.suggestions : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Feedback gönderilemedi')
      }

      setSuccess(true)
      setFormData({
        deployment_id: '',
        rating: 0,
        feedback_text: '',
        issues: [],
        suggestions: [],
      })
      setTimeout(() => {
        setSuccess(false)
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const addIssue = () => {
    if (newIssue.description.trim()) {
      setFormData({
        ...formData,
        issues: [...formData.issues, { ...newIssue }],
      })
      setNewIssue({ type: 'error', description: '', severity: 'medium' })
    }
  }

  const removeIssue = (index: number) => {
    setFormData({
      ...formData,
      issues: formData.issues.filter((_, i) => i !== index),
    })
  }

  const addSuggestion = () => {
    if (newSuggestion.description.trim()) {
      setFormData({
        ...formData,
        suggestions: [...formData.suggestions, { ...newSuggestion }],
      })
      setNewSuggestion({ type: 'improvement', description: '' })
    }
  }

  const removeSuggestion = (index: number) => {
    setFormData({
      ...formData,
      suggestions: formData.suggestions.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Feedback Gönder
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            Feedback başarıyla gönderildi!
          </div>
        )}

        {/* Deployment Selection */}
        {deployments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deployment (Opsiyonel)
            </label>
            <select
              value={formData.deployment_id}
              onChange={e => setFormData({ ...formData, deployment_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seçiniz...</option>
              {deployments.map(deployment => (
                <option key={deployment.id} value={deployment.id}>
                  {new Date(deployment.created_at).toLocaleDateString('tr-TR')} -{' '}
                  {deployment.status}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredStar || formData.rating)
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {formData.rating > 0 && (
              <span className="ml-2 text-sm text-gray-600">{formData.rating} / 5</span>
            )}
          </div>
        </div>

        {/* Feedback Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Metni</label>
          <textarea
            value={formData.feedback_text}
            onChange={e => setFormData({ ...formData, feedback_text: e.target.value })}
            rows={4}
            placeholder="Template hakkında görüşlerinizi paylaşın..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Issues */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sorunlar (Opsiyonel)
          </label>
          <div className="space-y-2">
            {formData.issues.map((issue, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{issue.type}</div>
                  <div className="text-sm text-gray-600">{issue.description}</div>
                  <div className="text-xs text-gray-500">Severity: {issue.severity}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeIssue(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <select
                value={newIssue.type}
                onChange={e => setNewIssue({ ...newIssue, type: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="error">Hata</option>
                <option value="bug">Bug</option>
                <option value="missing_feature">Eksik Özellik</option>
                <option value="performance">Performans</option>
              </select>
              <input
                type="text"
                value={newIssue.description}
                onChange={e => setNewIssue({ ...newIssue, description: e.target.value })}
                placeholder="Sorun açıklaması..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <select
                value={newIssue.severity}
                onChange={e => setNewIssue({ ...newIssue, severity: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik</option>
              </select>
              <Button type="button" variant="outline" size="sm" onClick={addIssue}>
                Ekle
              </Button>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Öneriler (Opsiyonel)
          </label>
          <div className="space-y-2">
            {formData.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{suggestion.type}</div>
                  <div className="text-sm text-gray-600">{suggestion.description}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSuggestion(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <select
                value={newSuggestion.type}
                onChange={e => setNewSuggestion({ ...newSuggestion, type: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="improvement">İyileştirme</option>
                <option value="feature">Yeni Özellik</option>
                <option value="optimization">Optimizasyon</option>
                <option value="documentation">Dokümantasyon</option>
              </select>
              <input
                type="text"
                value={newSuggestion.description}
                onChange={e => setNewSuggestion({ ...newSuggestion, description: e.target.value })}
                placeholder="Öneri açıklaması..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addSuggestion}>
                Ekle
              </Button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end">
          <Button type="submit" disabled={loading || formData.rating === 0}>
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Gönderiliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Feedback Gönder
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}


