import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, CheckSquare } from 'lucide-react'
import Link from 'next/link'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ company_id?: string; project_id?: string; status?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Get user profile to get company_id
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Kullanıcı bulunamadı</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const companyId = (params.company_id as string) || profile?.company_id || ''
  const projectId = (params.project_id as string) || undefined
  const status = (params.status as string) || undefined

  // Build query
  let query = supabase.from('tasks').select('*')

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data: tasks, error } = await query.order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      approved: 'bg-purple-100 text-purple-700',
      rejected: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    }
    return colors[priority] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Görevler</h1>
          <p className="text-[var(--neutral-600)] mt-1">Tüm görevleri görüntüleyin ve yönetin</p>
        </div>
        <Link href="/tasks/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Görev Ekle
          </Button>
        </Link>
      </div>

      {/* Tasks List */}
      {error ? (
        <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4 text-[var(--error)]">
          Hata: {error.message}
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task: any) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="bg-white rounded-xl p-6 border border-[var(--neutral-200)] hover:shadow-lg transition-all hover:-translate-y-1 block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--brand-primary-50)]">
                    <CheckSquare className="w-5 h-5 text-[var(--brand-primary-500)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{task.title}</h3>
                    <p className="text-sm text-[var(--neutral-600)]">{task.description || 'Açıklama yok'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority || 'medium')}`}>
                    {task.priority || 'medium'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-[var(--neutral-500)]">
                <div>
                  {task.due_date && (
                    <span>Bitiş: {new Date(task.due_date).toLocaleDateString('tr-TR')}</span>
                  )}
                </div>
                <div>{new Date(task.created_at).toLocaleDateString('tr-TR')}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-[var(--neutral-200)] text-center">
          <CheckSquare className="w-16 h-16 text-[var(--neutral-300)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz görev yok</h3>
          <p className="text-[var(--neutral-600)] mb-6">İlk görevinizi ekleyerek başlayın</p>
          <Link href="/tasks/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Görev Ekle
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

