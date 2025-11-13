'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, Loader2, RotateCcw } from 'lucide-react'

interface DeploymentStatus {
  deploymentId: string
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back'
  progress: number
  currentStep?: string
  errorMessage?: string
  startedAt?: string
  completedAt?: string
  durationSeconds?: number
}

interface DeploymentProgressProps {
  deploymentId: string
  initialStatus?: DeploymentStatus
  onComplete?: () => void
}

export function DeploymentProgress({
  deploymentId,
  initialStatus,
  onComplete,
}: DeploymentProgressProps) {
  const [status, setStatus] = useState<DeploymentStatus | null>(initialStatus || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!initialStatus) {
      fetchStatus()
    }

    // Poll for updates if deployment is in progress
    const interval = setInterval(() => {
      if (status && (status.status === 'pending' || status.status === 'in_progress')) {
        fetchStatus()
      } else {
        clearInterval(interval)
        if (onComplete && (status?.status === 'success' || status?.status === 'failed')) {
          onComplete()
        }
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [deploymentId, status?.status])

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/odoo/deployments/${deploymentId}`)
      const data = await response.json()
      if (data.deployment) {
        setStatus(data.deployment)
      }
    } catch (error) {
      console.error('Failed to fetch deployment status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (!status) return <Clock className="w-5 h-5 text-gray-400" />

    switch (status.status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'rolled_back':
        return <RotateCcw className="w-5 h-5 text-orange-500" />
      case 'in_progress':
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    if (!status) return 'bg-gray-100'

    switch (status.status) {
      case 'success':
        return 'bg-green-100'
      case 'failed':
        return 'bg-red-100'
      case 'rolled_back':
        return 'bg-orange-100'
      case 'in_progress':
        return 'bg-blue-100'
      default:
        return 'bg-gray-100'
    }
  }

  const getStatusLabel = () => {
    if (!status) return 'Bilinmiyor'

    const labels: Record<string, string> = {
      pending: 'Bekliyor',
      in_progress: 'Devam Ediyor',
      success: 'Başarılı',
      failed: 'Başarısız',
      rolled_back: 'Geri Alındı',
    }
    return labels[status.status] || status.status
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (!status) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-gray-600">Yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-gray-900">Deployment Durumu</h3>
            <p className="text-sm text-gray-500">ID: {deploymentId.substring(0, 8)}...</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {getStatusLabel()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">İlerleme</span>
          <span className="text-sm font-medium text-gray-700">{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              status.status === 'success'
                ? 'bg-green-500'
                : status.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      {status.currentStep && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Mevcut Adım:</span> {status.currentStep}
          </p>
        </div>
      )}

      {/* Error Message */}
      {status.errorMessage && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-900">
            <span className="font-medium">Hata:</span> {status.errorMessage}
          </p>
        </div>
      )}

      {/* Timing Info */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-1">Başlangıç</p>
          <p className="text-sm font-medium">
            {status.startedAt ? new Date(status.startedAt).toLocaleString('tr-TR') : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Süre</p>
          <p className="text-sm font-medium">{formatDuration(status.durationSeconds)}</p>
        </div>
      </div>
    </div>
  )
}
