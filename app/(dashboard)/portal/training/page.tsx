'use client'

import { useState, useEffect } from 'react'
import { BookOpen, PlayCircle, CheckCircle2, Clock, TrendingUp, Award, FileText, Video } from 'lucide-react'
import Link from 'next/link'

interface TrainingMaterial {
  id: string
  title: string
  description?: string
  category: string
  type: string
  content_url?: string
  duration_minutes?: number
  difficulty_level: string
  is_required: boolean
  tags?: string[]
}

interface TrainingProgress {
  training_material_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  progress_percentage: number
  time_spent_minutes: number
  quiz_score?: number
}

interface TrainingStats {
  totalMaterials: number
  completedMaterials: number
  inProgressMaterials: number
  notStartedMaterials: number
  totalTimeSpent: number
  averageScore?: number
  completionRate: number
}

export default function TrainingPage() {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([])
  const [progress, setProgress] = useState<Record<string, TrainingProgress>>({})
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', 'general', 'odoo-basics', 'module-specific', 'advanced']

  useEffect(() => {
    loadData()
  }, [selectedCategory])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load materials
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      const materialsResponse = await fetch(`/api/training/materials?${params.toString()}`)
      const materialsData = await materialsResponse.json()
      if (materialsData.success) {
        setMaterials(materialsData.data || [])
      }

      // Load progress
      const progressResponse = await fetch('/api/training/progress')
      const progressData = await progressResponse.json()
      if (progressData.success) {
        const progressMap: Record<string, TrainingProgress> = {}
        progressData.data?.forEach((p: TrainingProgress) => {
          progressMap[p.training_material_id] = p
        })
        setProgress(progressMap)
      }

      // Load stats
      const statsResponse = await fetch('/api/training/stats')
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('Error loading training data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <PlayCircle className="w-5 h-5 text-blue-500" />
      case 'skipped':
        return <Clock className="w-5 h-5 text-gray-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-300" />
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'Genel',
      'odoo-basics': 'Odoo Temelleri',
      'module-specific': 'Modül Spesifik',
      advanced: 'İleri Seviye',
    }
    return labels[category] || category
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'documentation':
        return <FileText className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Eğitim Materyalleri</h1>
        <p className="text-gray-600">Odoo kullanımı için eğitim içerikleri ve ilerleme takibi</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tamamlanma Oranı</p>
                <p className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tamamlanan</p>
                <p className="text-2xl font-bold">
                  {stats.completedMaterials}/{stats.totalMaterials}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Devam Ediyor</p>
                <p className="text-2xl font-bold">{stats.inProgressMaterials}</p>
              </div>
              <PlayCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Süre</p>
                <p className="text-2xl font-bold">{Math.round(stats.totalTimeSpent / 60)}s</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'Tüm Kategoriler' : getCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Yükleniyor...</div>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Henüz Eğitim Materyali Yok</h2>
          <p className="text-gray-600">Eğitim materyalleri burada görüntülenecek</p>
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((material) => {
            const materialProgress = progress[material.id]
            const status = materialProgress?.status || 'not_started'
            const progressPercent = materialProgress?.progress_percentage || 0

            return (
              <div key={material.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(status)}
                      <h3 className="text-xl font-semibold">{material.title}</h3>
                      {material.is_required && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Zorunlu
                        </span>
                      )}
                    </div>
                    {material.description && (
                      <p className="text-gray-600 mb-4">{material.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        {getTypeIcon(material.type)}
                        {material.type === 'video' ? 'Video' : 'Dokümantasyon'}
                      </span>
                      {material.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {material.duration_minutes} dakika
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(material.difficulty_level)}`}>
                        {material.difficulty_level === 'beginner' && 'Başlangıç'}
                        {material.difficulty_level === 'intermediate' && 'Orta'}
                        {material.difficulty_level === 'advanced' && 'İleri'}
                      </span>
                      <span className="text-gray-400">{getCategoryLabel(material.category)}</span>
                    </div>
                    {status !== 'not_started' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">İlerleme</span>
                          <span className="text-sm font-medium">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {material.content_url ? (
                      <a
                        href={material.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        {status === 'completed' ? 'Tekrar İzle' : status === 'in_progress' ? 'Devam Et' : 'Başla'}
                      </a>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                      >
                        Yakında
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

