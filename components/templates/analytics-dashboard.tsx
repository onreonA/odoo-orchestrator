'use client'

import { useMemo, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Star,
  AlertCircle,
  Download,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'

interface Analytics {
  date: string
  usage_count: number
  success_count: number
  failure_count: number
  avg_rating: number
  avg_deployment_time_seconds: number
}

interface Deployment {
  status: string
  created_at: string
  duration_seconds: number | null
}

interface Feedback {
  rating: number
  created_at: string
}

interface AnalyticsDashboardProps {
  templateId: string
  templateName: string
  analytics: Analytics[]
  deployments: Deployment[]
  feedback: Feedback[]
  usageCount: number
}

export function AnalyticsDashboard({
  templateId,
  templateName,
  analytics,
  deployments,
  feedback,
  usageCount,
}: AnalyticsDashboardProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(format)
    try {
      const startDate =
        analytics.length > 0
          ? analytics[analytics.length - 1].date
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = analytics.length > 0 ? analytics[0].date : new Date().toISOString()

      const url = `/api/templates/${templateId}/analytics/export?format=${format}&start_date=${startDate}&end_date=${endDate}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `template-analytics-${templateId}-${format === 'pdf' ? '.pdf' : '.csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (error: any) {
      alert(`Export failed: ${error.message}`)
    } finally {
      setExporting(null)
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDeployments = deployments.length
    const successfulDeployments = deployments.filter(d => d.status === 'success').length
    const failedDeployments = deployments.filter(d => d.status === 'failed').length
    const successRate = totalDeployments > 0 ? (successfulDeployments / totalDeployments) * 100 : 0

    const avgDeploymentTime =
      deployments
        .filter(d => d.duration_seconds)
        .reduce((sum, d) => sum + (d.duration_seconds || 0), 0) /
        deployments.filter(d => d.duration_seconds).length || 0

    const avgRating =
      feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0

    // Calculate trends (last 7 days vs previous 7 days)
    const last7Days = analytics.slice(0, 7)
    const previous7Days = analytics.slice(7, 14)
    const last7DaysUsage = last7Days.reduce((sum, a) => sum + a.usage_count, 0)
    const previous7DaysUsage = previous7Days.reduce((sum, a) => sum + a.usage_count, 0)
    const usageTrend =
      last7DaysUsage > previous7DaysUsage
        ? 'up'
        : last7DaysUsage < previous7DaysUsage
          ? 'down'
          : 'stable'

    return {
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      successRate,
      avgDeploymentTime,
      avgRating,
      usageTrend,
      totalFeedback: feedback.length,
    }
  }, [analytics, deployments, feedback])

  // Prepare chart data (last 30 days)
  const chartData = useMemo(() => {
    const last30Days = analytics.slice(0, 30).reverse()
    return last30Days.map(a => ({
      date: format(new Date(a.date), 'd MMM', { locale: tr }),
      usage: a.usage_count,
      success: a.success_count,
      failure: a.failure_count,
    }))
  }, [analytics])

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Template Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">{templateName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'pdf'}
          >
            {exporting === 'pdf' ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={exporting === 'excel'}
          >
            {exporting === 'excel' ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Kullanım</p>
              <p className="text-3xl font-bold mt-2">{usageCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Başarı Oranı</p>
              <p className="text-3xl font-bold mt-2">{stats.successRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.successfulDeployments} / {stats.totalDeployments} deployment
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ortalama Rating</p>
              <p className="text-3xl font-bold mt-2 flex items-center gap-1">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
                {stats.avgRating > 0 && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalFeedback} feedback</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ort. Deployment Süresi</p>
              <p className="text-3xl font-bold mt-2">
                {stats.avgDeploymentTime > 0
                  ? `${Math.round(stats.avgDeploymentTime / 60)} dk`
                  : 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Son 30 Gün Kullanım Trendi
        </h2>
        <div className="h-64 flex items-end justify-between gap-1">
          {chartData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5">
                <div
                  className="bg-green-500 rounded-t"
                  style={{
                    height: `${(data.success / Math.max(...chartData.map(d => d.success + d.failure))) * 200}px`,
                  }}
                  title={`Başarılı: ${data.success}`}
                />
                <div
                  className="bg-red-500 rounded-b"
                  style={{
                    height: `${(data.failure / Math.max(...chartData.map(d => d.success + d.failure))) * 200}px`,
                  }}
                  title={`Başarısız: ${data.failure}`}
                />
              </div>
              <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left whitespace-nowrap">
                {data.date}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-sm text-gray-600">Başarılı</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-sm text-gray-600">Başarısız</span>
          </div>
        </div>
      </div>

      {/* Deployment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Deployment İstatistikleri</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Toplam Deployment</span>
              <span className="font-semibold">{stats.totalDeployments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Başarılı</span>
              <span className="font-semibold text-green-600">{stats.successfulDeployments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Başarısız</span>
              <span className="font-semibold text-red-600">{stats.failedDeployments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Başarı Oranı</span>
              <span className="font-semibold">{stats.successRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Feedback İstatistikleri</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Toplam Feedback</span>
              <span className="font-semibold">{stats.totalFeedback}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ortalama Rating</span>
              <span className="font-semibold flex items-center gap-1">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
                {stats.avgRating > 0 && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Kullanım Trendi</span>
              <span className="font-semibold flex items-center gap-1">
                {stats.usageTrend === 'up' && (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Artıyor</span>
                  </>
                )}
                {stats.usageTrend === 'down' && (
                  <>
                    <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                    <span className="text-red-600">Azalıyor</span>
                  </>
                )}
                {stats.usageTrend === 'stable' && (
                  <>
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600">Stabil</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
