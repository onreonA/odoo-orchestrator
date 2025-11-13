import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw, Trash2, Settings, Calendar as CalendarIcon } from 'lucide-react'
import { CalendarSyncService } from '@/lib/services/calendar-sync-service'
import { SyncDetailActions } from '@/components/calendar/sync-detail-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SyncDetailPage({ params }: PageProps) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const { data: sync, error } = await CalendarSyncService.getSyncById(id)

  if (error || !sync) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Senkronizasyon bağlantısı bulunamadı.</p>
          <Link href="/calendar/syncs" className="mt-4 inline-block">
            <Button variant="outline">Geri Dön</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check ownership
  if (sync.user_id !== user.id) {
    redirect('/calendar/syncs')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/calendar/syncs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{sync.name}</h1>
            <p className="text-gray-600 mt-1">
              {sync.provider === 'google' && 'Google Calendar'}
              {sync.provider === 'outlook' && 'Microsoft Outlook'}
              {sync.provider === 'caldav' && 'CalDAV'}
              {sync.provider === 'custom' && 'Custom API'}
            </p>
          </div>
        </div>
        <SyncDetailActions syncId={sync.id} />
      </div>

      {/* Sync Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Status */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Durum</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Durum</label>
              <div className="mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    sync.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : sync.status === 'syncing'
                        ? 'bg-blue-100 text-blue-800'
                        : sync.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {sync.status === 'active' && 'Aktif'}
                  {sync.status === 'syncing' && 'Senkronize Ediliyor'}
                  {sync.status === 'error' && 'Hata'}
                  {sync.status === 'paused' && 'Duraklatıldı'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Senkronizasyon Yönü</label>
              <div className="mt-1 font-medium">
                {sync.sync_direction === 'bidirectional' && 'İki Yönlü'}
                {sync.sync_direction === 'one_way_in' && 'Dış → Platform'}
                {sync.sync_direction === 'one_way_out' && 'Platform → Dış'}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Info */}
        {sync.external_calendar_name && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Takvim Bilgileri</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Takvim:</span>
                <span className="font-medium">{sync.external_calendar_name}</span>
              </div>
              {sync.external_calendar_id && (
                <div className="text-xs text-gray-500 ml-6">ID: {sync.external_calendar_id}</div>
              )}
            </div>
          </div>
        )}

        {/* Last Sync */}
        {sync.last_sync_at && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Son Senkronizasyon</h2>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600">Tarih</label>
                <div className="mt-1 font-medium">
                  {new Date(sync.last_sync_at).toLocaleString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {sync.last_sync_status && (
                <div>
                  <label className="text-sm text-gray-600">Durum</label>
                  <div className="mt-1">
                    <span
                      className={`font-medium ${
                        sync.last_sync_status === 'success'
                          ? 'text-green-600'
                          : sync.last_sync_status === 'failed'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {sync.last_sync_status === 'success' && 'Başarılı'}
                      {sync.last_sync_status === 'failed' && 'Başarısız'}
                      {sync.last_sync_status === 'partial' && 'Kısmi'}
                    </span>
                  </div>
                </div>
              )}
              {sync.last_sync_error && (
                <div>
                  <label className="text-sm text-gray-600">Hata</label>
                  <div className="mt-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    {sync.last_sync_error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
