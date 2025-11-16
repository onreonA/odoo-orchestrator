'use client'

import { useState, useEffect } from 'react'
import { Lock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PrivacySettingsProps {
  consultantId: string
  calendar: any
}

export function PrivacySettings({ consultantId, calendar }: PrivacySettingsProps) {
  const [privacySettings, setPrivacySettings] = useState({
    show_availability: true,
    show_details: false,
    allow_meeting_requests: true,
    auto_approve: false,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (calendar?.privacy_settings) {
      setPrivacySettings(calendar.privacy_settings)
    }
  }, [calendar])

  const updateSetting = (key: string, value: boolean) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value,
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/consultant/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultant_id: consultantId,
          privacy_settings: privacySettings,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save privacy settings')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving privacy settings:', error)
      alert('Gizlilik ayarları kaydedilirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Gizlilik Ayarları</h3>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="font-medium text-sm">Müsaitliği Göster</div>
            <div className="text-xs text-gray-500">Firmalar müsaitlik durumunuzu görebilir</div>
          </div>
          <input
            type="checkbox"
            checked={privacySettings.show_availability}
            onChange={e => updateSetting('show_availability', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="font-medium text-sm">Detayları Göster</div>
            <div className="text-xs text-gray-500">Toplantı detaylarını paylaş</div>
          </div>
          <input
            type="checkbox"
            checked={privacySettings.show_details}
            onChange={e => updateSetting('show_details', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="font-medium text-sm">Randevu Taleplerine İzin Ver</div>
            <div className="text-xs text-gray-500">Firmalar randevu talep edebilir</div>
          </div>
          <input
            type="checkbox"
            checked={privacySettings.allow_meeting_requests}
            onChange={e => updateSetting('allow_meeting_requests', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="font-medium text-sm">Otomatik Onay</div>
            <div className="text-xs text-gray-500">Randevu taleplerini otomatik onayla</div>
          </div>
          <input
            type="checkbox"
            checked={privacySettings.auto_approve}
            onChange={e => updateSetting('auto_approve', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
        </label>
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full mt-4">
        {loading ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
      </Button>
    </div>
  )
}
