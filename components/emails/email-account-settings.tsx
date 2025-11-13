'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'
import { EmailAccount } from '@/lib/services/email-service'

interface EmailAccountSettingsProps {
  account: EmailAccount
}

export function EmailAccountSettings({ account }: EmailAccountSettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    display_name: account.display_name || '',
    sync_enabled: account.sync_enabled,
    sync_frequency: account.sync_frequency,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/emails/accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Ayarlar kaydedilemedi')
        setLoading(false)
        return
      }

      router.refresh()
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
    >
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Temel Bilgiler</h2>
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium mb-1">
            Görünen İsim
          </label>
          <input
            id="display_name"
            type="text"
            value={formData.display_name}
            onChange={e => setFormData({ ...formData, display_name: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email Adresi</label>
          <input
            type="text"
            value={account.email_address}
            disabled
            className="w-full rounded-lg border border-gray-200 px-4 py-2 bg-gray-50 text-gray-600"
          />
        </div>
      </div>

      {/* Sync Settings */}
      <div className="border-t border-gray-200 pt-6 space-y-4">
        <h2 className="text-lg font-semibold">Senkronizasyon Ayarları</h2>
        <div className="flex items-center gap-2">
          <input
            id="sync_enabled"
            type="checkbox"
            checked={formData.sync_enabled}
            onChange={e => setFormData({ ...formData, sync_enabled: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="sync_enabled" className="text-sm font-medium">
            Otomatik senkronizasyonu etkinleştir
          </label>
        </div>
        {formData.sync_enabled && (
          <div>
            <label htmlFor="sync_frequency" className="block text-sm font-medium mb-1">
              Senkronizasyon Sıklığı (dakika)
            </label>
            <input
              id="sync_frequency"
              type="number"
              min="1"
              value={formData.sync_frequency}
              onChange={e => setFormData({ ...formData, sync_frequency: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end pt-4 border-t border-gray-200">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
