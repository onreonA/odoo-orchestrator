'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Code, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewConfigurationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [formData, setFormData] = useState({
    company_id: searchParams.get('company_id') || '',
    type: 'model' as 'model' | 'view' | 'workflow' | 'security' | 'report',
    name: '',
    natural_language_input: '',
  })

  useEffect(() => {
    // Load companies
    fetch('/api/companies')
      .then((res) => res.json())
      .then((data) => {
        if (data.companies) {
          setCompanies(data.companies)
        }
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Konfigürasyon oluşturulamadı')
      }

      const { configuration } = await response.json()
      router.push(`/configurations/${configuration.id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/configurations">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft />}>
            Geri
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Yeni Konfigürasyon</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-[var(--neutral-200)]">
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
            Firma *
          </label>
          <select
            required
            value={formData.company_id}
            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
          >
            <option value="">Firma seçin</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
            Tip *
          </label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as any })
            }
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
          >
            <option value="model">Model</option>
            <option value="view">View</option>
            <option value="workflow">Workflow</option>
            <option value="security">Security</option>
            <option value="report">Report</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
            İsim *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            placeholder="Örn: Satış Siparişi Özel Alanları"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--neutral-700)]">
            Doğal Dil Açıklaması
          </label>
          <textarea
            value={formData.natural_language_input}
            onChange={(e) =>
              setFormData({ ...formData, natural_language_input: e.target.value })
            }
            rows={6}
            className="w-full px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
            placeholder="Konfigürasyonu doğal dil ile açıklayın. Örn: Satış siparişinde müşteri tipi alanı olsun, perakende/toptan seçenekleri..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Link href="/configurations" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              İptal
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1" leftIcon={loading ? <Loader2 className="animate-spin" /> : <Code />}>
            {loading ? 'Oluşturuluyor...' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </div>
  )
}


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Code, Loader2 } from 'lucide-react'

export default function NewConfigurationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_id: '',
    type: 'model',
    name: '',
    natural_language_input: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Konfigürasyon oluşturulamadı')
      }

      const { configuration } = await response.json()
      router.push(`/configurations/${configuration.id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Yeni Konfigürasyon</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border">
        <div>
          <label className="block text-sm font-medium mb-2">Firma</label>
          <input
            type="text"
            required
            value={formData.company_id}
            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Firma ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tip</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="model">Model</option>
            <option value="view">View</option>
            <option value="workflow">Workflow</option>
            <option value="security">Security</option>
            <option value="report">Report</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">İsim</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Konfigürasyon adı"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Doğal Dil Açıklaması</label>
          <textarea
            value={formData.natural_language_input}
            onChange={(e) => setFormData({ ...formData, natural_language_input: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Konfigürasyonu doğal dil ile açıklayın..."
          />
        </div>
        <Button type="submit" disabled={loading} leftIcon={loading ? <Loader2 className="animate-spin" /> : <Code />}>
          {loading ? 'Oluşturuluyor...' : 'Oluştur'}
        </Button>
      </form>
    </div>
  )
}


import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Code, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewConfigurationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [formData, setFormData] = useState({
    company_id: searchParams.get('company_id') || '',
    type: 'model' as 'model' | 'view' | 'workflow' | 'security' | 'report',
    name: '',
    natural_language_input: '',
  })

  useEffect(() => {
    fetch('/api/companies')
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies || []))
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { configuration } = await res.json()
      router.push(`/configurations/${configuration.id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/configurations">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft />}>Geri</Button>
        </Link>
        <h1 className="text-3xl font-bold">Yeni Konfigürasyon</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border">
        <div>
          <label className="block text-sm font-medium mb-2">Firma *</label>
          <select required value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
            <option value="">Firma seçin</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tip *</label>
          <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-2 border rounded-lg">
            <option value="model">Model</option>
            <option value="view">View</option>
            <option value="workflow">Workflow</option>
            <option value="security">Security</option>
            <option value="report">Report</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">İsim *</label>
          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Konfigürasyon adı" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Doğal Dil Açıklaması</label>
          <textarea value={formData.natural_language_input} onChange={(e) => setFormData({ ...formData, natural_language_input: e.target.value })} rows={6} className="w-full px-4 py-2 border rounded-lg" placeholder="Konfigürasyonu açıklayın..." />
        </div>
        <div className="flex gap-3 pt-4">
          <Link href="/configurations" className="flex-1"><Button type="button" variant="outline" className="w-full">İptal</Button></Link>
          <Button type="submit" disabled={loading} className="flex-1" leftIcon={loading ? <Loader2 className="animate-spin" /> : <Code />}>{loading ? 'Oluşturuluyor...' : 'Oluştur'}</Button>
        </div>
      </form>
    </div>
  )
}

