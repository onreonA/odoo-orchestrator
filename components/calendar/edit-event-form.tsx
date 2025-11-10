'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CalendarEvent } from '@/lib/services/calendar-service'

interface Company {
  id: string
  name: string
}

interface EditEventFormProps {
  event: CalendarEvent
}

export function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])

  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || '',
    event_type: event.event_type,
    start_time: event.start_time.slice(0, 16), // Format for datetime-local input
    end_time: event.end_time.slice(0, 16),
    all_day: event.all_day,
    location: event.location || '',
    meeting_url: event.meeting_url || '',
    company_id: event.company_id || '',
    project_id: event.project_id || '',
    status: event.status,
    is_private: event.is_private,
    visibility: event.visibility,
  })

  useEffect(() => {
    async function loadCompanies() {
      const supabase = createClient()
      const { data } = await supabase.from('companies').select('id, name').order('name')
      if (data) {
        setCompanies(data)
      }
    }
    loadCompanies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/calendar/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          start_time: formData.start_time || undefined,
          end_time: formData.end_time || undefined,
          company_id: formData.company_id || undefined,
          project_id: formData.project_id || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Etkinlik güncellenemedi')
        setLoading(false)
        return
      }

      router.push(`/calendar/events/${event.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/calendar/events/${event.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Etkinliği Düzenle</h1>
          <p className="text-gray-600 mt-1">Etkinlik bilgilerini güncelleyin</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Başlık <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Açıklama
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Event Type */}
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium mb-1">
            Etkinlik Tipi
          </label>
          <select
            id="event_type"
            value={formData.event_type}
            onChange={e => setFormData({ ...formData, event_type: e.target.value as any })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="meeting">Toplantı</option>
            <option value="call">Görüşme</option>
            <option value="task">Görev</option>
            <option value="reminder">Hatırlatıcı</option>
            <option value="block">Blok</option>
            <option value="other">Diğer</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Durum
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="scheduled">Planlandı</option>
            <option value="confirmed">Onaylandı</option>
            <option value="cancelled">İptal Edildi</option>
            <option value="completed">Tamamlandı</option>
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium mb-1">
              Başlangıç <span className="text-red-500">*</span>
            </label>
            <input
              id="start_time"
              type="datetime-local"
              required
              value={formData.start_time}
              onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium mb-1">
              Bitiş <span className="text-red-500">*</span>
            </label>
            <input
              id="end_time"
              type="datetime-local"
              required
              value={formData.end_time}
              onChange={e => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* All Day */}
        <div className="flex items-center gap-2">
          <input
            id="all_day"
            type="checkbox"
            checked={formData.all_day}
            onChange={e => setFormData({ ...formData, all_day: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="all_day" className="text-sm font-medium">
            Tüm gün
          </label>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">
            Lokasyon
          </label>
          <input
            id="location"
            type="text"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Meeting URL */}
        <div>
          <label htmlFor="meeting_url" className="block text-sm font-medium mb-1">
            Toplantı URL
          </label>
          <input
            id="meeting_url"
            type="url"
            value={formData.meeting_url}
            onChange={e => setFormData({ ...formData, meeting_url: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Company */}
        <div>
          <label htmlFor="company_id" className="block text-sm font-medium mb-1">
            Firma
          </label>
          <select
            id="company_id"
            value={formData.company_id}
            onChange={e => setFormData({ ...formData, company_id: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Firma seçin</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href={`/calendar/events/${event.id}`}>
            <Button type="button" variant="outline" disabled={loading}>
              İptal
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Güncelleniyor...' : 'Güncelle'}
          </Button>
        </div>
      </form>
    </div>
  )
}


