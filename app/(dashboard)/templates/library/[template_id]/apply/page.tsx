'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle, Package } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  odoo_instance_url?: string | null
  odoo_db_name?: string | null
}

interface Project {
  id: string
  name: string
  company_id: string
  status: string
}

interface Template {
  id: string
  template_id: string
  name: string
  description: string
  type: string
  industry: string
}

export default function ApplyTemplateLibraryPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params?.template_id as string

  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [template, setTemplate] = useState<Template | null>(null)
  const [companyId, setCompanyId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    loadTemplate()
    loadCompanies()
  }, [])

  useEffect(() => {
    if (companyId) {
      loadProjects(companyId)
    } else {
      setProjects([])
      setProjectId('')
    }
  }, [companyId])

  const loadTemplate = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('template_library')
        .select('*')
        .eq('template_id', templateId)
        .single()

      if (error) throw error
      setTemplate(data)
    } catch (err: any) {
      setError('Template yüklenemedi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCompanies = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('companies')
      .select('id, name, odoo_instance_url, odoo_db_name')
      .order('name')

    if (data) {
      setCompanies(data)
      if (data.length > 0 && !companyId) {
        setCompanyId(data[0].id)
      }
    }
  }

  const loadProjects = async (companyId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('projects')
      .select('id, name, company_id, status')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (data) {
      setProjects(data)
      if (data.length > 0 && !projectId) {
        setProjectId(data[0].id)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeploying(true)
    setError('')
    setSuccess(false)

    if (!companyId) {
      setError('Lütfen bir firma seçin')
      setDeploying(false)
      return
    }

    if (!projectId) {
      setError('Lütfen bir proje seçin')
      setDeploying(false)
      return
    }

    try {
      const response = await fetch('/api/templates/library/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          company_id: companyId,
          project_id: projectId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Template uygulanamadı')
        setDeploying(false)
        return
      }

      if (!result.success) {
        setError(result.error || 'Template uygulanamadı')
        setDeploying(false)
        return
      }

      setSuccess(true)
      setDeploying(false)

      // Increment usage count (handled by API)

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/projects/${projectId}`)
        router.refresh()
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setDeploying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary-500)]" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4">
          <p className="text-[var(--error)]">Template bulunamadı</p>
        </div>
        <Link href="/templates/library">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Template Library'ye Dön
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/templates/library/${templateId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Template Uygula</h1>
            <p className="text-[var(--neutral-600)] mt-1">{template.name}</p>
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-[var(--brand-primary-50)]">
            <Package className="w-6 h-6 text-[var(--brand-primary-500)]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">{template.name}</h2>
            <p className="text-[var(--neutral-600)]">{template.description}</p>
            <div className="mt-4 flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {template.type}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                {template.industry}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Önemli Bilgiler:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Template uygulandıktan sonra projeye modüller ve konfigürasyonlar eklenecek</li>
              <li>Kick-off template'leri için departmanlar ve görevler oluşturulacak</li>
              <li>BOM template'leri için ürün yapıları hazırlanacak</li>
              <li>Workflow template'leri için iş akışları kurulacak</li>
              <li>Dashboard template'leri için görünümler oluşturulacak</li>
              <li>İşlem birkaç dakika sürebilir</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Selection */}
        <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
          <h2 className="text-xl font-semibold mb-4">1. Firma Seçin</h2>
          <select
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            disabled={deploying}
            required
          >
            <option value="">Firma seçin...</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Selection */}
        {companyId && (
          <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
            <h2 className="text-xl font-semibold mb-4">2. Proje Seçin</h2>
            {projects.length > 0 ? (
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
                disabled={deploying}
                required
              >
                <option value="">Proje seçin...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.status})
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-4">
                <p className="text-[var(--neutral-600)]">
                  Bu firma için henüz proje yok. Önce bir proje oluşturun.
                </p>
                <Link href={`/projects/new?company_id=${companyId}`}>
                  <Button type="button" variant="outline">
                    Yeni Proje Oluştur
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[var(--error)]" />
              <p className="text-[var(--error)]">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 mb-1">Template başarıyla uygulandı!</p>
                <p className="text-sm text-green-700">Proje sayfasına yönlendiriliyorsunuz...</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {companyId && projects.length > 0 && (
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={deploying || success || !projectId}
              className="flex items-center gap-2"
              size="lg"
            >
              {deploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uygulanıyor...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Template'i Uygula
                </>
              )}
            </Button>
            <Link href={`/templates/library/${templateId}`}>
              <Button type="button" variant="outline" disabled={deploying}>
                İptal
              </Button>
            </Link>
          </div>
        )}
      </form>
    </div>
  )
}
