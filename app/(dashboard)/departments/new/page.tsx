'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewDepartmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<Array<{ id: string; full_name?: string; email: string }>>([])
  const [formData, setFormData] = useState({
    name: '',
    technical_name: '',
    description: '',
    company_id: '',
    manager_id: '',
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
          const { data: companiesData } = await companiesQuery
          if (companiesData) {
            setCompanies(companiesData)
            if (companiesData.length === 1) {
              setFormData(prev => ({ ...prev, company_id: companiesData[0].id }))
            }
          }
        }

        // Load users for manager selection
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
  }, [router])

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
      if (!formData.name.trim()) {
        setError('Departman adı gereklidir')
        setLoading(false)
        return
      }

      if (!formData.technical_name.trim()) {
        setError('Teknik isim gereklidir')
        setLoading(false)
        return
      }

      if (!formData.company_id) {
        setError('Firma seçilmelidir')
        setLoading(false)
        return
      }

      // Create department
      const { data: department, error: departmentError } = await supabase
        .from('departments')
        .insert({
          name: formData.name.trim(),
          technical_name: formData.technical_name.trim().toLowerCase().replace(/\s+/g, '_'),
          description: formData.description.trim() || null,
          company_id: formData.company_id,
          manager_id: formData.manager_id || null,
        })
        .select()
        .single()

      if (departmentError) {
        setError(departmentError.message)
        setLoading(false)
        return
      }

      // Redirect to department detail page
      router.push(`/departments/${department.id}`)
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/departments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Departman Ekle</h1>
          <p className="text-[var(--neutral-600)] mt-1">Yeni bir departman oluşturun</p>
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
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Departman Adı <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              placeholder="Örn: Üretim"
            />
          </div>

          <div>
            <label htmlFor="technical_name" className="block text-sm font-medium mb-1">
              Teknik İsim <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="technical_name"
              type="text"
              value={formData.technical_name}
              onChange={e => setFormData({ ...formData, technical_name: e.target.value })}
              required
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              placeholder="Örn: production (küçük harf, alt çizgi ile)"
            />
            <p className="text-xs text-[var(--neutral-500)] mt-1">
              Küçük harf ve alt çizgi kullanın. Örn: production, inventory, purchasing
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Açıklama
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              placeholder="Departman açıklaması"
            />
          </div>

          <div>
            <label htmlFor="manager_id" className="block text-sm font-medium mb-1">
              Departman Sorumlusu
            </label>
            <select
              id="manager_id"
              value={formData.manager_id}
              onChange={e => setFormData({ ...formData, manager_id: e.target.value })}
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
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 border-t border-[var(--neutral-200)] pt-6">
          <Link href="/departments">
            <Button variant="outline" type="button">
              İptal
            </Button>
          </Link>
          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Departmanı Ekle'}
          </Button>
        </div>
      </form>
    </div>
  )
}
