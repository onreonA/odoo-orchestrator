'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewSyncPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleConnect = async () => {
    setLoading(true)
    setError('')

    try {
      // Redirect to Google OAuth
      window.location.href = '/api/calendar/syncs/google/oauth'
    } catch (err: any) {
      setError(err.message || 'Bağlantı başlatılamadı')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/calendar/syncs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Takvim Bağlantısı</h1>
          <p className="text-gray-600 mt-1">Dış takviminizi bağlayın</p>
        </div>
      </div>

      {/* Provider Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Google Calendar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 transition-colors">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Google Calendar</h3>
              <p className="text-sm text-gray-600 mb-4">
                Google hesabınızla bağlanın ve takviminizi senkronize edin
              </p>
            </div>
            <Button
              onClick={handleGoogleConnect}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bağlanıyor...
                </>
              ) : (
                'Google ile Bağlan'
              )}
            </Button>
          </div>
        </div>

        {/* Outlook */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-50">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Microsoft Outlook</h3>
              <p className="text-sm text-gray-600 mb-4">
                Outlook takviminizi bağlayın (Yakında)
              </p>
            </div>
            <Button disabled className="w-full">
              Yakında
            </Button>
          </div>
        </div>

        {/* CalDAV */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-50">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">CalDAV</h3>
              <p className="text-sm text-gray-600 mb-4">
                CalDAV sunucunuzu bağlayın (Yakında)
              </p>
            </div>
            <Button disabled className="w-full">
              Yakında
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}


