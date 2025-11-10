/**
 * Module Detail Page
 * 
 * Modül detay sayfası
 * Sprint 5
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Package, Star, Download, CheckCircle2, XCircle, ArrowLeft, Settings, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Module {
  id: string
  name: string
  slug: string
  description?: string
  long_description?: string
  icon_url?: string
  banner_url?: string
  version: string
  author?: string
  author_url?: string
  homepage_url?: string
  repository_url?: string
  license: string
  type: 'core' | 'optional' | 'custom'
  category: string
  tags: string[]
  dependencies: string[]
  conflicts_with: string[]
  required_permissions: string[]
  has_settings: boolean
  is_official: boolean
  is_featured: boolean
  is_premium: boolean
  install_count: number
  rating: number
  review_count: number
  created_at: string
  updated_at: string
}

interface ModuleInstance {
  id: string
  module_id: string
  status: 'installed' | 'active' | 'inactive' | 'error'
}

export default function ModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [module, setModule] = useState<Module | null>(null)
  const [instance, setInstance] = useState<ModuleInstance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      loadModule()
      loadInstance()
    }
  }, [slug])

  const loadModule = async () => {
    try {
      const response = await fetch(`/api/modules/by-slug/${slug}`)
      const data = await response.json()
      if (data.success) {
        setModule(data.data)
      }
    } catch (error) {
      console.error('Error loading module:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInstance = async () => {
    try {
      const response = await fetch('/api/modules/installed')
      const data = await response.json()
      if (data.success && module) {
        const inst = data.data.find((i: ModuleInstance) => i.module_id === module.id)
        setInstance(inst || null)
      }
    } catch (error) {
      console.error('Error loading instance:', error)
    }
  }

  const installModule = async () => {
    if (!module) return

    try {
      const response = await fetch(`/api/modules/${module.id}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      if (data.success) {
        await loadInstance()
        router.push('/modules')
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error installing module:', error)
      alert('Modül yüklenirken hata oluştu')
    }
  }

  const activateModule = async () => {
    if (!instance) return

    try {
      const response = await fetch(`/api/modules/instances/${instance.id}/activate`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        await loadInstance()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error activating module:', error)
      alert('Modül aktifleştirilirken hata oluştu')
    }
  }

  const deactivateModule = async () => {
    if (!instance) return

    try {
      const response = await fetch(`/api/modules/instances/${instance.id}/deactivate`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        await loadInstance()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deactivating module:', error)
      alert('Modül deaktifleştirilirken hata oluştu')
    }
  }

  const uninstallModule = async () => {
    if (!instance) return

    if (!confirm('Bu modülü kaldırmak istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/modules/instances/${instance.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        router.push('/modules')
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error uninstalling module:', error)
      alert('Modül kaldırılırken hata oluştu')
    }
  }

  useEffect(() => {
    if (module) {
      loadInstance()
    }
  }, [module])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Modül bulunamadı</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <Link
        href="/modules"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Modüllere Dön
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex items-start gap-6">
          {module.icon_url ? (
            <img src={module.icon_url} alt={module.name} className="w-24 h-24 rounded-lg" />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-12 h-12 text-blue-600" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{module.name}</h1>
                <p className="text-gray-600">{module.description}</p>
              </div>
              <div className="flex gap-2">
                {module.is_official && (
                  <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                    Official
                  </span>
                )}
                {module.is_featured && (
                  <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded">
                    ⭐ Featured
                  </span>
                )}
                {module.is_premium && (
                  <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded">
                    Premium
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{module.rating.toFixed(1)}</span>
                <span className="text-gray-600">({module.review_count} değerlendirme)</span>
              </div>
              <span className="text-gray-600">{module.install_count} yükleme</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">{module.category}</span>
              <span className="text-gray-600">v{module.version}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {instance ? (
                <>
                  {instance.status === 'active' ? (
                    <>
                      <button
                        onClick={deactivateModule}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Deaktifleştir
                      </button>
                      {module.has_settings && (
                        <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Ayarlar
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={activateModule}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Aktifleştir
                    </button>
                  )}
                  <button
                    onClick={uninstallModule}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Kaldır
                  </button>
                </>
              ) : (
                <button
                  onClick={installModule}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Yükle
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {module.long_description && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Açıklama</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{module.long_description}</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {module.tags && module.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Etiketler</h2>
              <div className="flex flex-wrap gap-2">
                {module.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {module.dependencies && module.dependencies.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Bağımlılıklar</h2>
              <ul className="list-disc list-inside space-y-2">
                {module.dependencies.map((dep) => (
                  <li key={dep} className="text-gray-700">
                    {dep}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conflicts */}
          {module.conflicts_with && module.conflicts_with.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <h2 className="text-xl font-semibold mb-4 text-red-800">Çakışmalar</h2>
              <ul className="list-disc list-inside space-y-2">
                {module.conflicts_with.map((conflict) => (
                  <li key={conflict} className="text-red-700">
                    {conflict}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Tip:</span>
                <span className="ml-2 font-medium">{module.type}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Kategori:</span>
                <span className="ml-2 font-medium">{module.category}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Versiyon:</span>
                <span className="ml-2 font-medium">{module.version}</span>
              </div>
              {module.author && (
                <div>
                  <span className="text-sm text-gray-600">Yazar:</span>
                  {module.author_url ? (
                    <a
                      href={module.author_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {module.author}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="ml-2 font-medium">{module.author}</span>
                  )}
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">Lisans:</span>
                <span className="ml-2 font-medium">{module.license}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {(module.homepage_url || module.repository_url) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Bağlantılar</h2>
              <div className="space-y-2">
                {module.homepage_url && (
                  <a
                    href={module.homepage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ana Sayfa
                  </a>
                )}
                {module.repository_url && (
                  <a
                    href={module.repository_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Repository
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Permissions */}
          {module.required_permissions && module.required_permissions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Gerekli İzinler</h2>
              <ul className="space-y-2">
                {module.required_permissions.map((perm) => (
                  <li key={perm} className="text-sm text-gray-700">
                    • {perm}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

