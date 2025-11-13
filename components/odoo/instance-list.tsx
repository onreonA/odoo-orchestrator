'use client'

import { useEffect, useState } from 'react'
import { Server, Cloud, Database, Activity, MoreVertical, Plus } from 'lucide-react'
import Link from 'next/link'

interface Instance {
  id: string
  instance_name: string
  instance_url: string
  database_name: string
  version: string
  status: 'active' | 'inactive' | 'suspended' | 'error' | 'deploying' | 'maintenance'
  deployment_method: 'odoo_com' | 'odoo_sh' | 'docker' | 'manual'
  company_id: string
  created_at: string
}

interface InstanceListProps {
  initialInstances?: Instance[]
}

export function InstanceList({ initialInstances = [] }: InstanceListProps) {
  const [instances, setInstances] = useState<Instance[]>(initialInstances)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialInstances.length === 0) {
      fetchInstances()
    }
  }, [])

  const fetchInstances = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/odoo/instances')
      const data = await response.json()
      if (data.instances) {
        setInstances(data.instances)
      }
    } catch (error) {
      console.error('Failed to fetch instances:', error)
    } finally {
      setLoading(false)
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

  const getDeploymentMethodIcon = (method: string) => {
    switch (method) {
      case 'odoo_com':
        return <Cloud className="w-4 h-4" />
      case 'odoo_sh':
        return <Server className="w-4 h-4" />
      default:
        return <Database className="w-4 h-4" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Odoo Instances</h2>
          <p className="text-gray-600 mt-1">Yönetilen Odoo instance'ları</p>
        </div>
        <Link
          href="/odoo/instances/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Instance
        </Link>
      </div>

      {/* Instances Grid */}
      {instances.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz instance yok</h3>
          <p className="text-gray-600 mb-4">İlk Odoo instance'ınızı oluşturun</p>
          <Link
            href="/odoo/instances/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Instance Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map(instance => (
            <Link
              key={instance.id}
              href={`/odoo/instances/${instance.id}`}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {getDeploymentMethodIcon(instance.deployment_method)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{instance.instance_name}</h3>
                    <p className="text-sm text-gray-500">{instance.instance_url}</p>
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Database:</span>
                  <span className="font-medium">{instance.database_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">{instance.version}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium capitalize">{instance.deployment_method}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(instance.status)}`}
                >
                  {getStatusLabel(instance.status)}
                </span>
                <Activity className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
