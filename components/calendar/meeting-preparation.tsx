'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, CheckCircle2, FileText, MessageSquare, Clock } from 'lucide-react'
import { CalendarEvent } from '@/lib/services/calendar-service'

interface MeetingPreparationProps {
  event: CalendarEvent
}

interface PreparationData {
  agenda: string[]
  keyPoints: string[]
  questions: string[]
  documents: string[]
  preparationTime: number
}

export function MeetingPreparation({ event }: MeetingPreparationProps) {
  const [loading, setLoading] = useState(false)
  const [preparation, setPreparation] = useState<PreparationData | null>(null)
  const [error, setError] = useState('')

  const handlePrepare = async () => {
    if (!event.company_id) {
      setError('Firma bilgisi bulunamadı')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare-meeting',
          data: {
            companyId: event.company_id,
            meetingType: event.event_type === 'meeting' ? 'discovery' : 'planning',
            attendees: event.attendees || [],
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Toplantı hazırlığı yapılamadı')
        setLoading(false)
        return
      }

      setPreparation(result.data)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  // Note: Auto-prepare functionality can be added later if needed
  // For now, user needs to click the button manually

  if (!event.company_id) {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Toplantı Hazırlığı</h3>
        {!preparation && (
          <Button onClick={handlePrepare} disabled={loading} size="sm">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Hazırlanıyor...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI ile Hazırla
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {preparation && (
        <div className="space-y-4">
          {/* Preparation Time */}
          {preparation.preparationTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Tahmini hazırlık süresi: {preparation.preparationTime} dakika</span>
            </div>
          )}

          {/* Agenda */}
          {preparation.agenda && preparation.agenda.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Gündem
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {preparation.agenda.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Points */}
          {preparation.keyPoints && preparation.keyPoints.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Önemli Noktalar
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {preparation.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions */}
          {preparation.questions && preparation.questions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Sorulacak Sorular
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {preparation.questions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Documents */}
          {preparation.documents && preparation.documents.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Gerekli Dokümanlar</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {preparation.documents.map((doc, index) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

