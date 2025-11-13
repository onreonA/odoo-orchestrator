import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DeploymentProgress } from '@/components/odoo/deployment-progress'
import { LogViewer } from '@/components/odoo/log-viewer'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'
import { getDeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'
import { Server, Cloud, Database, Activity, Calendar, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

export default async function InstanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get instance
  const instanceService = getOdooInstanceService()
  const instance = await instanceService.getInstanceById(id)

  if (!instance) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Instance Bulunamadı</h2>
          <p className="text-gray-600 mb-4">Aradığınız instance mevcut değil.</p>
          <Link
            href="/odoo/instances"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Instance Listesine Dön
          </Link>
        </div>
      </div>
    )
  }

  // Get active deployments
  const monitoringService = getDeploymentMonitoringService()
  const activeDeployments = await monitoringService.getActiveDeployments(id)

  const getDeploymentMethodIcon = (method: string) => {
    switch (method) {
      case 'odoo_com':
        return <Cloud className="w-5 h-5" />
      case 'odoo_sh':
        return <Server className="w-5 h-5" />
      default:
        return <Database className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'deploying':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Aktif',
      inactive: 'Pasif',
      suspended: 'Askıya Alındı',
      error: 'Hata',
      deploying: 'Kuruluyor',
      maintenance: 'Bakımda',
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/odoo/instances"
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
          >
            ← Instance Listesine Dön
          </Link>
          <h1 className="text-3xl font-bold">{instance.instance_name}</h1>
          <p className="text-gray-600 mt-1">{instance.instance_url}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(instance.status)}`}
        >
          {getStatusLabel(instance.status)}
        </span>
      </div>

      {/* Instance Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              {getDeploymentMethodIcon(instance.deployment_method)}
            </div>
            <div>
              <p className="text-sm text-gray-600">Deployment Method</p>
              <p className="font-semibold capitalize">{instance.deployment_method}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Database</p>
              <p className="font-semibold">{instance.database_name}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Version</p>
              <p className="font-semibold">{instance.version}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Deployments */}
      {activeDeployments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Aktif Deployments</h2>
          {activeDeployments.map(deployment => (
            <DeploymentProgress
              key={deployment.deploymentId}
              deploymentId={deployment.deploymentId}
              initialStatus={deployment}
            />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/odoo/instances/${id}/health`}
            className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Activity className="w-5 h-5 text-blue-500 mb-2" />
            <div className="font-medium">Health Check</div>
            <div className="text-sm text-gray-600 mt-1">Instance sağlığını kontrol et</div>
          </Link>
          <Link
            href={`/odoo/instances/${id}/backups`}
            className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Database className="w-5 h-5 text-green-500 mb-2" />
            <div className="font-medium">Backups</div>
            <div className="text-sm text-gray-600 mt-1">Backup'ları görüntüle ve yönet</div>
          </Link>
          <Link
            href={`/odoo/deployments?instanceId=${id}`}
            className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-5 h-5 text-purple-500 mb-2" />
            <div className="font-medium">Deployments</div>
            <div className="text-sm text-gray-600 mt-1">Tüm deployment'ları görüntüle</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
