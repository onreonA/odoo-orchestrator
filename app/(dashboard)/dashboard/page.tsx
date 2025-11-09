import { createClient } from '@/lib/supabase/server'
import { Building2, FolderKanban, Headphones, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get statistics
  const { count: companiesCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })

  const { count: ticketsCount } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  const stats = [
    {
      label: 'Toplam Firma',
      value: companiesCount || 0,
      icon: Building2,
      color: 'blue',
    },
    {
      label: 'Aktif Proje',
      value: projectsCount || 0,
      icon: FolderKanban,
      color: 'purple',
    },
    {
      label: 'Açık Destek Talebi',
      value: ticketsCount || 0,
      icon: Headphones,
      color: 'orange',
    },
    {
      label: 'Sağlık Skoru (Ortalama)',
      value: '92',
      icon: TrendingUp,
      color: 'green',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Hoş geldiniz! İşte genel bakışınız.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Icon className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors">
            <div className="font-medium">Yeni Firma Ekle</div>
            <div className="text-sm text-gray-600 mt-1">Yeni bir müşteri firması ekleyin</div>
          </button>
          <button className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors">
            <div className="font-medium">Discovery Başlat</div>
            <div className="text-sm text-gray-600 mt-1">Firma analizi için toplantı planlayın</div>
          </button>
          <button className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors">
            <div className="font-medium">Rapor Oluştur</div>
            <div className="text-sm text-gray-600 mt-1">Proje ilerleme raporu oluşturun</div>
          </button>
        </div>
      </div>
    </div>
  )
}
