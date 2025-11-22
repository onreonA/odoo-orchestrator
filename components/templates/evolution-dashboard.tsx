'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, AlertCircle, CheckCircle, Sparkles, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EvolutionRecommendation {
  type: string
  priority: 'low' | 'medium' | 'high'
  description: string
  details: any
  confidence: number
}

interface EvolutionAnalysis {
  templateId: string
  recommendations: EvolutionRecommendation[]
  healthScore: number
  usageTrend: 'increasing' | 'stable' | 'decreasing'
  successRate: number
}

interface EvolutionDashboardProps {
  templateId: string
  templateName: string
  analysis: EvolutionAnalysis | null
}

export function EvolutionDashboard({
  templateId,
  templateName,
  analysis: initialAnalysis,
}: EvolutionDashboardProps) {
  const [analysis, setAnalysis] = useState<EvolutionAnalysis | null>(initialAnalysis)
  const [loading, setLoading] = useState(false)

  const fetchAnalysis = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/templates/${templateId}/evolution`)
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Error fetching evolution analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialAnalysis) {
      fetchAnalysis()
    }
  }, [templateId])

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      add_module: 'Modül Ekle',
      remove_module: 'Modül Kaldır',
      modify_field: 'Alan Düzenle',
      add_workflow: 'Workflow Ekle',
      optimize_dashboard: 'Dashboard Optimize Et',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
        <div className="animate-spin text-blue-500">⏳</div>
        <p className="text-gray-600 mt-2">Analiz yükleniyor...</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
        <p className="text-gray-600">Analiz verisi bulunamadı</p>
        <Button onClick={fetchAnalysis} className="mt-4">
          Tekrar Dene
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Health Score & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Health Score</p>
              <p className={`text-4xl font-bold mt-2 ${getHealthScoreColor(analysis.healthScore)}`}>
                {analysis.healthScore}
              </p>
              <p className="text-xs text-gray-500 mt-1">/ 100</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-4xl font-bold mt-2">{(analysis.successRate * 100).toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usage Trend</p>
              <p className="text-2xl font-bold mt-2 flex items-center gap-2">
                {analysis.usageTrend === 'increasing' && (
                  <>
                    <TrendingUp className="w-6 h-6 text-green-500" />
                    <span className="text-green-600">Artıyor</span>
                  </>
                )}
                {analysis.usageTrend === 'stable' && (
                  <>
                    <Activity className="w-6 h-6 text-blue-500" />
                    <span className="text-blue-600">Stabil</span>
                  </>
                )}
                {analysis.usageTrend === 'decreasing' && (
                  <>
                    <TrendingUp className="w-6 h-6 text-red-500 rotate-180" />
                    <span className="text-red-600">Azalıyor</span>
                  </>
                )}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            İyileştirme Önerileri
          </h2>
          <Button variant="outline" size="sm" onClick={fetchAnalysis}>
            Yenile
          </Button>
        </div>

        {analysis.recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>Şu anda iyileştirme önerisi yok</p>
            <p className="text-sm mt-1">Template sağlıklı görünüyor!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analysis.recommendations.map((rec, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}
                      >
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {getTypeLabel(rec.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {(rec.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{rec.description}</p>
                    {rec.details && (
                      <div className="mt-2 text-xs text-gray-500">
                        {JSON.stringify(rec.details, null, 2)}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const response = await fetch(`/api/templates/${templateId}/evolution`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ recommendation_id: index.toString() }),
                      })
                      if (response.ok) {
                        alert('Öneri uygulanacak')
                        fetchAnalysis()
                      }
                    }}
                  >
                    Uygula
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

