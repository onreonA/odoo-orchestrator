'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, FolderKanban } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [formData, setFormData] = useState({
    name: '',
    company_id: searchParams.get('company_id') || '',
    type: 'implementation' as 'implementation' | 'upgrade' | 'support',
    status: 'planning' as 'planning' | 'in_progress' | 'testing' | 'completed',
    start_date: '',
    planned_go_live: '',
    estimated_budget: '',
    description: '',
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

        // Load companies (if super_admin, show all; otherwise show only user's company)
        const companiesQuery =
          profile?.role === 'super_admin'
            ? supabase.from('companies').select('id, name').order('name')
            : profile?.company_id
              ? supabase.from('companies').select('id, name').eq('id', profile.company_id)
              : null

        if (companiesQuery) {
          const { data: companiesData, error: companiesError } = await companiesQuery

          if (companiesError) {
            console.error('Error loading companies:', companiesError)
          } else if (companiesData) {
            setCompanies(companiesData)
            // If user has a company and no company_id in URL, set it
            if (profile?.company_id && !searchParams.get('company_id')) {
              setFormData(prev => ({ ...prev, company_id: profile.company_id! }))
            }
          }
        }
      } catch (err: any) {
        console.error('Error loading data:', err)
      } finally {
        setFetching(false)
      }
    }

    loadData()
  }, [router, searchParams])

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

      // Validate required fields
      if (!formData.name || !formData.company_id) {
        setError('Lütfen proje adı ve firma seçin')
        setLoading(false)
        return
      }

      // Prepare project data
      const projectData: any = {
        name: formData.name,
        company_id: formData.company_id,
        type: formData.type,
        status: formData.status,
      }

      if (formData.start_date) {
        projectData.start_date = formData.start_date
      }

      if (formData.planned_go_live) {
        projectData.planned_go_live = formData.planned_go_live
      }

      if (formData.estimated_budget) {
        projectData.estimated_budget = parseFloat(formData.estimated_budget)
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (projectError) {
        setError(projectError.message || 'Proje oluşturulamadı')
        setLoading(false)
        return
      }

      // Redirect to project detail page
      router.push(`/projects/${project.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary-500)]" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft />}>
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Proje</h1>
          <p className="text-[var(--neutral-600)] mt-1">Yeni bir proje oluşturun</p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-xl border border-[var(--neutral-200)]"
      >
        {error && (
          <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4 text-[var(--error)]">
            {error}
          </div>
        )}

        {/* Company Selection */}
        {companies.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
              Firma *
            </label>
            <select
              required
              value={formData.company_id}
              onChange={e => setFormData({ ...formData, company_id: e.target.value })}
              className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
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

        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
            Proje Adı *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            placeholder="Örn: AEKA Mobilya ERP Implementasyonu"
          />
        </div>

        {/* Project Type */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
            Proje Tipi *
          </label>
          <select
            required
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
          >
            <option value="implementation">Implementasyon</option>
            <option value="upgrade">Yükseltme</option>
            <option value="support">Destek</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">Durum</label>
          <select
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
          >
            <option value="planning">Planlama</option>
            <option value="in_progress">Devam Ediyor</option>
            <option value="testing">Test Aşamasında</option>
            <option value="completed">Tamamlandı</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
          />
        </div>

        {/* Planned Go Live */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
            Planlanan Go-Live Tarihi
          </label>
          <input
            type="date"
            value={formData.planned_go_live}
            onChange={e => setFormData({ ...formData, planned_go_live: e.target.value })}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
          />
        </div>

        {/* Estimated Budget */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
            Tahmini Bütçe (TL)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.estimated_budget}
            onChange={e => setFormData({ ...formData, estimated_budget: e.target.value })}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            placeholder="0.00"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
            Açıklama
          </label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            placeholder="Proje hakkında detaylı bilgi..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Link href="/projects" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              İptal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
            leftIcon={loading ? <Loader2 className="animate-spin" /> : <FolderKanban />}
          >
            {loading ? 'Oluşturuluyor...' : 'Proje Oluştur'}
          </Button>
        </div>
      </form>
    </div>
  )
}
