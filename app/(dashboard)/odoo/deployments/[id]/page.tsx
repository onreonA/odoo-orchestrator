import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DeploymentProgress } from '@/components/odoo/deployment-progress'
import { LogViewer } from '@/components/odoo/log-viewer'
import { RollbackButton } from '@/components/odoo/rollback-button'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'
import Link from 'next/link'

export default async function DeploymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const monitoringService = getDeploymentMonitoringService()

  // Get deployment status
  let deploymentStatus
  let errorSummary
  let logs = []

  try {
    deploymentStatus = await monitoringService.getDeploymentStatus(id)
    errorSummary = await monitoringService.getErrorSummary(id)
    logs = await monitoringService.getDeploymentLogs(id, { limit: 100 })
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Deployment Bulunamadı</h2>
            <p className="text-gray-600 mb-4">Aradığınız deployment mevcut değil.</p>
            <Link
              href="/odoo/deployments"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Deployment Listesine Dön
            </Link>
          </div>
        </div>
      )
    }
    throw error
  }

  const canRollback = deploymentStatus.status === 'failed' || deploymentStatus.status === 'success'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/odoo/deployments"
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
          >
            ← Deployment Listesine Dön
          </Link>
          <h1 className="text-3xl font-bold">Deployment Detayı</h1>
          <p className="text-gray-600 mt-1">ID: {id.substring(0, 8)}...</p>
        </div>
        {canRollback && profile?.role === 'super_admin' && <RollbackButton deploymentId={id} />}
      </div>

      {/* Deployment Progress */}
      <DeploymentProgress deploymentId={id} initialStatus={deploymentStatus} />

      {/* Error Summary */}
      {errorSummary.errorCount > 0 && (
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <h2 className="text-lg font-semibold text-red-900 mb-4">
            Hata Özeti ({errorSummary.errorCount} hata)
          </h2>
          <div className="space-y-2">
            {errorSummary.errors.slice(0, 5).map(error => (
              <div key={error.id} className="p-3 bg-white rounded border border-red-200">
                <p className="text-sm text-red-900">{error.message}</p>
                <p className="text-xs text-red-600 mt-1">
                  {new Date(error.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
            ))}
            {errorSummary.errorCount > 5 && (
              <p className="text-sm text-red-700 mt-2">
                +{errorSummary.errorCount - 5} hata daha...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {errorSummary.warningCount > 0 && (
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <h2 className="text-lg font-semibold text-yellow-900 mb-4">
            Uyarılar ({errorSummary.warningCount} uyarı)
          </h2>
          <div className="space-y-2">
            {errorSummary.warnings.slice(0, 5).map(warning => (
              <div key={warning.id} className="p-3 bg-white rounded border border-yellow-200">
                <p className="text-sm text-yellow-900">{warning.message}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {new Date(warning.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
            ))}
            {errorSummary.warningCount > 5 && (
              <p className="text-sm text-yellow-700 mt-2">
                +{errorSummary.warningCount - 5} uyarı daha...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Logs */}
      <LogViewer
        deploymentId={id}
        initialLogs={logs}
        autoRefresh={deploymentStatus.status === 'in_progress'}
      />
    </div>
  )
}
