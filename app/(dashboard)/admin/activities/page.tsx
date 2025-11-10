'use client'

import { useState, useEffect } from 'react'
import { Activity, Filter, TrendingUp, Clock, User, Building2 } from 'lucide-react'

interface ActivityLog {
  id: string
  action: string
  entity_type: string
  entity_id?: string
  description: string
  user_id?: string
  company_id?: string
  project_id?: string
  created_at: string
}

interface ActivityStats {
  total: number
  last24Hours: number
  last7Days: number
  byAction: Record<string, number>
  byEntityType: Record<string, number>
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    entityType: 'all',
    action: 'all',
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load activities
      const params = new URLSearchParams()
      if (filters.entityType !== 'all') {
        params.append('entityType', filters.entityType)
      }
      if (filters.action !== 'all') {
        params.append('action', filters.action)
      }

      const activitiesResponse = await fetch(`/api/activities?${params.toString()}`)
      const activitiesData = await activitiesResponse.json()
      if (activitiesData.success) {
        setActivities(activitiesData.data || [])
      }

      // Load stats
      const statsResponse = await fetch('/api/activities/stats')
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Oluşturuldu',
      update: 'Güncellendi',
      delete: 'Silindi',
      view: 'Görüntülendi',
      login: 'Giriş yapıldı',
      logout: 'Çıkış yapıldı',
      export: 'Dışa aktarıldı',
      import: 'İçe aktarıldı',
    }
    return labels[action] || action
  }

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      project: 'Proje',
      discovery: 'Discovery',
      ticket: 'Destek Talebi',
      document: 'Doküman',
      training: 'Eğitim',
      user: 'Kullanıcı',
      company: 'Firma',
    }
    return labels[type] || type
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Aktivite Kayıtları</h1>
        <p className="text-gray-600">Sistem aktivitelerini takip edin</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Aktivite</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Son 24 Saat</p>
                <p className="text-2xl font-bold">{stats.last24Hours}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Son 7 Gün</p>
                <p className="text-2xl font-bold">{stats.last7Days}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Çok İşlem</p>
                <p className="text-lg font-bold">
                  {Object.entries(stats.byAction).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={filters.entityType}
          onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tüm Entity Tipleri</option>
          <option value="project">Proje</option>
          <option value="discovery">Discovery</option>
          <option value="ticket">Destek Talebi</option>
          <option value="document">Doküman</option>
          <option value="training">Eğitim</option>
          <option value="user">Kullanıcı</option>
        </select>
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tüm İşlemler</option>
          <option value="create">Oluşturma</option>
          <option value="update">Güncelleme</option>
          <option value="delete">Silme</option>
          <option value="view">Görüntüleme</option>
        </select>
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Yükleniyor...</div>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Henüz Aktivite Yok</h2>
          <p className="text-gray-600">Aktiviteler burada görüntülenecek</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zaman</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(activity.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getActionLabel(activity.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getEntityTypeLabel(activity.entity_type)}
                    </td>
                    <td className="px-6 py-4 text-sm">{activity.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

