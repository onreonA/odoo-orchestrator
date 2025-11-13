/**
 * Module Marketplace Page
 *
 * Modül pazarı ve yönetim sayfası
 * Sprint 5
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  Star,
  Download,
  CheckCircle2,
  XCircle,
  Settings,
  Search,
  Filter,
} from 'lucide-react'
import Link from 'next/link'

interface Module {
  id: string
  name: string
  slug: string
  description?: string
  version?: string
  type: 'core' | 'optional' | 'custom'
  icon_url?: string
  category: string
  is_official: boolean
  is_featured: boolean
  is_premium: boolean
  install_count: number
  rating: number
  tags: string[]
}

interface ModuleInstance {
  id: string
  module_id: string
  status: 'installed' | 'active' | 'inactive' | 'error'
  modules?: Module
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [installedModules, setInstalledModules] = useState<ModuleInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'core' | 'optional' | 'custom'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    loadModules()
    loadInstalledModules()
  }, [])

  const loadModules = async () => {
    try {
      const response = await fetch('/api/modules')
      const data = await response.json()
      if (data.success) {
        setModules(data.data || [])
      }
    } catch (error) {
      console.error('Error loading modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInstalledModules = async () => {
    try {
      const response = await fetch('/api/modules/installed')
      const data = await response.json()
      if (data.success) {
        setInstalledModules(data.data || [])
      }
    } catch (error) {
      console.error('Error loading installed modules:', error)
    }
  }

  const installModule = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/modules/${moduleId}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      if (data.success) {
        await loadInstalledModules()
        await loadModules()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error installing module:', error)
      alert('Modül yüklenirken hata oluştu')
    }
  }

  const activateModule = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/modules/instances/${instanceId}/activate`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        await loadInstalledModules()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error activating module:', error)
      alert('Modül aktifleştirilirken hata oluştu')
    }
  }

  const deactivateModule = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/modules/instances/${instanceId}/deactivate`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        await loadInstalledModules()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deactivating module:', error)
      alert('Modül deaktifleştirilirken hata oluştu')
    }
  }

  const uninstallModule = async (instanceId: string) => {
    if (!confirm('Bu modülü kaldırmak istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/modules/instances/${instanceId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        await loadInstalledModules()
        await loadModules()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error uninstalling module:', error)
      alert('Modül kaldırılırken hata oluştu')
    }
  }

  const getModuleInstance = (moduleId: string) => {
    return installedModules.find(inst => inst.module_id === moduleId)
  }

  const filteredModules = modules.filter(module => {
    if (filterType !== 'all' && module.type !== filterType) return false
    if (filterCategory !== 'all' && module.category !== filterCategory) return false
    if (
      searchQuery &&
      !module.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !module.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const categories = Array.from(new Set(modules.map(m => m.category)))

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Module Marketplace</h1>
        <p className="text-gray-600">Platform'u genişletmek için modüller yükleyin</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Modül ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Tipler</option>
              <option value="core">Core</option>
              <option value="optional">Optional</option>
              <option value="custom">Custom</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Installed Modules Section */}
      {installedModules.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Yüklü Modüller ({installedModules.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {installedModules.map(instance => {
              const module = instance.modules as Module
              if (!module) return null

              return (
                <div
                  key={instance.id}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{module.name}</h3>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                    {module.is_official && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        Official
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm">{module.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-gray-600">{module.install_count} yükleme</span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        instance.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : instance.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {instance.status === 'active' && 'Aktif'}
                      {instance.status === 'inactive' && 'Pasif'}
                      {instance.status === 'installed' && 'Yüklü'}
                      {instance.status === 'error' && 'Hata'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {instance.status === 'installed' || instance.status === 'inactive' ? (
                      <button
                        onClick={() => activateModule(instance.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Aktifleştir
                      </button>
                    ) : (
                      <button
                        onClick={() => deactivateModule(instance.id)}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Deaktifleştir
                      </button>
                    )}
                    <button
                      onClick={() => uninstallModule(instance.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Modules */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Mevcut Modüller ({filteredModules.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map(module => {
            const instance = getModuleInstance(module.id)
            const isInstalled = !!instance

            return (
              <div
                key={module.id}
                className={`bg-white rounded-lg shadow p-6 border-2 transition-all ${
                  module.is_featured ? 'border-yellow-400' : 'border-transparent'
                } hover:shadow-lg`}
              >
                {module.is_featured && (
                  <div className="mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                      ⭐ Featured
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {module.icon_url ? (
                      <img
                        src={module.icon_url}
                        alt={module.name}
                        className="w-12 h-12 rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{module.name}</h3>
                      <p className="text-xs text-gray-500">v{module.version}</p>
                    </div>
                  </div>
                  {module.is_official && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      Official
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">{module.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-gray-600">{module.install_count} yükleme</span>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                    {module.category}
                  </span>
                </div>

                {module.tags && module.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {module.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {isInstalled ? (
                    <>
                      <Link
                        href={`/modules/${module.slug}`}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm text-center"
                      >
                        Yönet
                      </Link>
                      {instance?.status === 'active' ? (
                        <button
                          onClick={() => deactivateModule(instance.id)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          Pasif
                        </button>
                      ) : (
                        <button
                          onClick={() => activateModule(instance.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Aktif
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => installModule(module.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Yükle
                    </button>
                  )}
                  <Link
                    href={`/modules/${module.slug}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Detay
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aradığınız kriterlere uygun modül bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  )
}
