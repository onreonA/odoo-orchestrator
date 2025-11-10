/**
 * API Keys Management Page
 * 
 * API key yönetim sayfası
 * Sprint 5
 */

'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Eye, EyeOff, Copy, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  status: 'active' | 'inactive' | 'revoked'
  scopes: string[]
  rate_limit_per_minute: number
  rate_limit_per_hour: number
  rate_limit_per_day: number
  last_used_at?: string
  request_count: number
  created_at: string
  expires_at?: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKey, setNewKey] = useState<{ key: string; apiKey: ApiKey } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys')
      const data = await response.json()
      if (data.success) {
        setApiKeys(data.data || [])
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async (formData: {
    name: string
    scopes?: string[]
    rateLimitPerMinute?: number
    rateLimitPerHour?: number
    rateLimitPerDay?: number
    expiresAt?: string
  }) => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        setNewKey(data.data)
        await loadApiKeys()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      alert('API key oluşturulurken hata oluştu')
    }
  }

  const revokeApiKey = async (id: string) => {
    if (!confirm('Bu API key\'i iptal etmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/api-keys/${id}/revoke`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        await loadApiKeys()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error revoking API key:', error)
      alert('API key iptal edilirken hata oluştu')
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!confirm('Bu API key\'i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        await loadApiKeys()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      alert('API key silinirken hata oluştu')
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-gray-600">Public API için API key'lerinizi yönetin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni API Key
        </button>
      </div>

      {/* New Key Modal */}
      {newKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">API Key Oluşturuldu!</h2>
            <p className="text-red-600 mb-4">
              ⚠️ Bu key'i şimdi kopyalayın. Bir daha gösterilmeyecek!
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">API Key:</span>
                <button
                  onClick={() => copyToClipboard(newKey.key, 'new-key')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {copied === 'new-key' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <code className="text-sm break-all">{newKey.key}</code>
            </div>
            <button
              onClick={() => {
                setNewKey(null)
                setShowCreateModal(false)
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && !newKey && (
        <CreateApiKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createApiKey}
        />
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Henüz API key oluşturulmamış</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk API Key'i Oluştur
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div key={key.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{key.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-mono">{key.key_prefix}...</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        key.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : key.status === 'revoked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {key.status === 'active' && 'Aktif'}
                      {key.status === 'revoked' && 'İptal Edildi'}
                      {key.status === 'inactive' && 'Pasif'}
                    </span>
                    {key.expires_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(key.expires_at) > new Date() ? (
                          <span>Expires: {new Date(key.expires_at).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-red-600">Expired</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {key.status === 'active' && (
                    <button
                      onClick={() => revokeApiKey(key.id)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                    >
                      İptal Et
                    </button>
                  )}
                  <button
                    onClick={() => deleteApiKey(key.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-600">Scopes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {key.scopes.length > 0 ? (
                      key.scopes.map((scope) => (
                        <span key={scope} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {scope}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No scopes</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Rate Limits:</span>
                  <div className="text-xs text-gray-700 mt-1">
                    {key.rate_limit_per_minute}/min
                    <br />
                    {key.rate_limit_per_hour}/hour
                    <br />
                    {key.rate_limit_per_day}/day
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Usage:</span>
                  <div className="text-xs text-gray-700 mt-1">
                    {key.request_count.toLocaleString()} requests
                    {key.last_used_at && (
                      <>
                        <br />
                        Last: {new Date(key.last_used_at).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created:</span>
                  <div className="text-xs text-gray-700 mt-1">
                    {new Date(key.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateApiKeyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: any) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    name: '',
    scopes: [] as string[],
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    rateLimitPerDay: 10000,
    expiresAt: '',
  })

  const availableScopes = [
    'read:companies',
    'write:companies',
    'read:projects',
    'write:projects',
    'read:tickets',
    'write:tickets',
    '*',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onCreate({
      name: formData.name,
      scopes: formData.scopes.length > 0 ? formData.scopes : undefined,
      rateLimitPerMinute: formData.rateLimitPerMinute,
      rateLimitPerHour: formData.rateLimitPerHour,
      rateLimitPerDay: formData.rateLimitPerDay,
      expiresAt: formData.expiresAt || undefined,
    })
  }

  const toggleScope = (scope: string) => {
    if (scope === '*') {
      setFormData({ ...formData, scopes: ['*'] })
    } else {
      setFormData({
        ...formData,
        scopes: formData.scopes.includes(scope)
          ? formData.scopes.filter((s) => s !== scope && s !== '*')
          : [...formData.scopes.filter((s) => s !== '*'), scope],
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Yeni API Key Oluştur</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="My API Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Scopes</label>
            <div className="space-y-2">
              {availableScopes.map((scope) => (
                <label key={scope} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.scopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                    className="rounded"
                  />
                  <span className="text-sm">{scope}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rate Limit (min)</label>
              <input
                type="number"
                value={formData.rateLimitPerMinute}
                onChange={(e) =>
                  setFormData({ ...formData, rateLimitPerMinute: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rate Limit (hour)</label>
              <input
                type="number"
                value={formData.rateLimitPerHour}
                onChange={(e) =>
                  setFormData({ ...formData, rateLimitPerHour: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rate Limit (day)</label>
              <input
                type="number"
                value={formData.rateLimitPerDay}
                onChange={(e) =>
                  setFormData({ ...formData, rateLimitPerDay: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expires At (optional)</label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

