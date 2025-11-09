import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Building2, Edit, Trash2, ArrowLeft, Phone, Mail, MapPin } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteCompanyButton } from '@/components/companies/delete-company-button'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !company) {
    notFound()
  }

  // Get projects for this company
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      discovery: 'bg-blue-100 text-blue-700',
      planning: 'bg-yellow-100 text-yellow-700',
      implementation: 'bg-purple-100 text-purple-700',
      live: 'bg-green-100 text-green-700',
      support: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getIndustryLabel = (industry: string) => {
    const labels: Record<string, string> = {
      furniture: 'Mobilya Üretim',
      defense: 'Savunma Sanayi',
      metal: 'Metal Sanayi',
      ecommerce: 'E-Ticaret',
      other: 'Diğer',
    }
    return labels[industry] || industry
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/companies">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <p className="text-[var(--neutral-600)] mt-1">{getIndustryLabel(company.industry)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/companies/${company.id}/edit`}>
            <Button variant="outline" leftIcon={<Edit />}>
              Düzenle
            </Button>
          </Link>
          <DeleteCompanyButton companyId={company.id} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[var(--neutral-200)]">
          <div className="text-sm text-[var(--neutral-600)]">Durum</div>
          <div
            className={`mt-1 inline-block px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(company.status)}`}
          >
            {company.status}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[var(--neutral-200)]">
          <div className="text-sm text-[var(--neutral-600)]">Sağlık Skoru</div>
          <div className="text-2xl font-bold mt-1">{company.health_score}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[var(--neutral-200)]">
          <div className="text-sm text-[var(--neutral-600)]">Projeler</div>
          <div className="text-2xl font-bold mt-1">{projects?.length || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[var(--neutral-200)]">
          <div className="text-sm text-[var(--neutral-600)]">Oluşturulma</div>
          <div className="text-sm font-medium mt-1">
            {new Date(company.created_at).toLocaleDateString('tr-TR')}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
            <h2 className="text-xl font-semibold mb-4">Firma Bilgileri</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-[var(--neutral-600)]">Firma Adı</div>
                <div className="font-medium">{company.name}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--neutral-600)]">Sektör</div>
                <div className="font-medium">{getIndustryLabel(company.industry)}</div>
              </div>
              {company.size && (
                <div>
                  <div className="text-sm text-[var(--neutral-600)]">Büyüklük</div>
                  <div className="font-medium">{company.size}</div>
                </div>
              )}
              {company.odoo_instance_url && (
                <div>
                  <div className="text-sm text-[var(--neutral-600)]">Odoo Instance</div>
                  <a
                    href={company.odoo_instance_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--brand-primary-500)] hover:underline"
                  >
                    {company.odoo_instance_url}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Projeler</h2>
              <Button size="sm">Yeni Proje</Button>
            </div>
            {projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project: any) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg border border-[var(--neutral-200)] hover:bg-[var(--neutral-50)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-[var(--neutral-600)]">
                          {project.type} • {project.status}
                        </div>
                      </div>
                      <div className="text-sm text-[var(--neutral-600)]">
                        %{project.completion_percentage}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--neutral-600)]">Henüz proje yok</div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
            <h2 className="text-xl font-semibold mb-4">İletişim</h2>
            <div className="space-y-3">
              {company.contact_person && (
                <div className="flex items-start gap-2">
                  <Building2 className="w-5 h-5 text-[var(--neutral-400)] mt-0.5" />
                  <div>
                    <div className="text-sm text-[var(--neutral-600)]">İletişim Kişisi</div>
                    <div className="font-medium">{company.contact_person}</div>
                  </div>
                </div>
              )}
              {company.contact_email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-5 h-5 text-[var(--neutral-400)] mt-0.5" />
                  <div>
                    <div className="text-sm text-[var(--neutral-600)]">Email</div>
                    <a
                      href={`mailto:${company.contact_email}`}
                      className="text-[var(--brand-primary-500)] hover:underline"
                    >
                      {company.contact_email}
                    </a>
                  </div>
                </div>
              )}
              {company.contact_phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-5 h-5 text-[var(--neutral-400)] mt-0.5" />
                  <div>
                    <div className="text-sm text-[var(--neutral-600)]">Telefon</div>
                    <a
                      href={`tel:${company.contact_phone}`}
                      className="text-[var(--brand-primary-500)] hover:underline"
                    >
                      {company.contact_phone}
                    </a>
                  </div>
                </div>
              )}
              {company.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-[var(--neutral-400)] mt-0.5" />
                  <div>
                    <div className="text-sm text-[var(--neutral-600)]">Adres</div>
                    <div className="text-sm">{company.address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
            <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                Discovery Başlat
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Proje Oluştur
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Excel Import
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Rapor Oluştur
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
