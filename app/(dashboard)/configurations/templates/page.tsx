import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Layers } from 'lucide-react'
import Link from 'next/link'

export default async function ConfigurationTemplatesPage() {
  const supabase = await createClient()

  // Get configuration templates
  const { data: templates, error } = await supabase
    .from('configuration_templates')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Konfigürasyon Şablonları</h1>
          <p className="text-[var(--neutral-600)] mt-1">Odoo konfigürasyon şablonlarını yönetin</p>
        </div>
        <Button size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Şablon Ekle
        </Button>
      </div>

      {/* Templates List */}
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
                  <Layers className="w-6 h-6 text-[var(--brand-primary-500)]" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--neutral-100)] text-[var(--neutral-600)]">
                  {template.category || 'general'}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
              <p className="text-sm text-[var(--neutral-600)] mb-4">
                {template.description || 'Açıklama yok'}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--neutral-500)]">Kategori</div>
                  <div className="text-sm font-medium">{template.category || '-'}</div>
                </div>
                <div className="text-sm text-[var(--neutral-500)]">
                  {new Date(template.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-[var(--neutral-200)] text-center">
          <Layers className="w-16 h-16 text-[var(--neutral-300)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz şablon yok</h3>
          <p className="text-[var(--neutral-600)] mb-6">
            İlk konfigürasyon şablonunuzu ekleyerek başlayın
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Şablon Ekle
          </Button>
        </div>
      )}
    </div>
  )
}
