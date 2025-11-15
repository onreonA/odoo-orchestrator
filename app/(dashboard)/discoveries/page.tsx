import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default async function DiscoveriesPage() {
  const supabase = await createClient()

  // Get discoveries
  const { data: discoveries, error } = await supabase
    .from('discoveries')
    .select('*, projects(name), companies(name)')
    .order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      analyzing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discoveries</h1>
          <p className="text-[var(--neutral-600)] mt-1">Ön analiz toplantılarını görüntüleyin</p>
        </div>
        <Link href="/discoveries/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Discovery
          </Button>
        </Link>
      </div>

      {/* Discoveries List */}
      {error ? (
        <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4 text-[var(--error)]">
          Hata: {error.message}
        </div>
      ) : discoveries && discoveries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discoveries.map((discovery: any) => (
            <Link
              key={discovery.id}
              href={`/discoveries/${discovery.id}`}
              className="bg-white rounded-xl p-6 border border-[var(--neutral-200)] hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-[var(--brand-primary-50)]">
                  <Sparkles className="w-6 h-6 text-[var(--brand-primary-500)]" />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusColor(discovery.analysis_status)}`}
                >
                  {discovery.analysis_status}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {discovery.projects?.name || discovery.companies?.name || 'Discovery'}
              </h3>
              <p className="text-sm text-[var(--neutral-600)] mb-4">
                {discovery.meeting_date
                  ? new Date(discovery.meeting_date).toLocaleDateString('tr-TR')
                  : 'Tarih belirtilmemiş'}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--neutral-500)]">Tamamlanma</div>
                  <div className="text-lg font-bold">{discovery.completion_percentage || 0}%</div>
                </div>
                <div className="text-sm text-[var(--neutral-500)]">
                  {new Date(discovery.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-[var(--neutral-200)] text-center">
          <Sparkles className="w-16 h-16 text-[var(--neutral-300)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz discovery yok</h3>
          <p className="text-[var(--neutral-600)] mb-6">İlk discovery'nizi oluşturun</p>
          <Link href="/discoveries/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Discovery
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
