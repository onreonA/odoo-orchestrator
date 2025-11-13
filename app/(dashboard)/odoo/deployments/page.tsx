import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, Loader2, RotateCcw, ArrowRight } from 'lucide-react'

export default async function DeploymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ instanceId?: string; status?: string; templateType?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const monitoringService = getDeploymentMonitoringService()

  // Fetch deployments
  const deployments = await monitoringService.getDeploymentHistory({
    instanceId: params.instanceId,
    status: params.status,
    templateType: params.templateType,
    limit: 50,
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const getStatusColor = (status: string) => {
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
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Bekliyor',
      in_progress: 'Devam Ediyor',
      success: 'Başarılı',
      failed: 'Başarısız',
      rolled_back: 'Geri Alındı',
    }
    return labels[status] || status
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployments</h1>
          <p className="text-gray-600 mt-1">Template deployment geçmişi ve durumu</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filtrele:</span>
          {(['all', 'success', 'failed', 'in_progress', 'pending'] as const).map(status => (
            <Link
              key={status}
              href={`/odoo/deployments${status !== 'all' ? `?status=${status}` : ''}`}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                params.status === status || (status === 'all' && !params.status)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Tümü' : getStatusLabel(status)}
            </Link>
          ))}
        </div>
      </div>

      {/* Deployments List */}
      {deployments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz deployment yok</h3>
          <p className="text-gray-600">İlk template deployment'ınızı oluşturun</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deployments.map(deployment => (
            <Link
              key={deployment.deploymentId}
              href={`/odoo/deployments/${deployment.deploymentId}`}
              className="block bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-0.5">{getStatusIcon(deployment.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Deployment {deployment.deploymentId.substring(0, 8)}...
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(deployment.status)}`}
                      >
                        {getStatusLabel(deployment.status)}
                      </span>
                    </div>

                    {deployment.currentStep && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Mevcut Adım:</span> {deployment.currentStep}
                      </p>
                    )}

                    {deployment.errorMessage && (
                      <p className="text-sm text-red-600 mb-2">{deployment.errorMessage}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                      {deployment.startedAt && (
                        <span>
                          Başlangıç: {new Date(deployment.startedAt).toLocaleString('tr-TR')}
                        </span>
                      )}
                      {deployment.durationSeconds && (
                        <span>Süre: {formatDuration(deployment.durationSeconds)}</span>
                      )}
                      <span>İlerleme: {deployment.progress}%</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Progress Bar */}
              {deployment.status === 'in_progress' && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${deployment.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
