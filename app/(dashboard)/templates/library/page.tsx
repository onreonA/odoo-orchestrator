import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Package, Search, Filter, Eye, Download, Star } from 'lucide-react'
import Link from 'next/link'

export default async function TemplateLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; industry?: string; search?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Get templates
  let query = supabase.from('template_library').select('*').eq('status', 'published')

  if (params.type) {
    query = query.eq('type', params.type)
  }

  if (params.industry) {
    query = query.eq('industry', params.industry)
  }

  const { data: templates, error } = await query.order('created_at', { ascending: false })

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      kickoff: 'Kick-off',
      bom: 'BOM',
      workflow: 'Workflow',
      dashboard: 'Dashboard',
      configuration: 'Konfigürasyon',
      report: 'Rapor',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      kickoff: 'bg-blue-100 text-blue-700',
      bom: 'bg-green-100 text-green-700',
      workflow: 'bg-purple-100 text-purple-700',
      dashboard: 'bg-orange-100 text-orange-700',
      configuration: 'bg-pink-100 text-pink-700',
      report: 'bg-gray-100 text-gray-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const getIndustryLabel = (industry: string) => {
    const labels: Record<string, string> = {
      furniture: 'Mobilya',
      manufacturing: 'Üretim',
      service: 'Hizmet',
      metal: 'Metal',
      defense: 'Savunma',
    }
    return labels[industry] || industry
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Library</h1>
          <p className="text-[var(--neutral-600)] mt-1">Hazır template'leri keşfedin ve kullanın</p>
        </div>
        <Link href="/templates/library/new">
          <Button size="lg">
            <Package className="w-4 h-4 mr-2" />
            Yeni Template Oluştur
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-[var(--neutral-200)]">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--neutral-400)]" />
            <input
              type="text"
              placeholder="Template ara..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            />
          </div>
          <select className="px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]">
            <option value="">Tüm Tipler</option>
            <option value="kickoff">Kick-off</option>
            <option value="bom">BOM</option>
            <option value="workflow">Workflow</option>
            <option value="dashboard">Dashboard</option>
          </select>
          <select className="px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]">
            <option value="">Tüm Sektörler</option>
            <option value="furniture">Mobilya</option>
            <option value="manufacturing">Üretim</option>
            <option value="service">Hizmet</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {error ? (
        <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4 text-[var(--error)]">
          Hata: {error.message}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template: any) => (
            <div
              key={template.id}
              className="bg-white rounded-xl p-6 border border-[var(--neutral-200)] hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-[var(--brand-primary-50)]">
                  <Package className="w-6 h-6 text-[var(--brand-primary-500)]" />
                </div>
                <div className="flex items-center gap-2">
                  {template.is_featured && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Öne Çıkan
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(template.type)}`}>
                    {getTypeLabel(template.type)}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
              <p className="text-sm text-[var(--neutral-600)] mb-4 line-clamp-2">
                {template.description || 'Açıklama yok'}
              </p>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--neutral-100)] text-[var(--neutral-600)]">
                  {getIndustryLabel(template.industry)}
                </span>
                {template.tags &&
                  template.tags.slice(0, 2).map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-[var(--neutral-100)] text-[var(--neutral-600)]"
                    >
                      {tag}
                    </span>
                  ))}
              </div>

              <div className="flex items-center justify-between text-sm text-[var(--neutral-500)] mb-4">
                <div>
                  <div className="font-medium text-[var(--neutral-700)]">
                    {template.estimated_duration || '-'} gün
                  </div>
                  <div className="text-xs">Tahmini süre</div>
                </div>
                <div>
                  <div className="font-medium text-[var(--neutral-700)]">
                    {template.usage_count || 0} kullanım
                  </div>
                  <div className="text-xs">Kullanım sayısı</div>
                </div>
                {template.rating && (
                  <div>
                    <div className="font-medium text-[var(--neutral-700)] flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {template.rating.toFixed(1)}
                    </div>
                    <div className="text-xs">Değerlendirme</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Link href={`/templates/library/${template.template_id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Önizle
                  </Button>
                </Link>
                <Button variant="default" className="flex-1" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Kullan
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-[var(--neutral-200)] text-center">
          <Package className="w-16 h-16 text-[var(--neutral-300)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz template yok</h3>
          <p className="text-[var(--neutral-600)] mb-6">
            İlk template'inizi oluşturarak başlayın veya seed script'i çalıştırın
          </p>
          <Link href="/templates/library/new">
            <Button>
              <Package className="w-4 h-4 mr-2" />
              Yeni Template Oluştur
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

