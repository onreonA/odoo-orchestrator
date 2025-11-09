'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditCompanyPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    size: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
  })

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single()

        if (fetchError) {
          setError('Firma bulunamadı')
          return
        }

        if (data) {
          setFormData({
            name: data.name || '',
            industry: data.industry || '',
            size: data.size || '',
            contact_person: data.contact_person || '',
            contact_email: data.contact_email || '',
            contact_phone: data.contact_phone || '',
            address: data.address || '',
          })
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setFetching(false)
      }
    }

    fetchCompany()
  }, [companyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('companies')
        .update(formData)
        .eq('id', companyId)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Redirect to company detail page
      setLoading(false)
      router.push(`/companies/${companyId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--neutral-600)]">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/companies/${companyId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Firmayı Düzenle</h1>
          <p className="text-[var(--neutral-600)] mt-1">Firma bilgilerini güncelleyin</p>
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
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Firma Adı <span className="text-[var(--error)]">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium mb-1">
                Sektör <span className="text-[var(--error)]">*</span>
              </label>
              <select
                id="industry"
                value={formData.industry}
                onChange={e => setFormData({ ...formData, industry: e.target.value })}
                required
                className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              >
                <option value="">Seçiniz</option>
                <option value="furniture">Mobilya Üretim</option>
                <option value="defense">Savunma Sanayi</option>
                <option value="metal">Metal Sanayi</option>
                <option value="ecommerce">E-Ticaret</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div>
              <label htmlFor="size" className="block text-sm font-medium mb-1">
                Firma Büyüklüğü
              </label>
              <select
                id="size"
                value={formData.size}
                onChange={e => setFormData({ ...formData, size: e.target.value })}
                className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              >
                <option value="">Seçiniz</option>
                <option value="small">Küçük (1-50 çalışan)</option>
                <option value="medium">Orta (51-200 çalışan)</option>
                <option value="large">Büyük (200+ çalışan)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 border-t border-[var(--neutral-200)] pt-6">
          <h2 className="text-xl font-semibold">İletişim Bilgileri</h2>

          <div>
            <label htmlFor="contact_person" className="block text-sm font-medium mb-1">
              İletişim Kişisi
            </label>
            <input
              id="contact_person"
              type="text"
              value={formData.contact_person}
              onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium mb-1">
                Telefon
              </label>
              <input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1">
              Adres
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 border-t border-[var(--neutral-200)] pt-6">
          <Link href={`/companies/${companyId}`}>
            <Button variant="outline" type="button">
              İptal
            </Button>
          </Link>
          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
