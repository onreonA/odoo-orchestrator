'use client'

import { useState } from 'react'
import { Clock, Building2, User, Check, X, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'

interface Meeting {
  id: string
  requested_date: string
  duration_minutes: number
  meeting_type: string
  notes?: string
  company: { id: string; name: string }
  requested_by_user: { id: string; full_name: string; email: string }
  status: string
}

interface MeetingRequestListProps {
  consultantId: string
  pendingRequests: Meeting[]
  upcomingMeetings: Meeting[]
}

export function MeetingRequestList({
  consultantId,
  pendingRequests,
  upcomingMeetings,
}: MeetingRequestListProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleApprove = async (meetingId: string) => {
    setLoading(meetingId)
    try {
      const response = await fetch(`/api/consultant/meetings/${meetingId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to approve meeting')
      }

      window.location.reload()
    } catch (error) {
      console.error('Error approving meeting:', error)
      alert('Toplantı onaylanırken bir hata oluştu')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (meetingId: string) => {
    const reason = prompt('Red nedeni (opsiyonel):')
    setLoading(meetingId)
    try {
      const response = await fetch(`/api/consultant/meetings/${meetingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject meeting')
      }

      window.location.reload()
    } catch (error) {
      console.error('Error rejecting meeting:', error)
      alert('Toplantı reddedilirken bir hata oluştu')
    } finally {
      setLoading(null)
    }
  }

  const getMeetingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      discovery: 'Discovery',
      support: 'Destek',
      review: 'İnceleme',
      training: 'Eğitim',
      other: 'Diğer',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Bekleyen Talepler ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map(meeting => (
              <div
                key={meeting.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">{meeting.company.name}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {getMeetingTypeLabel(meeting.meeting_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(meeting.requested_date), 'd MMMM yyyy, HH:mm', {
                          locale: tr,
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {meeting.duration_minutes} dakika
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {meeting.requested_by_user.full_name}
                      </div>
                    </div>
                    {meeting.notes && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {meeting.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => handleApprove(meeting.id)}
                      disabled={loading === meeting.id}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Onayla
                    </Button>
                    <Button
                      onClick={() => handleReject(meeting.id)}
                      disabled={loading === meeting.id}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reddet
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Yaklaşan Toplantılar ({upcomingMeetings.length})
          </h3>
          <div className="space-y-3">
            {upcomingMeetings.map(meeting => (
              <div
                key={meeting.id}
                className="border border-gray-200 rounded-lg p-4 bg-blue-50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">{meeting.company.name}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Onaylandı
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(meeting.requested_date), 'd MMMM yyyy, HH:mm', {
                          locale: tr,
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {meeting.duration_minutes} dakika
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {meeting.requested_by_user.full_name}
                      </div>
                    </div>
                    {meeting.notes && (
                      <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded">
                        {meeting.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingRequests.length === 0 && upcomingMeetings.length === 0 && (
        <div className="text-center py-8 text-gray-500">Henüz randevu talebi yok</div>
      )}
    </div>
  )
}



