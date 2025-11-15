import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  FolderKanban,
  Edit,
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: project, error } = await supabase
    .from('projects')
    .select('*, companies(id, name, industry)')
    .eq('id', id)
    .single()

  if (error || !project) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      testing: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Planlama',
      in_progress: 'Devam Ediyor',
      testing: 'Test Aşamasında',
      completed: 'Tamamlandı',
    }
    return labels[status] || status
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      implementation: 'Implementasyon',
      upgrade: 'Yükseltme',
      support: 'Destek',
    }
    return labels[type] || type
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-[var(--neutral-600)] mt-1">
              {project.companies && (project.companies as any).name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}
        >
          {getStatusLabel(project.status)}
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
          {getTypeLabel(project.type)}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
            <h2 className="text-xl font-semibold mb-4">Proje Bilgileri</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-[var(--neutral-600)] mb-1">Proje Adı</div>
                <div className="font-medium">{project.name}</div>
              </div>
              {project.description && (
                <div>
                  <div className="text-sm text-[var(--neutral-600)] mb-1">Açıklama</div>
                  <div className="text-[var(--neutral-700)]">{project.description}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-[var(--neutral-600)] mb-1">Durum</div>
                  <div className="font-medium">{getStatusLabel(project.status)}</div>
                </div>
                <div>
                  <div className="text-sm text-[var(--neutral-600)] mb-1">Proje Tipi</div>
                  <div className="font-medium">{getTypeLabel(project.type)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Zaman Çizelgesi
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-[var(--neutral-600)] mb-1">Başlangıç Tarihi</div>
                <div className="font-medium">{formatDate(project.start_date)}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--neutral-600)] mb-1">
                  Planlanan Go-Live Tarihi
                </div>
                <div className="font-medium">{formatDate(project.planned_go_live)}</div>
              </div>
              {project.actual_go_live && (
                <div>
                  <div className="text-sm text-[var(--neutral-600)] mb-1">
                    Gerçek Go-Live Tarihi
                  </div>
                  <div className="font-medium text-green-600">
                    {formatDate(project.actual_go_live)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Company Info */}
          {project.companies && (
            <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Firma
              </h2>
              <Link href={`/companies/${(project.companies as any).id}`}>
                <div className="text-[var(--brand-primary-500)] hover:underline font-medium">
                  {(project.companies as any).name}
                </div>
              </Link>
            </div>
          )}

          {/* Budget */}
          <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Bütçe
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-[var(--neutral-600)] mb-1">Tahmini Bütçe</div>
                <div className="font-medium text-lg">
                  {formatCurrency(project.estimated_budget)}
                </div>
              </div>
              {project.actual_cost && (
                <div>
                  <div className="text-sm text-[var(--neutral-600)] mb-1">Gerçek Maliyet</div>
                  <div className="font-medium text-lg">{formatCurrency(project.actual_cost)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              İlerleme
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--neutral-600)]">Tamamlanma</span>
                  <span className="font-medium">{project.completion_percentage || 0}%</span>
                </div>
                <div className="w-full bg-[var(--neutral-200)] rounded-full h-2">
                  <div
                    className="bg-[var(--brand-primary-500)] h-2 rounded-full transition-all"
                    style={{ width: `${project.completion_percentage || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}





