'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Building2, User, MessageSquare, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Consultant {
  id: string
  full_name: string
  email: string
}

interface ConsultantCalendar {
  consultant_id: string
  privacy_settings: {
    show_availability: boolean
    allow_meeting_requests: boolean
    auto_approve: boolean
  }
  working_hours: Record<string, { start: string; end: string; enabled: boolean }>
}

interface MeetingRequestFormProps {
  userId: string
  companyId?: string
  consultants: Consultant[]
  consultantCalendars: ConsultantCalendar[]
}

export function MeetingRequestForm({
  userId,
  companyId,
  consultants,
  consultantCalendars,
}: MeetingRequestFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    consultant_id: '',
    requested_date: '',
    requested_time: '',
    duration_minutes: 60,
    meeting_type: 'discovery',
    notes: '',
  })

  // Filter consultants who allow meeting requests
  const availableConsultants = consultants.filter(consultant => {
    const calendar = consultantCalendars.find(c => c.consultant_id === consultant.id)
    return !calendar || calendar.privacy_settings.allow_meeting_requests !== false
  })

  // Get selected consultant's calendar
  const selectedConsultantCalendar = consultantCalendars.find(
    c => c.consultant_id === formData.consultant_id
  )

  // Get available time slots for selected consultant
  const getAvailableTimeSlots = () => {
    if (!selectedConsultantCalendar || !formData.requested_date) {
      return []
    }

    const selectedDate = new Date(formData.requested_date)
    const dayOfWeek = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ][selectedDate.getDay()]
    const workingHours = selectedConsultantCalendar.working_hours[dayOfWeek]

    if (!workingHours || !workingHours.enabled) {
      return []
    }

    const slots: string[] = []
    const start = workingHours.start ? parseInt(workingHours.start.split(':')[0]) : 9
    const end = workingHours.end ? parseInt(workingHours.end.split(':')[0]) : 18

    for (let hour = start; hour < end; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      if (hour < end - 1) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`)
      }
    }

    return slots
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.consultant_id || !formData.requested_date || !formData.requested_time) {
      setError('Lütfen tüm zorunlu alanları doldurun')
      setLoading(false)
      return
    }

    // Combine date and time
    const requestedDateTime = new Date(`${formData.requested_date}T${formData.requested_time}`)

    if (requestedDateTime < new Date()) {
      setError('Geçmiş bir tarih seçemezsiniz')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/consultant/meetings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultant_id: formData.consultant_id,
          company_id: companyId,
          requested_date: requestedDateTime.toISOString(),
          duration_minutes: formData.duration_minutes,
          meeting_type: formData.meeting_type,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Randevu talebi oluşturulamadı')
      }

      const data = await response.json()

      // Redirect to success page or back to calendar
      router.push(`/consultant/meetings/${data.meeting.id}`)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Consultant Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Danışman Seçin *
          </label>
          <select
            value={formData.consultant_id}
            onChange={e => setFormData({ ...formData, consultant_id: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Danışman seçin...</option>
            {availableConsultants.map(consultant => (
              <option key={consultant.id} value={consultant.id}>
                {consultant.full_name} ({consultant.email})
              </option>
            ))}
          </select>
          {availableConsultants.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">Şu anda müsait danışman bulunmuyor</p>
          )}
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Tarih Seçin *
          </label>
          <input
            type="date"
            value={formData.requested_date}
            onChange={e => {
              setFormData({ ...formData, requested_date: e.target.value, requested_time: '' })
            }}
            min={getMinDate()}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {selectedConsultantCalendar && formData.requested_date && (
            <p className="text-sm text-gray-500 mt-1">
              {getAvailableTimeSlots().length > 0
                ? `${getAvailableTimeSlots().length} müsait saat bulundu`
                : 'Bu tarihte müsait saat bulunmuyor'}
            </p>
          )}
        </div>

        {/* Time Selection */}
        {formData.requested_date && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Saat Seçin *
            </label>
            <select
              value={formData.requested_time}
              onChange={e => setFormData({ ...formData, requested_time: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Saat seçin...</option>
              {getAvailableTimeSlots().map(slot => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {getAvailableTimeSlots().length === 0 && formData.requested_date && (
              <p className="text-sm text-orange-500 mt-1">
                Bu tarihte müsait saat bulunmuyor. Lütfen başka bir tarih seçin.
              </p>
            )}
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Süre (dakika) *
          </label>
          <select
            value={formData.duration_minutes}
            onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={30}>30 dakika</option>
            <option value={60}>60 dakika</option>
            <option value={90}>90 dakika</option>
            <option value={120}>120 dakika</option>
          </select>
        </div>

        {/* Meeting Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="w-4 h-4 inline mr-1" />
            Toplantı Türü *
          </label>
          <select
            value={formData.meeting_type}
            onChange={e => setFormData({ ...formData, meeting_type: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="discovery">Discovery</option>
            <option value="support">Destek</option>
            <option value="review">İnceleme</option>
            <option value="training">Eğitim</option>
            <option value="other">Diğer</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Notlar (Opsiyonel)
          </label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            placeholder="Toplantı hakkında ek bilgiler..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            İptal
          </Button>
          <Button
            type="submit"
            disabled={
              loading ||
              !formData.consultant_id ||
              !formData.requested_date ||
              !formData.requested_time
            }
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Gönderiliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Randevu Talep Et
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
