'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewEmailAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [provider, setProvider] = useState<'gmail' | 'outlook' | 'imap' | 'smtp'>('imap')

  const [formData, setFormData] = useState({
    email_address: '',
    display_name: '',
    provider: 'imap' as const,
    imap_host: '',
    imap_port: 993,
    imap_username: '',
    imap_password: '',
    imap_ssl: true,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_ssl: true,
    sync_enabled: true,
    sync_frequency: 5,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const accountData: any = {
        email_address: formData.email_address,
        display_name: formData.display_name || undefined,
        provider: formData.provider,
        sync_enabled: formData.sync_enabled,
        sync_frequency: formData.sync_frequency,
      }

      if (formData.provider === 'imap' || formData.provider === 'smtp') {
        accountData.imap_host = formData.imap_host
        accountData.imap_port = formData.imap_port
        accountData.imap_username = formData.imap_username
        accountData.imap_password = formData.imap_password
        accountData.imap_ssl = formData.imap_ssl
        accountData.smtp_host = formData.smtp_host
        accountData.smtp_port = formData.smtp_port
        accountData.smtp_username = formData.smtp_username
        accountData.smtp_password = formData.smtp_password
        accountData.smtp_ssl = formData.smtp_ssl
      }

      const response = await fetch('/api/emails/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Hesap eklenemedi')
        setLoading(false)
        return
      }

      router.push('/emails/accounts')
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
        <Link href="/emails/accounts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Email Hesabı</h1>
          <p className="text-gray-600 mt-1">Email hesabınızı ekleyin</p>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Hesap Tipi</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['gmail', 'outlook', 'imap', 'smtp'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setProvider(p)
                setFormData(prev => ({ ...prev, provider: p as typeof prev.provider }))
              }}
              className={`p-4 border-2 rounded-lg transition-colors ${
                provider === p
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Mail className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <div className="text-sm font-medium">
                {p === 'gmail' && 'Gmail'}
                {p === 'outlook' && 'Outlook'}
                {p === 'imap' && 'IMAP'}
                {p === 'smtp' && 'SMTP'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Temel Bilgiler</h2>
          <div>
            <label htmlFor="email_address" className="block text-sm font-medium mb-1">
              Email Adresi <span className="text-red-500">*</span>
            </label>
            <input
              id="email_address"
              type="email"
              required
              value={formData.email_address}
              onChange={e => setFormData({ ...formData, email_address: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium mb-1">
              Görünen İsim
            </label>
            <input
              id="display_name"
              type="text"
              value={formData.display_name}
              onChange={e => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Ömer Ünsal"
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* IMAP Settings */}
        {(provider === 'imap' || provider === 'smtp') && (
          <>
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h2 className="text-lg font-semibold">IMAP Ayarları</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="imap_host" className="block text-sm font-medium mb-1">
                    IMAP Sunucu <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="imap_host"
                    type="text"
                    required={provider === 'imap'}
                    value={formData.imap_host}
                    onChange={e => setFormData({ ...formData, imap_host: e.target.value })}
                    placeholder="imap.example.com"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="imap_port" className="block text-sm font-medium mb-1">
                    Port <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="imap_port"
                    type="number"
                    required={provider === 'imap'}
                    value={formData.imap_port}
                    onChange={e => setFormData({ ...formData, imap_port: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="imap_username" className="block text-sm font-medium mb-1">
                    Kullanıcı Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="imap_username"
                    type="text"
                    required={provider === 'imap'}
                    value={formData.imap_username}
                    onChange={e => setFormData({ ...formData, imap_username: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="imap_password" className="block text-sm font-medium mb-1">
                    Şifre <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="imap_password"
                    type="password"
                    required={provider === 'imap'}
                    value={formData.imap_password}
                    onChange={e => setFormData({ ...formData, imap_password: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="imap_ssl"
                    type="checkbox"
                    checked={formData.imap_ssl}
                    onChange={e => setFormData({ ...formData, imap_ssl: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="imap_ssl" className="text-sm font-medium">
                    SSL/TLS kullan
                  </label>
                </div>
              </div>
            </div>

            {/* SMTP Settings */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h2 className="text-lg font-semibold">SMTP Ayarları</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="smtp_host" className="block text-sm font-medium mb-1">
                    SMTP Sunucu <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="smtp_host"
                    type="text"
                    required={provider === 'smtp'}
                    value={formData.smtp_host}
                    onChange={e => setFormData({ ...formData, smtp_host: e.target.value })}
                    placeholder="smtp.example.com"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="smtp_port" className="block text-sm font-medium mb-1">
                    Port <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="smtp_port"
                    type="number"
                    required={provider === 'smtp'}
                    value={formData.smtp_port}
                    onChange={e => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="smtp_username" className="block text-sm font-medium mb-1">
                    Kullanıcı Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="smtp_username"
                    type="text"
                    required={provider === 'smtp'}
                    value={formData.smtp_username}
                    onChange={e => setFormData({ ...formData, smtp_username: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="smtp_password" className="block text-sm font-medium mb-1">
                    Şifre <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="smtp_password"
                    type="password"
                    required={provider === 'smtp'}
                    value={formData.smtp_password}
                    onChange={e => setFormData({ ...formData, smtp_password: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="smtp_ssl"
                    type="checkbox"
                    checked={formData.smtp_ssl}
                    onChange={e => setFormData({ ...formData, smtp_ssl: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="smtp_ssl" className="text-sm font-medium">
                    SSL/TLS kullan
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {/* OAuth Providers */}
        {(provider === 'gmail' || provider === 'outlook') && (
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {provider === 'gmail' && 'Gmail ve Outlook hesapları için OAuth entegrasyonu yakında eklenecek.'}
                {provider === 'outlook' && 'Outlook hesapları için OAuth entegrasyonu yakında eklenecek.'}
              </p>
            </div>
          </div>
        )}

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
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
          <Link href="/emails/accounts">
            <Button variant="outline" type="button">
              İptal
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ekleniyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Hesabı Ekle
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

