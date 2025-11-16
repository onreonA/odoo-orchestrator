import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Package, ArrowLeft, GitBranch, Clock, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VersionHistory } from '@/components/templates/version-history'
import { VersionComparison } from '@/components/templates/version-comparison'
import { ChangelogView } from '@/components/templates/changelog-view'

export default async function TemplateVersionsPage({
  params,
}: {
  params: Promise<{ template_id: string }>
}) {
  const supabase = await createClient()
  const { template_id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Check if user can create versions (super_admin or consultant)
  const canCreateVersions = profile?.role === 'super_admin' || profile?.role === 'consultant'

  // Get template
  const { data: template, error } = await supabase
    .from('template_library')
    .select('*')
    .eq('template_id', template_id)
    .single()

  if (error || !template) {
    notFound()
  }

  // Get template versions
  const { data: versions } = await supabase
    .from('template_versions')
    .select(
      `
      *,
      created_by_user:profiles!template_versions_created_by_fkey(id, full_name, email)
    `
    )
    .eq('template_id', template_id)
    .order('created_at', { ascending: false })

  // Get current version
  const currentVersion = versions?.find(v => v.is_current) || versions?.[0]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/templates/library/${template_id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitBranch className="w-8 h-8" />
            Template Versiyonları
          </h1>
          <p className="text-gray-600 mt-1">{template.name} - Versiyon geçmişi ve yönetimi</p>
        </div>
        {canCreateVersions && (
          <Link href={`/templates/library/${template_id}/versions/new`}>
            <Button>
              <GitBranch className="w-4 h-4 mr-2" />
              Yeni Versiyon Oluştur
            </Button>
          </Link>
        )}
      </div>

      {/* Current Version Info */}
      {currentVersion && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-blue-700">Aktif Versiyon</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold">
                  v{currentVersion.version}
                </span>
              </div>
              <div className="text-sm text-blue-600">
                {currentVersion.changelog || 'Changelog bilgisi yok'}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-blue-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(currentVersion.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                {currentVersion.created_by_user && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {currentVersion.created_by_user.full_name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History */}
      <VersionHistory
        templateId={template_id}
        versions={versions || []}
        canCreateVersions={canCreateVersions || false}
      />

      {/* Changelog View */}
      {versions && versions.length > 0 && (
        <ChangelogView templateId={template_id} versions={versions} />
      )}

      {/* Version Comparison */}
      {versions && versions.length > 1 && (
        <VersionComparison templateId={template_id} versions={versions} />
      )}
    </div>
  )
}
