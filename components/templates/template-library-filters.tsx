'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'

interface TemplateLibraryFiltersProps {
  currentType?: string
  currentIndustry?: string
  currentSearch?: string
}

export function TemplateLibraryFilters({
  currentType,
  currentIndustry,
  currentSearch,
}: TemplateLibraryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch || '')

  useEffect(() => {
    setSearch(currentSearch || '')
  }, [currentSearch])

  const updateFilters = (type?: string, industry?: string, searchQuery?: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (type) {
      params.set('type', type)
    } else {
      params.delete('type')
    }

    if (industry) {
      params.set('industry', industry)
    } else {
      params.delete('industry')
    }

    if (searchQuery) {
      params.set('search', searchQuery)
    } else {
      params.delete('search')
    }

    router.push(`/templates/library?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters(currentType, currentIndustry, search)
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-[var(--neutral-200)]">
      <form onSubmit={handleSearch} className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--neutral-400)]" />
          <input
            type="text"
            placeholder="Template ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
          />
        </div>
        <select
          value={currentType || ''}
          onChange={e => updateFilters(e.target.value || undefined, currentIndustry, search)}
          className="px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
        >
          <option value="">Tüm Tipler</option>
          <option value="kickoff">Kick-off</option>
          <option value="bom">BOM</option>
          <option value="workflow">Workflow</option>
          <option value="dashboard">Dashboard</option>
          <option value="configuration">Konfigürasyon</option>
          <option value="report">Rapor</option>
        </select>
        <select
          value={currentIndustry || ''}
          onChange={e => updateFilters(currentType, e.target.value || undefined, search)}
          className="px-4 py-2 border border-[var(--neutral-300)] rounded-lg focus:ring-2 focus:ring-[var(--brand-primary-500)]"
        >
          <option value="">Tüm Sektörler</option>
          <option value="furniture">Mobilya</option>
          <option value="manufacturing">Üretim</option>
          <option value="service">Hizmet</option>
          <option value="metal">Metal</option>
          <option value="defense">Savunma</option>
        </select>
      </form>
    </div>
  )
}







