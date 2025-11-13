import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Calendar as CalendarIcon, RefreshCw, Trash2, AlertCircle } from 'lucide-react'
import { CalendarSyncService } from '@/lib/services/calendar-sync-service'

export default async function CalendarSyncsPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get syncs
  const { data: syncs } = await CalendarSyncService.getSyncs(user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Takvim Senkronizasyonları</h1>
          <p className="text-gray-600 mt-1">Dış takvimlerinizi bağlayın ve senkronize edin</p>
        </div>
        <Link href="/calendar/syncs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Bağlantı
          </Button>
        </Link>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Desteklenen Takvimler:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Google Calendar:</strong> OAuth ile bağlanın
              </li>
              <li>
                <strong>Microsoft Outlook:</strong> Microsoft Graph API ile bağlanın
              </li>
              <li>
                <strong>CalDAV:</strong> Standart protokol ile bağlanın
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Syncs List */}
      {syncs && syncs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {syncs.map(sync => (
            <div key={sync.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{sync.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {sync.provider === 'google' && 'Google Calendar'}
                    {sync.provider === 'outlook' && 'Microsoft Outlook'}
                    {sync.provider === 'caldav' && 'CalDAV'}
                    {sync.provider === 'custom' && 'Custom API'}
                  </p>
                  {sync.external_calendar_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Takvim: {sync.external_calendar_name}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
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

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Senkronizasyon:</span>
                  <span className="font-medium">
                    {sync.sync_direction === 'bidirectional' && 'İki Yönlü'}
                    {sync.sync_direction === 'one_way_in' && 'Dış → Platform'}
                    {sync.sync_direction === 'one_way_out' && 'Platform → Dış'}
                  </span>
                </div>
                {sync.last_sync_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Son Senkronizasyon:</span>
                    <span className="font-medium">
                      {new Date(sync.last_sync_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {sync.last_sync_status && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Durum:</span>
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
                )}
              </div>

              {sync.last_sync_error && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <p className="text-xs text-red-600">{sync.last_sync_error}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <Link href={`/calendar/syncs/${sync.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Detaylar
                  </Button>
                </Link>
                <form
                  action={`/api/calendar/syncs/${sync.id}/sync`}
                  method="POST"
                  className="flex-1"
                >
                  <Button type="submit" variant="outline" size="sm" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Senkronize Et
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz takvim bağlantısı yok</h3>
          <p className="text-gray-600 mb-6">
            Google Calendar, Outlook veya diğer takvimlerinizi bağlayarak senkronize edin
          </p>
          <Link href="/calendar/syncs/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              İlk Bağlantıyı Oluştur
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
