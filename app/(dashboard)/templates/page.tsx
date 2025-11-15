'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Package, Search, Filter, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description: string | null
  industry: string
  modules: any[]
  usage_count: number
  is_active: boolean
  created_at: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [industryFilter, setIndustryFilter] = useState<string>('all')

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [searchQuery, industryFilter, templates])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()

      if (result.success) {
        setTemplates(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
      setTemplates([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = [...templates]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.industry.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(t => t.industry === industryFilter)
    }

    setFilteredTemplates(filtered)
  }

  const industries = Array.from(new Set(templates.map(t => t.industry)))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Kütüphanesi</h1>
          <p className="text-gray-600 mt-1">Hazır Odoo konfigürasyonlarını tek tıkla uygulayın</p>
        </div>
        <Link href="/companies">
          <Button variant="outline" size="sm">
            Firmalara Dön
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Template ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Industry Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={industryFilter}
              onChange={e => setIndustryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tüm Sektörler</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>
                  {industry === 'furniture' && 'Mobilya'}
                  {industry === 'defense' && 'Savunma'}
                  {industry === 'metal' && 'Metal'}
                  {industry === 'ecommerce' && 'E-Ticaret'}
                  {industry || 'Diğer'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchQuery || industryFilter !== 'all' ? 'Template bulunamadı' : 'Henüz template yok'}
          </h3>
          <p className="text-gray-500">
            {searchQuery || industryFilter !== 'all'
              ? 'Farklı bir arama terimi deneyin'
              : "İlk template'i oluşturmak için bir firmadan template oluşturun"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                </div>
                {template.is_active && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Aktif
                  </span>
                )}
              </div>

              {/* Description */}
              {template.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
              )}

              {/* Industry */}
              <div className="mb-4">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {template.industry === 'furniture' && 'Mobilya'}
                  {template.industry === 'defense' && 'Savunma'}
                  {template.industry === 'metal' && 'Metal'}
                  {template.industry === 'ecommerce' && 'E-Ticaret'}
                  {template.industry || 'Diğer'}
                </span>
              </div>

              {/* Modules Count */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{template.modules?.length || 0}</span> modül
                </p>
              </div>

              {/* Usage Count */}
              {template.usage_count > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500">{template.usage_count} kez kullanıldı</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link href={`/templates/${template.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Detaylar
                  </Button>
                </Link>
                <Link href={`/templates/${template.id}/apply`} className="flex-1">
                  <Button size="sm" className="w-full">
                    Uygula
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
