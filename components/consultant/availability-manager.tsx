'use client'

import { useState, useEffect } from 'react'
import { Clock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AvailabilityManagerProps {
  consultantId: string
  calendar: any
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
]

export function AvailabilityManager({ consultantId, calendar }: AvailabilityManagerProps) {
  const [workingHours, setWorkingHours] = useState<
    Record<string, { start: string; end: string; enabled: boolean }>
  >({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (calendar?.working_hours) {
      setWorkingHours(calendar.working_hours)
    } else {
      // Default working hours
      const defaultHours: Record<string, { start: string; end: string; enabled: boolean }> = {}
      DAYS_OF_WEEK.forEach(day => {
        defaultHours[day.key] = {
          start: day.key === 'saturday' || day.key === 'sunday' ? '' : '09:00',
          end: day.key === 'saturday' || day.key === 'sunday' ? '' : '18:00',
          enabled: day.key !== 'saturday' && day.key !== 'sunday',
        }
      })
      setWorkingHours(defaultHours)
    }
  }, [calendar])

  const updateDayHours = (
    day: string,
    field: 'start' | 'end' | 'enabled',
    value: string | boolean
  ) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
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
          working_hours: workingHours,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save working hours')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving working hours:', error)
      alert('Çalışma saatleri kaydedilirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Çalışma Saatleri</h3>
      </div>

      <div className="space-y-3">
        {DAYS_OF_WEEK.map(day => (
          <div key={day.key} className="flex items-center gap-3">
            <div className="w-32 text-sm font-medium">{day.label}</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={workingHours[day.key]?.enabled || false}
                onChange={e => updateDayHours(day.key, 'enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">Aktif</span>
            </label>
            {workingHours[day.key]?.enabled && (
              <>
                <input
                  type="time"
                  value={workingHours[day.key]?.start || ''}
                  onChange={e => updateDayHours(day.key, 'start', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="time"
                  value={workingHours[day.key]?.end || ''}
                  onChange={e => updateDayHours(day.key, 'end', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full mt-4">
        {loading ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
      </Button>
    </div>
  )
}







