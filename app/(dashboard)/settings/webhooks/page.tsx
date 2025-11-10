/**
 * Webhooks Management Page
 * 
 * Webhook yönetim sayfası
 * Sprint 5
 */

'use client'

import { useState, useEffect } from 'react'
import { Webhook, Plus, Trash2, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react'

interface WebhookData {
  id: string
  name: string
  url: string
  events: string[]
  status: 'active' | 'inactive' | 'failed'
  max_retries: number
  retry_delay_seconds: number
  success_count: number
  failure_count: number
  last_triggered_at?: string
  last_success_at?: string
  last_failure_at?: string
  last_error?: string
  created_at: string
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null)

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks')
      const data = await response.json()
      if (data.success) {
        setWebhooks(data.data || [])
      }
    } catch (error) {
      console.error('Error loading webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWebhook = async (formData: {
    name: string
    url: string
    events: string[]
    maxRetries?: number
    retryDelaySeconds?: number
  }) => {
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        setNewWebhookSecret(data.data.webhook.secret)
        await loadWebhooks()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating webhook:', error)
      alert('Webhook oluşturulurken hata oluştu')
    }
  }

  const deleteWebhook = async (id: string) => {
    if (!confirm('Bu webhook\'u silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        await loadWebhooks()
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting webhook:', error)
      alert('Webhook silinirken hata oluştu')
    }
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
          <h1 className="text-3xl font-bold mb-2">Webhooks</h1>
          <p className="text-gray-600">Event'leri harici sistemlere gönderin</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Webhook
        </button>
      </div>

      {/* New Webhook Secret Modal */}
      {newWebhookSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Webhook Oluşturuldu!</h2>
            <p className="text-red-600 mb-4">
              ⚠️ Webhook secret'ını şimdi kopyalayın. Signature doğrulama için gerekli!
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Secret:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newWebhookSecret)
                    alert('Secret kopyalandı!')
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Kopyala
                </button>
              </div>
              <code className="text-sm break-all">{newWebhookSecret}</code>
            </div>
            <button
              onClick={() => {
                setNewWebhookSecret(null)
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
      {showCreateModal && !newWebhookSecret && (
        <CreateWebhookModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createWebhook}
        />
      )}

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Webhook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Henüz webhook oluşturulmamış</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk Webhook'u Oluştur
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{webhook.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-mono break-all">{webhook.url}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        webhook.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : webhook.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {webhook.status === 'active' && 'Aktif'}
                      {webhook.status === 'failed' && 'Hata'}
                      {webhook.status === 'inactive' && 'Pasif'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteWebhook(webhook.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700">Events:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {webhook.events.map((event) => (
                    <span key={event} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {event}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Success Rate:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">
                      {webhook.success_count + webhook.failure_count > 0
                        ? Math.round(
                            (webhook.success_count /
                              (webhook.success_count + webhook.failure_count)) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {webhook.success_count} success, {webhook.failure_count} failed
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Retry Policy:</span>
                  <div className="text-xs text-gray-700 mt-1">
                    Max {webhook.max_retries} retries
                    <br />
                    Delay: {webhook.retry_delay_seconds}s
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Last Triggered:</span>
                  <div className="text-xs text-gray-700 mt-1">
                    {webhook.last_triggered_at ? (
                      new Date(webhook.last_triggered_at).toLocaleString()
                    ) : (
                      'Never'
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Created:</span>
                  <div className="text-xs text-gray-700 mt-1">
                    {new Date(webhook.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {webhook.last_error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <span className="text-sm font-medium text-red-800">Last Error:</span>
                  <p className="text-sm text-red-700 mt-1">{webhook.last_error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateWebhookModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: any) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    maxRetries: 3,
    retryDelaySeconds: 60,
  })

  const availableEvents = [
    'company.created',
    'company.updated',
    'company.deleted',
    'project.created',
    'project.updated',
    'project.completed',
    'ticket.created',
    'ticket.updated',
    'ticket.resolved',
    'document.created',
    'document.updated',
    'user.created',
    'user.updated',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.events.length === 0) {
      alert('En az bir event seçmelisiniz')
      return
    }
    await onCreate(formData)
  }

  const toggleEvent = (event: string) => {
    setFormData({
      ...formData,
      events: formData.events.includes(event)
        ? formData.events.filter((e) => e !== event)
        : [...formData.events, event],
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Yeni Webhook Oluştur</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="My Webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL *</label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/webhook"
            />
            <p className="text-xs text-gray-500 mt-1">HTTPS URL gerekli</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Events *</label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {availableEvents.map((event) => (
                <label key={event} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="rounded"
                  />
                  <span className="text-sm">{event}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.events.length} event seçildi
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max Retries</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.maxRetries}
                onChange={(e) =>
                  setFormData({ ...formData, maxRetries: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Retry Delay (seconds)</label>
              <input
                type="number"
                min="1"
                value={formData.retryDelaySeconds}
                onChange={(e) =>
                  setFormData({ ...formData, retryDelaySeconds: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
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

