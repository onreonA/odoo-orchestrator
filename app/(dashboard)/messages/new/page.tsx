'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2, Users, Building2, FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewThreadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<Array<{ id: string; full_name?: string; email: string }>>([])

  const [formData, setFormData] = useState<{
    title: string
    thread_type: 'direct' | 'group' | 'company' | 'project'
    company_id: string
    project_id: string
    participants: string[]
  }>({
    title: '',
    thread_type: 'direct',
    company_id: '',
    project_id: '',
    participants: [],
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // Load companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')
      if (companiesData) setCompanies(companiesData)

      // Load projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')
      if (projectsData) setProjects(projectsData)

      // Load users (profiles)
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')
      if (usersData) setUsers(usersData)
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (formData.participants.length === 0) {
        setError('En az bir katılımcı seçin')
        setLoading(false)
        return
      }

      const threadData: any = {
        thread_type: formData.thread_type,
        participants: formData.participants,
      }

      if (formData.title) {
        threadData.title = formData.title
      }

      if (formData.thread_type === 'company' && formData.company_id) {
        threadData.company_id = formData.company_id
      }

      if (formData.thread_type === 'project' && formData.project_id) {
        threadData.project_id = formData.project_id
      }

      const response = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(threadData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Sohbet oluşturulamadı')
        setLoading(false)
        return
      }

      router.push(`/messages/${result.data.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  const toggleParticipant = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/messages">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Sohbet</h1>
          <p className="text-gray-600 mt-1">Yeni bir sohbet başlatın</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Thread Type */}
        <div>
          <label className="block text-sm font-medium mb-3">Sohbet Tipi</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['direct', 'group', 'company', 'project'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, thread_type: type }))}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  formData.thread_type === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {type === 'direct' && <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />}
                {type === 'group' && <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />}
                {type === 'company' && <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-600" />}
                {type === 'project' && <FolderKanban className="w-8 h-8 mx-auto mb-2 text-gray-600" />}
                <div className="text-sm font-medium">
                  {type === 'direct' && 'Direkt'}
                  {type === 'group' && 'Grup'}
                  {type === 'company' && 'Firma'}
                  {type === 'project' && 'Proje'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Başlık (Opsiyonel)
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Sohbet başlığı"
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Company */}
        {formData.thread_type === 'company' && (
          <div>
            <label htmlFor="company_id" className="block text-sm font-medium mb-1">
              Firma <span className="text-red-500">*</span>
            </label>
            <select
              id="company_id"
              required
              value={formData.company_id}
              onChange={e => setFormData({ ...formData, company_id: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Firma seçin</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Project */}
        {formData.thread_type === 'project' && (
          <div>
            <label htmlFor="project_id" className="block text-sm font-medium mb-1">
              Proje <span className="text-red-500">*</span>
            </label>
            <select
              id="project_id"
              required
              value={formData.project_id}
              onChange={e => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Proje seçin</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Participants */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Katılımcılar <span className="text-red-500">*</span>
          </label>
          <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
            {users.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleParticipant(user.id)}
                className={`w-full text-left p-2 rounded transition-colors ${
                  formData.participants.includes(user.id)
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="font-medium">{user.full_name || user.email}</div>
                {user.full_name && <div className="text-sm text-gray-600">{user.email}</div>}
              </button>
            ))}
          </div>
          {formData.participants.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {formData.participants.length} katılımcı seçildi
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
          <Link href="/messages">
            <Button variant="outline" type="button">
              İptal
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sohbeti Başlat
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

