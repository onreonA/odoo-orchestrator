import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Clock, CheckCircle2 } from 'lucide-react'

export default async function DiscoveriesPage() {
  const supabase = await createClient()

  const { data: discoveries, error } = await supabase
    .from('discoveries')
    .select(
      `
      *,
      company:companies(id, name)
    `
    )
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discoveries</h1>
          <p className="text-gray-600 mt-1">Firma analiz toplantıları ve sonuçları</p>
        </div>
        <Link href="/discoveries/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Discovery
          </Button>
        </Link>
      </div>

      {/* Discoveries List */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          Hata: {error.message}
        </div>
      ) : discoveries && discoveries.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {discoveries.map(discovery => (
            <Link
              key={discovery.id}
              href={`/discoveries/${discovery.id}`}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    {discovery.company?.name || 'Firma'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {discovery.meeting_type || 'İlk Toplantı'} •{' '}
                    {new Date(discovery.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {discovery.analysis_status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : discovery.analysis_status === 'analyzing' ? (
                    <Clock className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-xs text-gray-500">
                    %{discovery.completion_percentage || 0}
                  </span>
                </div>
              </div>

              {discovery.transcript && (
                <div className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {discovery.transcript.substring(0, 200)}...
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {discovery.extracted_processes?.length || 0} Süreç
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz discovery yok</h3>
          <p className="text-gray-600 mb-6">İlk firma analizini başlatın</p>
          <Link href="/discoveries/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Discovery Başlat
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}




