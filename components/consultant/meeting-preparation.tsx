'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  AlertCircle,
  HelpCircle,
  Link as LinkIcon,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MeetingPreparationProps {
  meetingId: string
  canPrepare: boolean
}

interface Preparation {
  previousMeetingNotes: string[]
  missingInformation: string[]
  questionList: string[]
  relatedDocuments: Array<{ id: string; name: string; url: string }>
  meetingLink?: string
  preparationSummary: string
}

export function MeetingPreparation({ meetingId, canPrepare }: MeetingPreparationProps) {
  const [preparation, setPreparation] = useState<Preparation | null>(null)
  const [loading, setLoading] = useState(false)
  const [preparing, setPreparing] = useState(false)

  useEffect(() => {
    if (meetingId) {
      loadPreparation()
    }
  }, [meetingId])

  const loadPreparation = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/consultant/meetings/${meetingId}/prepare`)
      if (response.ok) {
        const data = await response.json()
        setPreparation(data.preparation)
      }
    } catch (error) {
      console.error('Error loading preparation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrepare = async () => {
    setPreparing(true)
    try {
      const response = await fetch(`/api/consultant/meetings/${meetingId}/prepare`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Preparation failed')
      }

      const data = await response.json()
      setPreparation(data.preparation)
    } catch (error: any) {
      alert(`Hazırlık başarısız: ${error.message}`)
    } finally {
      setPreparing(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!preparation && !canPrepare) {
    return null
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Toplantı Hazırlığı</h3>
        </div>
        {canPrepare && !preparation && (
          <Button onClick={handlePrepare} disabled={preparing} variant="outline">
            {preparing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Hazırlanıyor...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Hazırlık Yap
              </>
            )}
          </Button>
        )}
      </div>

      {preparation ? (
        <div className="space-y-4">
          {/* Preparation Summary */}
          {preparation.preparationSummary && (
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {preparation.preparationSummary}
              </pre>
            </div>
          )}

          {/* Previous Meeting Notes */}
          {preparation.previousMeetingNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <h4 className="font-medium">Geçmiş Toplantı Notları</h4>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-6">
                {preparation.previousMeetingNotes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Information */}
          {preparation.missingInformation.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <h4 className="font-medium">Eksik Bilgiler</h4>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-6">
                {preparation.missingInformation.map((info, i) => (
                  <li key={i}>{info}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Question List */}
          {preparation.questionList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-green-500" />
                <h4 className="font-medium">Sorulacak Sorular</h4>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-6">
                {preparation.questionList.map((question, i) => (
                  <li key={i}>{question}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Documents */}
          {preparation.relatedDocuments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-purple-500" />
                <h4 className="font-medium">İlgili Dokümanlar</h4>
              </div>
              <ul className="space-y-2">
                {preparation.relatedDocuments.map(doc => (
                  <li key={doc.id}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {doc.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meeting Link */}
          {preparation.meetingLink && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-blue-500" />
                <h4 className="font-medium">Toplantı Linki</h4>
              </div>
              <a
                href={preparation.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {preparation.meetingLink}
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Henüz hazırlık yapılmamış</p>
          {canPrepare && (
            <p className="text-sm mt-2">
              Yukarıdaki butona tıklayarak otomatik hazırlık yapabilirsiniz
            </p>
          )}
        </div>
      )}
    </div>
  )
}



