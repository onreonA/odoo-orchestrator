'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Play, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Deployment {
  id: string
  instance_id: string
  instance?: {
    name: string
  }
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back'
  progress: number
  current_step?: string
  error_message?: string
  started_at?: string
  completed_at?: string
  duration_seconds?: number
}

interface ConfigurationDeploymentStatusProps {
  configurationId: string
  currentStatus: string
  canDeploy?: boolean
  onDeploy?: () => void
}

export function ConfigurationDeploymentStatus({
  configurationId,
  currentStatus,
  canDeploy = false,
  onDeploy,
}: ConfigurationDeploymentStatusProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [showDeployForm, setShowDeployForm] = useState(false)
  const [instances, setInstances] = useState<any[]>([])
  const [selectedInstanceId, setSelectedInstanceId] = useState('')

  useEffect(() => {
    fetchDeployments()
    fetchInstances()
  }, [configurationId])

  const fetchDeployments = async () => {
    try {
      const response = await fetch(`/api/configurations/${configurationId}/deployments`)
      if (response.ok) {
        const data = await response.json()
        setDeployments(data.deployments || [])
      }
    } catch (error) {
      console.error('Failed to fetch deployments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/odoo/instances')
      if (response.ok) {
        const data = await response.json()
        setInstances(data.instances || [])
      }
    } catch (error) {
      console.error('Failed to fetch instances:', error)
    }
  }

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInstanceId) {
      alert('Lütfen bir instance seçin')
      return
    }

    setDeploying(true)

    try {
      const response = await fetch(`/api/configurations/${configurationId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: selectedInstanceId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Deployment başlatılamadı')
      }

      setShowDeployForm(false)
      setSelectedInstanceId('')
      fetchDeployments()
      onDeploy?.()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setDeploying(false)
    }
  }

  const handleRollback = async (deploymentId: string) => {
    if (!confirm('Bu deployment\'ı geri almak istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/configurations/${configurationId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deploymentId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Rollback başarısız')
      }

      fetchDeployments()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const getStatusIcon = (status: Deployment['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'rolled_back':
        return <RotateCcw className="w-5 h-5 text-orange-500" />
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: Deployment['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'rolled_back':
        return 'bg-orange-100 text-orange-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Play className="w-5 h-5" />
          Deployment Durumu
        </h3>
        {canDeploy && (currentStatus === 'approved' || currentStatus === 'draft') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeployForm(!showDeployForm)}
          >
            Deploy Et
          </Button>
        )}
      </div>

      {showDeployForm && (
        <form onSubmit={handleDeploy} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Odoo Instance</label>
              <select
                value={selectedInstanceId}
                onChange={e => setSelectedInstanceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Instance seçin</option>
                {instances.map(instance => (
                  <option key={instance.id} value={instance.id}>
                    {instance.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={deploying || !selectedInstanceId} size="sm">
                {deploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploy Ediliyor...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Deploy Et
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeployForm(false)}
              >
                İptal
              </Button>
            </div>
          </div>
        </form>
      )}

      {deployments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Play className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Henüz deployment yok</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deployments.map(deployment => (
            <div
              key={deployment.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(deployment.status)}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(deployment.status)}`}
                  >
                    {deployment.status === 'pending'
                      ? 'Beklemede'
                      : deployment.status === 'in_progress'
                        ? 'Devam Ediyor'
                        : deployment.status === 'success'
                          ? 'Başarılı'
                          : deployment.status === 'failed'
                            ? 'Başarısız'
                            : 'Geri Alındı'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {deployment.started_at &&
                    format(new Date(deployment.started_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                </span>
              </div>
              {deployment.instance && (
                <div className="text-sm text-gray-600 mb-2">
                  Instance: {deployment.instance.name}
                </div>
              )}
              {(deployment.status === 'in_progress' || deployment.status === 'pending') && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{deployment.current_step || 'Deploy ediliyor...'}</span>
                    <span>{deployment.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${deployment.progress || 0}%` }}
                    />
                  </div>
                </div>
              )}
              {deployment.error_message && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {deployment.error_message}
                </div>
              )}
              {deployment.status === 'success' && (
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRollback(deployment.id)}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Geri Al
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

