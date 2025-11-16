import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, FolderKanban } from 'lucide-react'
import Link from 'next/link'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Kullanıcı bulunamadı</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()
  const companyId = profile?.company_id

  let query = supabase.from('projects').select('*')

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data: projects, error } = await query.order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projeler</h1>
          <p className="text-[var(--neutral-600)] mt-1">Firma projelerini yönetin</p>
        </div>
        <Link href="/projects/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Proje
          </Button>
        </Link>
      </div>

      {/* Projects List */}
      {error ? (
        <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4 text-[var(--error)]">
          Hata: {error.message}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-white rounded-xl p-6 border border-[var(--neutral-200)] hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-[var(--brand-primary-50)]">
                  <FolderKanban className="w-6 h-6 text-[var(--brand-primary-500)]" />
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}
                >
                  {project.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
              <p className="text-sm text-[var(--neutral-600)] mb-4">
                {project.description || 'Açıklama yok'}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--neutral-500)]">İlerleme</div>
                  <div className="text-sm font-medium">{project.progress_percentage || 0}%</div>
                </div>
                <div className="text-sm text-[var(--neutral-500)]">
                  {new Date(project.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-[var(--neutral-200)] text-center">
          <FolderKanban className="w-16 h-16 text-[var(--neutral-300)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz proje yok</h3>
          <p className="text-[var(--neutral-600)] mb-6">İlk projenizi oluşturarak başlayın</p>
          <Link href="/projects/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Proje
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
