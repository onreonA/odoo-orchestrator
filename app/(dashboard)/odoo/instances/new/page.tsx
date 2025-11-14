'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Server, Cloud, Database } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
}

export default function NewInstancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [userCompanyId, setUserCompanyId] = useState<string>('')
  const [formData, setFormData] = useState({
    instance_name: '',
    instance_url: '',
    database_name: '',
    version: '19.0',
    deployment_method: 'odoo_com' as 'odoo_com' | 'odoo_sh' | 'docker' | 'manual',
    admin_username: 'admin',
    admin_password: '',
    company_id: '',
  })

  useEffect(() => {
    // Fetch user permissions and companies
    const fetchData = async () => {
      try {
        const [permissionsRes, companiesRes] = await Promise.all([
          fetch('/api/user/permissions'),
          fetch('/api/v1/companies'),
        ])

        if (!permissionsRes.ok || !companiesRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const permissionsData = await permissionsRes.json()
        const companiesData = await companiesRes.json()

        if (permissionsData.company_id) {
          setUserCompanyId(permissionsData.company_id)
          setFormData(prev => ({ ...prev, company_id: permissionsData.company_id }))
        }

        if (companiesData.companies && Array.isArray(companiesData.companies)) {
          setCompanies(companiesData.companies)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        // Silently fail - form will still work without pre-filled data
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate company_id
      if (!formData.company_id) {
        throw new Error('Lütfen bir firma seçin.')
      }

      const response = await fetch('/api/odoo/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: formData.company_id,
          deploymentMethod: formData.deployment_method,
          instanceName: formData.instance_name,
          instanceUrl: formData.instance_url,
          databaseName: formData.database_name,
          version: formData.version,
          adminUsername: formData.admin_username,
          adminPassword: formData.admin_password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error messages
        let errorMessage = data.error || 'Instance oluşturulamadı'
        
        // Improve error messages
        if (errorMessage.includes('company_id')) {
          errorMessage = 'Bu firma için zaten bir instance mevcut. Bir firma için sadece bir instance oluşturulabilir.'
        } else if (errorMessage.includes('Missing required fields')) {
          errorMessage = 'Lütfen tüm zorunlu alanları doldurun.'
        } else if (errorMessage.includes('Forbidden')) {
          errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.'
        }
        
        throw new Error(errorMessage)
      }

      // Redirect to instance detail page
      router.push(`/odoo/instances/${data.instance.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/odoo/instances">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Odoo Instance Oluştur</h1>
          <p className="text-gray-600 mt-1">Yeni bir Odoo instance'ı ekleyin</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
        )}

        {/* Company Selection */}
        {companies.length > 0 && (
          <div>
            <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-2">
              Firma *
            </label>
            <select
              id="company_id"
              required
              value={formData.company_id}
              onChange={e => setFormData({ ...formData, company_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Firma seçin...</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Instance Name */}
        <div>
          <label htmlFor="instance_name" className="block text-sm font-medium text-gray-700 mb-2">
            Instance Adı *
          </label>
          <input
            type="text"
            id="instance_name"
            required
            value={formData.instance_name}
            onChange={e => setFormData({ ...formData, instance_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Örn: AEKA Mobilya Production"
          />
        </div>

        {/* Instance URL */}
        <div>
          <label htmlFor="instance_url" className="block text-sm font-medium text-gray-700 mb-2">
            Instance URL *
            {formData.deployment_method === 'odoo_com' && (
              <span className="text-xs text-gray-500 ml-2">
                (Örn: https://aeka-mobilya.odoo.com)
              </span>
            )}
          </label>
          <input
            type="url"
            id="instance_url"
            required={formData.deployment_method !== 'odoo_com'}
            value={formData.instance_url}
            onChange={e => setFormData({ ...formData, instance_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={
              formData.deployment_method === 'odoo_com'
                ? 'https://aeka-mobilya.odoo.com (opsiyonel)'
                : 'https://instance-url.com'
            }
          />
          {formData.deployment_method === 'odoo_com' && (
            <p className="text-xs text-gray-500 mt-1">
              URL boş bırakılırsa, instance adından otomatik oluşturulacaktır.
            </p>
          )}
        </div>

        {/* Database Name */}
        <div>
          <label htmlFor="database_name" className="block text-sm font-medium text-gray-700 mb-2">
            Database Adı *
          </label>
          <input
            type="text"
            id="database_name"
            required
            value={formData.database_name}
            onChange={e => setFormData({ ...formData, database_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="aeka_mobilya_db"
          />
        </div>

        {/* Deployment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Deployment Method *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 'odoo_com', label: 'Odoo.com', icon: Cloud },
              { value: 'odoo_sh', label: 'Odoo.sh', icon: Server },
              { value: 'docker', label: 'Docker', icon: Database },
              { value: 'manual', label: 'Manual', icon: Server },
            ].map(method => {
              const Icon = method.icon
              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, deployment_method: method.value as any })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.deployment_method === method.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium">{method.label}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Version */}
        <div>
          <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-2">
            Odoo Version *
          </label>
          <select
            id="version"
            required
            value={formData.version}
            onChange={e => setFormData({ ...formData, version: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="19.0">19.0</option>
            <option value="18.0">18.0</option>
            <option value="17.0">17.0</option>
            <option value="16.0">16.0</option>
            <option value="15.0">15.0</option>
            <option value="14.0">14.0</option>
          </select>
        </div>

        {/* Admin Username */}
        <div>
          <label htmlFor="admin_username" className="block text-sm font-medium text-gray-700 mb-2">
            Admin Username *
          </label>
          <input
            type="text"
            id="admin_username"
            required
            value={formData.admin_username}
            onChange={e => setFormData({ ...formData, admin_username: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="admin"
          />
        </div>

        {/* Admin Password */}
        <div>
          <label htmlFor="admin_password" className="block text-sm font-medium text-gray-700 mb-2">
            Admin Password *
          </label>
          <input
            type="password"
            id="admin_password"
            required
            value={formData.admin_password}
            onChange={e => setFormData({ ...formData, admin_password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <Link href="/odoo/instances">
            <Button type="button" variant="outline">
              İptal
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Oluşturuluyor...' : 'Instance Oluştur'}
          </Button>
        </div>
      </form>
    </div>
  )
}

