'use client'

import { useState, useEffect } from 'react'
import { FolderKanban, Calendar, CheckCircle2, Clock, AlertCircle, FileText, BookOpen, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Chatbot } from '@/components/portal/chatbot'

interface ProjectProgress {
  id: string
  name: string
  status: string
  phase: string
  progress: number
  health_score?: number
  milestones: Milestone[]
  modules: ModuleProgress[]
  training: TrainingProgress
  dataMigration: DataMigrationProgress
}

interface Milestone {
  id: string
  name: string
  date: string
  status: 'completed' | 'upcoming' | 'overdue'
}

interface ModuleProgress {
  name: string
  status: 'planned' | 'configuring' | 'testing' | 'deployed'
  progress: number
}

interface TrainingProgress {
  totalUsers: number
  completedUsers: number
  percentage: number
}

interface DataMigrationProgress {
  status: 'pending' | 'in_progress' | 'completed'
  percentage: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
}

export default function CustomerPortalPage() {
  const [projects, setProjects] = useState<ProjectProgress[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get user role
      const permissionsResponse = await fetch('/api/user/permissions')
      const permissionsData = await permissionsResponse.json()
      if (permissionsData.success) {
        setUserRole(permissionsData.data.role)
      }

      // Load projects
      const projectsResponse = await fetch('/api/portal/projects')
      const projectsData = await projectsResponse.json()
      if (projectsData.success) {
        setProjects(projectsData.data || [])
      }

      // Load activities
      const activitiesResponse = await fetch('/api/portal/activities')
      const activitiesData = await activitiesResponse.json()
      if (activitiesData.success) {
        setActivities(activitiesData.data || [])
      }
    } catch (error) {
      console.error('Error loading portal data:', error)
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

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      discovery: 'Keşif',
      configuration: 'Konfigürasyon',
      development: 'Geliştirme',
      training: 'Eğitim',
      go_live: 'Go-Live',
    }
    return labels[phase] || phase
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Proje Portalı</h1>
        <p className="text-gray-600">Projelerinizin durumunu ve ilerlemesini takip edin</p>
      </div>

      {/* Projects Overview */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Henüz Proje Yok</h2>
          <p className="text-gray-600">Projeleriniz burada görüntülenecek</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow">
              {/* Project Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{project.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {project.status === 'completed' && 'Tamamlandı'}
                        {project.status === 'in_progress' && 'Devam Ediyor'}
                        {project.status === 'planning' && 'Planlama'}
                        {project.status === 'testing' && 'Test'}
                      </span>
                      <span className="text-sm text-gray-600">Faz: {getPhaseLabel(project.phase)}</span>
                      {project.health_score && (
                        <span
                          className={`text-sm font-medium ${
                            project.health_score >= 80
                              ? 'text-green-600'
                              : project.health_score >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          Sağlık: {project.health_score}/100
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{project.progress}%</div>
                    <div className="text-sm text-gray-600">Tamamlanma</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="p-6 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                {/* Milestones */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Milestone'lar
                  </h3>
                  <div className="space-y-2">
                    {project.milestones && project.milestones.length > 0 ? (
                      project.milestones.slice(0, 3).map((milestone) => (
                        <div key={milestone.id} className="flex items-center gap-2 text-sm">
                          {milestone.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : milestone.status === 'overdue' ? (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className={milestone.status === 'completed' ? 'line-through text-gray-500' : ''}>
                            {milestone.name}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {new Date(milestone.date).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Milestone tanımlanmamış</p>
                    )}
                  </div>
                </div>

                {/* Modules */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-purple-500" />
                    Modüller ({project.modules?.filter((m) => m.status === 'deployed').length || 0}/
                    {project.modules?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {project.modules && project.modules.length > 0 ? (
                      project.modules.slice(0, 3).map((module, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span>{module.name}</span>
                          <span className="text-gray-500">
                            {module.status === 'deployed' && '✅'}
                            {module.status === 'testing' && '🧪'}
                            {module.status === 'configuring' && '⚙️'}
                            {module.status === 'planned' && '📋'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Modül bilgisi yok</p>
                    )}
                  </div>
                </div>

                {/* Training & Migration */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    Eğitim & Göç
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Eğitim</span>
                        <span>{project.training?.percentage || 0}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${project.training?.percentage || 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {project.training?.completedUsers || 0}/{project.training?.totalUsers || 0} kullanıcı
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Veri Göçü</span>
                        <span>{project.dataMigration?.percentage || 0}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${project.dataMigration?.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="p-6 border-t bg-gray-50">
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={`/portal/projects/${project.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Detaylı Görünüm
                  </Link>
                  <Link
                    href="/portal/documents"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Dokümanlar
                  </Link>
                  <Link
                    href="/portal/training"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Eğitim Materyalleri
                  </Link>
                  <Link
                    href="/portal/support"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Destek
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activities */}
      {activities.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Son Aktiviteler</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {activities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbot */}
      <Chatbot />
    </div>
  )
}

