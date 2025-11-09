import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function CompaniesPage() {
  const supabase = await createClient()

  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Firmalar</h1>
          <p className="text-[var(--neutral-600)] mt-1">Tüm müşteri firmalarınızı yönetin</p>
        </div>
        <Link href="/companies/new">
          <Button size="lg" leftIcon={<Plus />}>
            Yeni Firma Ekle
          </Button>
        </Link>
      </div>

      {/* Companies List */}
      {error ? (
        <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4 text-[var(--error)]">
          Hata: {error.message}
        </div>
      ) : companies && companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company: any) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="bg-white rounded-xl p-6 border border-[var(--neutral-200)] hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-[var(--brand-primary-50)]">
                  <Building2 className="w-6 h-6 text-[var(--brand-primary-500)]" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--neutral-100)] text-[var(--neutral-600)]">
                  {company.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{company.name}</h3>
              <p className="text-sm text-[var(--neutral-600)] mb-4">{company.industry}</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--neutral-500)]">Sağlık Skoru</div>
                  <div className="text-lg font-bold">{company.health_score}</div>
                </div>
                <div className="text-sm text-[var(--neutral-500)]">
                  {new Date(company.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-[var(--neutral-200)] text-center">
          <Building2 className="w-16 h-16 text-[var(--neutral-300)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz firma yok</h3>
          <p className="text-[var(--neutral-600)] mb-6">İlk müşteri firmanızı ekleyerek başlayın</p>
          <Link href="/companies/new">
            <Button leftIcon={<Plus />}>Yeni Firma Ekle</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
