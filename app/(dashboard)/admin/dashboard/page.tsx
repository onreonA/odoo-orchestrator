'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  FolderKanban,
  Users,
  Ticket,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalUsers: number
  openTickets: number
  resolvedTickets: number
  companyName?: string
}

interface Project {
  id: string
  name: string
  status: string
  phase: string
  company_id: string
  progress: number
  health_score?: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load user permissions and role
      const permissionsResponse = await fetch('/api/user/permissions')
      const permissionsData = await permissionsResponse.json()
      if (permissionsData.success) {
        setUserRole(permissionsData.data.role)
        setPermissions(permissionsData.data.permissions)
      }

      // Load stats
      const statsResponse = await fetch('/api/admin/stats')
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats(statsData.data)
      }

      // Load projects
      const projectsResponse = await fetch('/api/admin/projects')
      const projectsData = await projectsResponse.json()
      if (projectsData.success) {
        setProjects(projectsData.data || [])
      }
    } catch (error) {
      console.error('Error loading admin dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      case 'testing':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  // Check if user can access admin dashboard
  if (!permissions?.canAccessAdminPanel) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Bu sayfaya erişim yetkiniz yok.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          {stats?.companyName ? `${stats.companyName} - ` : ''}Firma Yönetim Paneli
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Proje</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
              <FolderKanban className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-4 flex gap-2 text-sm">
              <span className="text-green-600">{stats.activeProjects} Aktif</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{stats.completedProjects} Tamamlandı</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kullanıcılar</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-4">
              <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
                Kullanıcıları Yönet →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Açık Destek Talepleri</p>
                <p className="text-2xl font-bold">{stats.openTickets}</p>
              </div>
              <Ticket className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-4 flex gap-2 text-sm">
              <span className="text-gray-600">{stats.resolvedTickets} Çözüldü</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Firma Sağlık Skoru</p>
                <p className="text-2xl font-bold">
                  {projects.length > 0
                    ? Math.round(
                        projects.reduce((sum, p) => sum + (p.health_score || 0), 0) /
                          projects.length
                      )
                    : '-'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-4 text-sm text-gray-600">Ortalama proje sağlığı</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {permissions?.canManageUsers && (
            <Link
              href="/admin/users"
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium">Kullanıcı Ekle</span>
            </Link>
          )}
          {permissions?.canManageProjects && (
            <Link
              href="/projects/new"
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FolderKanban className="w-6 h-6 text-green-500 mb-2" />
              <span className="text-sm font-medium">Proje Oluştur</span>
            </Link>
          )}
          {permissions?.canManageSupportTickets && (
            <Link
              href="/support"
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Ticket className="w-6 h-6 text-orange-500 mb-2" />
              <span className="text-sm font-medium">Destek Talepleri</span>
            </Link>
          )}
          <Link
            href="/companies"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building2 className="w-6 h-6 text-purple-500 mb-2" />
            <span className="text-sm font-medium">Firmalar</span>
          </Link>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Son Projeler</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Proje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Faz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  İlerleme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sağlık
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Henüz proje yok
                  </td>
                </tr>
              ) : (
                projects.slice(0, 10).map(project => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}
                      >
                        {project.status === 'completed' && 'Tamamlandı'}
                        {project.status === 'in_progress' && 'Devam Ediyor'}
                        {project.status === 'planning' && 'Planlama'}
                        {project.status === 'testing' && 'Test'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{project.phase || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12">{project.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${getHealthColor(project.health_score)}`}>
                        {project.health_score ? `${project.health_score}/100` : '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {projects.length > 10 && (
          <div className="p-4 border-t text-center">
            <Link href="/projects" className="text-blue-600 hover:underline">
              Tüm Projeleri Görüntüle →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
