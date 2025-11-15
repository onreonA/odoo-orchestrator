import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Package,
  ArrowLeft,
  Download,
  Eye,
  Star,
  Calendar,
  Users,
  Tag,
  CheckCircle,
  Edit,
  GitBranch,
  MessageSquare,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ template_id: string }>
}) {
  const supabase = await createClient()
  const { template_id } = await params

  // Get template
  const { data: template, error } = await supabase
    .from('template_library')
    .select('*')
    .eq('template_id', template_id)
    .eq('status', 'published')
    .single()

  if (error || !template) {
    notFound()
  }

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

  const structure = template.structure as any

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/templates/library">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Template Library'ye Dön
        </Button>
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-lg bg-[var(--brand-primary-50)]">
              <Package className="w-8 h-8 text-[var(--brand-primary-500)]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{template.name}</h1>
                {template.is_featured && (
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Öne Çıkan
                  </span>
                )}
              </div>
              <p className="text-[var(--neutral-600)] text-lg">{template.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="lg">
              <Eye className="w-4 h-4 mr-2" />
              Önizle
            </Button>
            <Link href={`/templates/library/${template.template_id}/customize`}>
              <Button variant="outline" size="lg">
                <Edit className="w-4 h-4 mr-2" />
                Özelleştir
              </Button>
            </Link>
            <Link href={`/templates/library/${template.template_id}/versions`}>
              <Button variant="outline" size="lg">
                <GitBranch className="w-4 h-4 mr-2" />
                Versiyonlar
              </Button>
            </Link>
            <Link href={`/templates/library/${template.template_id}/apply`}>
              <Button size="lg">
                <Download className="w-4 h-4 mr-2" />
                Template'i Kullan
              </Button>
            </Link>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--neutral-200)]">
          <div>
            <div className="text-sm text-[var(--neutral-500)] mb-1">Tip</div>
            <div className="font-semibold">{getTypeLabel(template.type)}</div>
          </div>
          <div>
            <div className="text-sm text-[var(--neutral-500)] mb-1">Sektör</div>
            <div className="font-semibold">{getIndustryLabel(template.industry)}</div>
          </div>
          <div>
            <div className="text-sm text-[var(--neutral-500)] mb-1">Tahmini Süre</div>
            <div className="font-semibold">{template.estimated_duration || '-'} gün</div>
          </div>
          <div>
            <div className="text-sm text-[var(--neutral-500)] mb-1">Kullanım</div>
            <div className="font-semibold">{template.usage_count || 0} kez</div>
          </div>
        </div>
      </div>

      {/* Features */}
      {template.features && template.features.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
          <h2 className="text-xl font-semibold mb-4">Özellikler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {template.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-[var(--neutral-700)]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modules */}
      {structure?.modules && structure.modules.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
          <h2 className="text-xl font-semibold mb-4">Modüller</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {structure.modules.map((module: any, index: number) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-[var(--neutral-50)] border border-[var(--neutral-200)]"
              >
                <div className="font-medium text-[var(--neutral-700)]">{module.name}</div>
                {module.category && (
                  <div className="text-sm text-[var(--neutral-500)] mt-1">{module.category}</div>
                )}
                {module.priority && (
                  <div className="text-xs text-[var(--neutral-400)] mt-1">
                    Öncelik: {module.priority} | Faz: {module.phase || '-'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Departments */}
      {structure?.departments && structure.departments.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
          <h2 className="text-xl font-semibold mb-4">Departmanlar</h2>
          <div className="space-y-4">
            {structure.departments.map((dept: any, index: number) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-[var(--neutral-50)] border border-[var(--neutral-200)]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-[var(--neutral-700)]">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-sm text-[var(--neutral-600)] mt-1">{dept.description}</p>
                    )}
                  </div>
                  {dept.manager_role_title && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {dept.manager_role_title}
                    </span>
                  )}
                </div>
                {dept.tasks && dept.tasks.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-[var(--neutral-600)] mb-2">
                      {dept.tasks.length} görev
                    </div>
                    <div className="space-y-1">
                      {dept.tasks.slice(0, 3).map((task: any, taskIndex: number) => (
                        <div key={taskIndex} className="text-sm text-[var(--neutral-600)]">
                          • {task.title}
                        </div>
                      ))}
                      {dept.tasks.length > 3 && (
                        <div className="text-sm text-[var(--neutral-500)]">
                          +{dept.tasks.length - 3} görev daha
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Timeline */}
      {structure?.project_timeline && structure.project_timeline.phases && (
        <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
          <h2 className="text-xl font-semibold mb-4">Proje Takvimi</h2>
          <div className="space-y-4">
            {structure.project_timeline.phases.map((phase: any, index: number) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-[var(--neutral-50)] border border-[var(--neutral-200)]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-[var(--neutral-700)]">{phase.name}</h3>
                    {phase.description && (
                      <p className="text-sm text-[var(--neutral-600)] mt-1">{phase.description}</p>
                    )}
                  </div>
                  {phase.duration_weeks && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                      {phase.duration_weeks} hafta
                    </span>
                  )}
                </div>
                {phase.milestones && phase.milestones.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-[var(--neutral-600)] mb-2">
                      Milestone'lar
                    </div>
                    <div className="space-y-2">
                      {phase.milestones.map((milestone: any, mIndex: number) => (
                        <div key={mIndex} className="text-sm text-[var(--neutral-600)]">
                          <div className="font-medium">{milestone.title}</div>
                          {milestone.description && (
                            <div className="text-xs text-[var(--neutral-500)] mt-1">
                              {milestone.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
          <h2 className="text-xl font-semibold mb-4">Etiketler</h2>
          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full bg-[var(--neutral-100)] text-[var(--neutral-600)] text-sm flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Requirements */}
      <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
        <h2 className="text-xl font-semibold mb-4">Gereksinimler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {template.required_odoo_version && (
            <div>
              <div className="text-sm text-[var(--neutral-500)] mb-1">Odoo Versiyonu</div>
              <div className="font-semibold">{template.required_odoo_version}</div>
            </div>
          )}
          {template.required_odoo_modules && template.required_odoo_modules.length > 0 && (
            <div>
              <div className="text-sm text-[var(--neutral-500)] mb-1">Gerekli Modüller</div>
              <div className="font-semibold">{template.required_odoo_modules.length} modül</div>
            </div>
          )}
          {template.estimated_cost_min && template.estimated_cost_max && (
            <div>
              <div className="text-sm text-[var(--neutral-500)] mb-1">Tahmini Maliyet</div>
              <div className="font-semibold">
                {template.estimated_cost_min.toLocaleString('tr-TR')} -{' '}
                {template.estimated_cost_max.toLocaleString('tr-TR')} {template.currency || 'TRY'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`/templates/library/${template.template_id}/feedback`}>
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-50">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="font-semibold">Feedback</div>
                <div className="text-sm text-gray-500">Görüşlerinizi paylaşın</div>
              </div>
            </div>
          </div>
        </Link>

        <Link href={`/templates/library/${template.template_id}/analytics`}>
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-50">
                <BarChart3 className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <div className="font-semibold">Analytics</div>
                <div className="text-sm text-gray-500">İstatistikleri görüntüleyin</div>
              </div>
            </div>
          </div>
        </Link>

        <Link href={`/templates/library/${template.template_id}/evolution`}>
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-50">
                <Sparkles className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="font-semibold">Evolution</div>
                <div className="text-sm text-gray-500">İyileştirme önerileri</div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[var(--brand-primary-500)] to-[var(--brand-primary-600)] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Bu template'i kullanmaya hazır mısınız?</h3>
            <p className="text-white/90">
              Template'i bir projeye uygulayarak başlayın ve hızlıca Odoo kurulumunu tamamlayın.
            </p>
          </div>
          <Link href={`/templates/library/${template.template_id}/apply`}>
            <Button size="lg" variant="secondary">
              <Download className="w-4 h-4 mr-2" />
              Template'i Kullan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
