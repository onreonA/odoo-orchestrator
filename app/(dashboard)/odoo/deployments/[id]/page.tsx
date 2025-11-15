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
  let deploymentResult: any = null

  try {
    deploymentStatus = await monitoringService.getDeploymentStatus(id)
    errorSummary = await monitoringService.getErrorSummary(id)
    logs = await monitoringService.getDeploymentLogs(id, { limit: 100 })
    
    // Get deployment result details
    const { data: deployment } = await supabase
      .from('template_deployments')
      .select('result, template_id, template_type')
      .eq('id', id)
      .single()
    
    if (deployment?.result) {
      deploymentResult = deployment.result
    }
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

      {/* Deployment Results - Show what was deployed */}
      {deploymentStatus.status === 'success' && deploymentResult && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Deployment Sonuçları</h2>
          
          {/* Modules */}
          {deploymentResult.modules && deploymentResult.modules.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-green-700">
                ✅ Kurulan Modüller ({deploymentResult.modules.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {deploymentResult.modules.map((module: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      module.status === 'installed'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{module.technical_name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          module.status === 'installed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {module.status === 'installed' ? 'Kuruldu' : 'Başarısız'}
                      </span>
                    </div>
                    {module.error && (
                      <p className="text-xs text-red-600 mt-1">{module.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {deploymentResult.customFields && deploymentResult.customFields.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-blue-700">
                📝 Oluşturulan Custom Field'lar ({deploymentResult.customFields.length})
              </h3>
              <div className="space-y-2">
                {deploymentResult.customFields.map((field: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      field.status === 'created'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{field.model}</span>
                        <span className="text-gray-600 mx-2">→</span>
                        <span className="text-sm">{field.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({field.field_type})</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          field.status === 'created'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {field.status === 'created' ? 'Oluşturuldu' : 'Başarısız'}
                      </span>
                    </div>
                    {field.error && (
                      <p className="text-xs text-red-600 mt-1">{field.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflows */}
          {deploymentResult.workflows && deploymentResult.workflows.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-purple-700">
                🔄 Oluşturulan Workflow'lar ({deploymentResult.workflows.length})
              </h3>
              <div className="space-y-2">
                {deploymentResult.workflows.map((workflow: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      workflow.status === 'created'
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{workflow.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          workflow.status === 'created'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {workflow.status === 'created' ? 'Oluşturuldu' : 'Başarısız'}
                      </span>
                    </div>
                    {workflow.error && (
                      <p className="text-xs text-red-600 mt-1">{workflow.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dashboards */}
          {deploymentResult.dashboards && deploymentResult.dashboards.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-orange-700">
                📊 Oluşturulan Dashboard'lar ({deploymentResult.dashboards.length})
              </h3>
              <div className="space-y-2">
                {deploymentResult.dashboards.map((dashboard: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      dashboard.status === 'created'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{dashboard.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          dashboard.status === 'created'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {dashboard.status === 'created' ? 'Oluşturuldu' : 'Başarısız'}
                      </span>
                    </div>
                    {dashboard.error && (
                      <p className="text-xs text-red-600 mt-1">{dashboard.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module Configs */}
          {deploymentResult.moduleConfigs && deploymentResult.moduleConfigs.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-indigo-700">
                ⚙️ Yapılandırılan Modüller ({deploymentResult.moduleConfigs.length})
              </h3>
              <div className="space-y-2">
                {deploymentResult.moduleConfigs.map((config: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      config.status === 'configured'
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{config.module_name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          config.status === 'configured'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {config.status === 'configured' ? 'Yapılandırıldı' : 'Başarısız'}
                      </span>
                    </div>
                    {config.error && (
                      <p className="text-xs text-red-600 mt-1">{config.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
