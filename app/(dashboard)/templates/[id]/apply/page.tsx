'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  odoo_instance_url?: string | null
  odoo_db_name?: string | null
}

export default function ApplyTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params?.id as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])

  // Odoo connection info
  const [odooUrl, setOdooUrl] = useState('')
  const [odooDatabase, setOdooDatabase] = useState('')
  const [odooUsername, setOdooUsername] = useState('')
  const [odooPassword, setOdooPassword] = useState('')

  // Template info
  const [templateName, setTemplateName] = useState('')

  useEffect(() => {
    loadCompanies()
    loadTemplate()
  }, [])

  useEffect(() => {
    if (companyId) {
      const company = companies.find(c => c.id === companyId)
      if (company) {
        if (company.odoo_instance_url) {
          setOdooUrl(company.odoo_instance_url)
        }
        if (company.odoo_db_name) {
          setOdooDatabase(company.odoo_db_name)
        }
      }
    }
  }, [companyId, companies])

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

  const loadTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      const result = await response.json()
      if (result.success) {
        setTemplateName(result.data.name)
      }
    } catch (err) {
      console.error('Failed to load template:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (!companyId) {
      setError('Lütfen bir firma seçin')
      setLoading(false)
      return
    }

    if (!odooUrl || !odooDatabase || !odooUsername || !odooPassword) {
      setError('Lütfen tüm Odoo bağlantı bilgilerini girin')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/templates/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          company_id: companyId,
          odoo_config: {
            url: odooUrl,
            database: odooDatabase,
            username: odooUsername,
            password: odooPassword,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Template uygulanamadı')
        setLoading(false)
        return
      }

      if (!result.success) {
        setError('Template uygulanamadı')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/companies/${companyId}`)
        router.refresh()
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/templates/${templateId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Template Uygula</h1>
            <p className="text-gray-600 mt-1">{templateName || "Template'i firmaya uygulayın"}</p>
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
              <li>Template uygulandıktan sonra Odoo modülleri otomatik yüklenecek</li>
              <li>Konfigürasyonlar ve özel alanlar oluşturulacak</li>
              <li>İşlem birkaç dakika sürebilir</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Selection */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">1. Firma Seçin</h2>
          <select
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
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

        {/* Odoo Connection */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">2. Odoo Bağlantı Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Odoo URL</label>
              <input
                type="text"
                value={odooUrl}
                onChange={e => setOdooUrl(e.target.value)}
                placeholder="https://odoo.example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Veritabanı Adı</label>
              <input
                type="text"
                value={odooDatabase}
                onChange={e => setOdooDatabase(e.target.value)}
                placeholder="odoo_db"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
              <input
                type="text"
                value={odooUsername}
                onChange={e => setOdooUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <input
                type="password"
                value={odooPassword}
                onChange={e => setOdooPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
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
                <p className="text-sm text-green-700">Firma sayfasına yönlendiriliyorsunuz...</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={loading || success}
            className="flex items-center gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uygulanıyor...
              </>
            ) : (
              "Template'i Uygula"
            )}
          </Button>
          <Link href={`/templates/${templateId}`}>
            <Button type="button" variant="outline" disabled={loading}>
              İptal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
