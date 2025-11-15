'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewTaskPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string; company_id: string }>>(
    []
  )
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string; company_id: string }>
  >([])
  const [users, setUsers] = useState<Array<{ id: string; full_name?: string; email: string }>>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'kickoff_task' as
      | 'kickoff_task'
      | 'document_task'
      | 'data_task'
      | 'training_task'
      | 'other',
    company_id: searchParams.get('company_id') || '',
    project_id: searchParams.get('project_id') || '',
    assigned_to: '',
    assigned_department_id: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id, role')
          .eq('id', user.id)
          .single()

        // Load companies
        const companiesQuery =
          profile?.role === 'super_admin'
            ? supabase.from('companies').select('id, name').order('name')
            : profile?.company_id
              ? supabase.from('companies').select('id, name').eq('id', profile.company_id)
              : null

        if (companiesQuery) {
          const { data: companiesData } = await companiesQuery
          if (companiesData) {
            setCompanies(companiesData)
            const defaultCompanyId = formData.company_id || companiesData[0]?.id || ''
            if (defaultCompanyId) {
              setFormData(prev => ({ ...prev, company_id: defaultCompanyId }))
            }
          }
        }

        // Load projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name, company_id')
          .order('name')
        if (projectsData) {
          setProjects(projectsData)
        }

        // Load departments
        const { data: departmentsData } = await supabase
          .from('departments')
          .select('id, name, company_id')
          .order('name')
        if (departmentsData) {
          setDepartments(departmentsData)
        }

        // Load users
        const usersQuery = profile?.company_id
          ? supabase
              .from('profiles')
              .select('id, full_name, email')
              .eq('company_id', profile.company_id)
          : supabase.from('profiles').select('id, full_name, email').limit(100)

        const { data: usersData } = await usersQuery
        if (usersData) {
          setUsers(usersData)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }

    loadData()
  }, [router, searchParams])

  // Filter projects and departments when company changes
  useEffect(() => {
    if (formData.company_id) {
      const filteredProjects = projects.filter(p => p.company_id === formData.company_id)
      const filteredDepartments = departments.filter(d => d.company_id === formData.company_id)

      // Reset selections if current selections are not valid
      if (formData.project_id && !filteredProjects.find(p => p.id === formData.project_id)) {
        setFormData(prev => ({ ...prev, project_id: '' }))
      }
      if (
        formData.assigned_department_id &&
        !filteredDepartments.find(d => d.id === formData.assigned_department_id)
      ) {
        setFormData(prev => ({ ...prev, assigned_department_id: '' }))
      }
    }
  }, [formData.company_id, projects, departments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Validate
      if (!formData.title.trim()) {
        setError('Görev başlığı gereklidir')
        setLoading(false)
        return
      }

      if (!formData.company_id) {
        setError('Firma seçilmelidir')
        setLoading(false)
        return
      }

      // Create task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
          company_id: formData.company_id,
          project_id: formData.project_id || null,
          assigned_to: formData.assigned_to || null,
          assigned_department_id: formData.assigned_department_id || null,
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date || null,
        })
        .select()
        .single()

      if (taskError) {
        setError(taskError.message)
        setLoading(false)
        return
      }

      // Redirect to task detail page
      router.push(`/tasks/${task.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary-500)]" />
        </div>
      </div>
    )
  }

  const filteredProjects = formData.company_id
    ? projects.filter(p => p.company_id === formData.company_id)
    : []
  const filteredDepartments = formData.company_id
    ? departments.filter(d => d.company_id === formData.company_id)
    : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Görev Ekle</h1>
          <p className="text-[var(--neutral-600)] mt-1">Yeni bir görev oluşturun</p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 border border-[var(--neutral-200)] space-y-6"
      >
        {error && (
          <div className="rounded-lg bg-[var(--error)]/10 border border-[var(--error)] p-3 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Temel Bilgiler</h2>

          <div>
            <label htmlFor="company_id" className="block text-sm font-medium mb-1">
              Firma <span className="text-[var(--error)]">*</span>
            </label>
            <select
              id="company_id"
              value={formData.company_id}
              onChange={e => setFormData({ ...formData, company_id: e.target.value })}
              required
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            >
              <option value="">Seçiniz</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Görev Başlığı <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              placeholder="Örn: Ürün listesi hazırlama"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Açıklama
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              placeholder="Görev detayları"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">
                Görev Tipi
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={e =>
                  setFormData({ ...formData, type: e.target.value as typeof formData.type })
                }
                className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              >
                <option value="kickoff_task">Kick-off Görevi</option>
                <option value="document_task">Doküman Görevi</option>
                <option value="data_task">Veri Görevi</option>
                <option value="training_task">Eğitim Görevi</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div>
              <label htmlFor="project_id" className="block text-sm font-medium mb-1">
                Proje
              </label>
              <select
                id="project_id"
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                disabled={!formData.company_id}
                className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)] disabled:opacity-50"
              >
                <option value="">Seçiniz (Opsiyonel)</option>
                {filteredProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Assignment */}
        <div className="space-y-4 border-t border-[var(--neutral-200)] pt-6">
          <h2 className="text-xl font-semibold">Atama</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium mb-1">
                Kullanıcıya Ata
              </label>
              <select
                id="assigned_to"
                value={formData.assigned_to}
                onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              >
                <option value="">Seçiniz (Opsiyonel)</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assigned_department_id" className="block text-sm font-medium mb-1">
                Departmana Ata
              </label>
              <select
                id="assigned_department_id"
                value={formData.assigned_department_id}
                onChange={e => setFormData({ ...formData, assigned_department_id: e.target.value })}
                disabled={!formData.company_id}
                className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)] disabled:opacity-50"
              >
                <option value="">Seçiniz (Opsiyonel)</option>
                {filteredDepartments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status & Priority */}
        <div className="space-y-4 border-t border-[var(--neutral-200)] pt-6">
          <h2 className="text-xl font-semibold">Durum ve Öncelik</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Durum
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={e =>
                  setFormData({ ...formData, status: e.target.value as typeof formData.status })
                }
                className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              >
                <option value="pending">Beklemede</option>
                <option value="in_progress">Devam Ediyor</option>
                <option value="completed">Tamamlandı</option>
                <option value="approved">Onaylandı</option>
                <option value="rejected">Reddedildi</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-1">
                Öncelik
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={e =>
                  setFormData({ ...formData, priority: e.target.value as typeof formData.priority })
                }
                className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
                <option value="urgent">Acil</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium mb-1">
              Bitiş Tarihi
            </label>
            <input
              id="due_date"
              type="datetime-local"
              value={formData.due_date}
              onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 border-t border-[var(--neutral-200)] pt-6">
          <Link href="/tasks">
            <Button variant="outline" type="button">
              İptal
            </Button>
          </Link>
          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Görevi Ekle'}
          </Button>
        </div>
      </form>
    </div>
  )
}
