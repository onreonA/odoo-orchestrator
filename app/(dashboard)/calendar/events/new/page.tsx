'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
}

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [suggestingTime, setSuggestingTime] = useState(false)
  const [timeSuggestions, setTimeSuggestions] = useState<any[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'meeting' as const,
    start_time: '',
    end_time: '',
    all_day: false,
    location: '',
    meeting_url: '',
    company_id: '',
    project_id: '',
    is_private: false,
    visibility: 'company' as const,
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

  const handleSuggestTime = async () => {
    if (!formData.company_id) {
      setError('Önce bir firma seçin')
      return
    }

    setSuggestingTime(true)
    setError('')

    try {
      const response = await fetch('/api/ai/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest-time',
          data: {
            duration: 60, // Default 60 dakika
            meetingType: formData.event_type === 'meeting' ? 'discovery' : 'planning',
            companyId: formData.company_id,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Zaman önerisi alınamadı')
        setSuggestingTime(false)
        return
      }

      if (result.data?.suggestedTimes) {
        setTimeSuggestions(result.data.suggestedTimes)
      }

      // En iyi zamanı otomatik doldur
      if (result.data?.bestTime) {
        const bestTime = result.data.bestTime
        const startDate = new Date(bestTime.start)
        const endDate = new Date(bestTime.end)

        setFormData({
          ...formData,
          start_time: startDate.toISOString().slice(0, 16),
          end_time: endDate.toISOString().slice(0, 16),
        })
      }

      setSuggestingTime(false)
    } catch (err: any) {
      setError(err.message || 'Zaman önerisi alınamadı')
      setSuggestingTime(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
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
        setError(result.error || 'Etkinlik oluşturulamadı')
        setLoading(false)
        return
      }

      router.push(`/calendar/events/${result.data.id}`)
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
        <Link href="/calendar">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Etkinlik</h1>
          <p className="text-gray-600 mt-1">Yeni bir takvim etkinliği oluşturun</p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 border border-gray-200 space-y-6"
      >
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
            placeholder="Etkinlik başlığı"
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
            placeholder="Etkinlik açıklaması"
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

        {/* Date & Time */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">
              Tarih ve Saat <span className="text-red-500">*</span>
            </label>
            {formData.company_id && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSuggestTime}
                disabled={suggestingTime}
              >
                {suggestingTime ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Öneriliyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI ile Optimal Zaman Öner
                  </>
                )}
              </Button>
            )}
          </div>
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

          {/* Time Suggestions */}
          {timeSuggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">AI Zaman Önerileri</h4>
              <div className="space-y-2">
                {timeSuggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const startDate = new Date(suggestion.start)
                      const endDate = new Date(suggestion.end)
                      setFormData({
                        ...formData,
                        start_time: startDate.toISOString().slice(0, 16),
                        end_time: endDate.toISOString().slice(0, 16),
                      })
                    }}
                    className="w-full text-left p-2 rounded border border-blue-200 bg-white hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(suggestion.start).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(suggestion.start).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(suggestion.end).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">{suggestion.reason}</div>
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {suggestion.score}/100
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
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
            placeholder="Etkinlik lokasyonu"
          />
        </div>

        {/* Meeting URL */}
        <div>
          <label htmlFor="meeting_url" className="block text-sm font-medium mb-1">
            Toplantı URL (Zoom, Teams, vb.)
          </label>
          <input
            id="meeting_url"
            type="url"
            value={formData.meeting_url}
            onChange={e => setFormData({ ...formData, meeting_url: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
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
          <Link href="/calendar">
            <Button type="button" variant="outline" disabled={loading}>
              İptal
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Oluşturuluyor...' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </div>
  )
}
