'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { HealthStatus } from '@/lib/services/odoo-instance-service'

export default function HealthCheckPage() {
  const params = useParams()
  const router = useRouter()
  const instanceId = params.id as string

  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadHealth = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/odoo/instances/${instanceId}/health`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Health check failed')
      }

      const data = await response.json()
      setHealth(data.health)
    } catch (err: any) {
      setError(err.message || 'Failed to check health')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadHealth()
  }, [instanceId])

  const handleRefresh = () => {
    setRefreshing(true)
    loadHealth()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />
      case 'unhealthy':
        return <XCircle className="w-8 h-8 text-red-500" />
      default:
        return <Activity className="w-8 h-8 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      healthy: 'Sağlıklı',
      degraded: 'Bozuk',
      unhealthy: 'Sağlıksız',
    }
    return labels[status] || status
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}g ${hours}s`
    if (hours > 0) return `${hours}s ${minutes}dk`
    return `${minutes}dk`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/odoo/instances/${instanceId}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Instance Detayına Dön
          </Link>
        </div>
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Health check yapılıyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/odoo/instances/${instanceId}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Instance Detayına Dön
          </Link>
        </div>
        <div className="bg-white rounded-xl p-6 border border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-red-900">Hata</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/odoo/instances/${instanceId}`}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Instance Detayına Dön
          </Link>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      <h1 className="text-3xl font-bold">Health Check</h1>

      {/* Health Status Card */}
      {health && (
        <div className={`bg-white rounded-xl p-6 border-2 ${getStatusColor(health.status)}`}>
          <div className="flex items-center gap-4 mb-6">
            {getStatusIcon(health.status)}
            <div>
              <h2 className="text-2xl font-bold">{getStatusLabel(health.status)}</h2>
              <p className="text-sm opacity-75">
                Son kontrol: {new Date(health.last_check).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/50 rounded-lg p-4">
              <p className="text-sm opacity-75 mb-1">Uptime</p>
              <p className="text-2xl font-bold">{formatUptime(health.uptime)}</p>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <p className="text-sm opacity-75 mb-1">Response Time</p>
              <p className="text-2xl font-bold">{health.response_time_ms}ms</p>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <p className="text-sm opacity-75 mb-1">Status</p>
              <p className="text-2xl font-bold capitalize">{health.status}</p>
            </div>
          </div>

          {/* Details */}
          {health.details && Object.keys(health.details).length > 0 && (
            <div className="mt-6 pt-6 border-t border-current/20">
              <h3 className="font-semibold mb-3">Detaylar</h3>
              <div className="space-y-2">
                {Object.entries(health.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="opacity-75">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-medium">
                      {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Not:</strong> Health check, instance'ın genel durumunu kontrol eder. Uptime ve
          response time metrikleri instance'ın performansını gösterir.
        </p>
      </div>
    </div>
  )
}



