'use client'

import { useState, useEffect } from 'react'
import { Play, Clock, CheckCircle2, XCircle, AlertCircle, BarChart3 } from 'lucide-react'

interface TestRun {
  id: string
  testType: string
  status: string
  results: any[]
  startedAt: string
  completedAt?: string
}

interface TestStats {
  totalRuns: number
  successRate: number
  averageDuration: number
  lastRun?: TestRun
}

export default function TestsPage() {
  const [runs, setRuns] = useState<TestRun[]>([])
  const [stats, setStats] = useState<TestStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch('/api/tests/runs')
      const data = await response.json()
      if (data.success) {
        setRuns(data.data.runs || [])
        setStats(data.data.stats || null)
      }
    } catch (error) {
      console.error('Error loading test data:', error)
    } finally {
      setLoading(false)
    }
  }

  const runTests = async (testType: string) => {
    setRunning(true)
    try {
      const response = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType }),
      })
      const data = await response.json()
      if (data.success) {
        // Reload data after a delay
        setTimeout(() => {
          loadData()
          setRunning(false)
        }, 2000)
      } else {
        setRunning(false)
        alert('Test çalıştırma hatası: ' + data.error)
      }
    } catch (error: any) {
      setRunning(false)
      alert('Test çalıştırma hatası: ' + error.message)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'running':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
        <h1 className="text-3xl font-bold mb-2">Test Yönetimi</h1>
        <p className="text-gray-600">Testleri çalıştırın ve sonuçlarını görüntüleyin</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Test</p>
                <p className="text-2xl font-bold">{stats.totalRuns}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Başarı Oranı</p>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ortalama Süre</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageDuration / 1000)}s</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Son Test</p>
                <p className="text-sm font-semibold">
                  {stats.lastRun
                    ? new Date(stats.lastRun.startedAt).toLocaleDateString('tr-TR')
                    : 'Yok'}
                </p>
              </div>
              <Play className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Run Tests Buttons */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Testleri Çalıştır</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={() => runTests('unit')}
            disabled={running}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Unit Tests
          </button>
          <button
            onClick={() => runTests('e2e')}
            disabled={running}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            E2E Tests
          </button>
          <button
            onClick={() => runTests('visual')}
            disabled={running}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Visual Tests
          </button>
          <button
            onClick={() => runTests('performance')}
            disabled={running}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Performance
          </button>
          <button
            onClick={() => runTests('all')}
            disabled={running}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tüm Testler
          </button>
        </div>
        {running && (
          <div className="mt-4 text-blue-600 flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin" />
            Testler çalışıyor...
          </div>
        )}
      </div>

      {/* Recent Runs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Son Test Çalıştırmaları</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Tipi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sonuçlar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlangıç</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Süre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Henüz test çalıştırılmadı
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium">{run.testType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                        {getStatusIcon(run.status)}
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {run.results?.map((r: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className={r.status === 'passed' ? 'text-green-600' : 'text-red-600'}>
                              {r.passed || 0} passed, {r.failed || 0} failed
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(run.startedAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.completedAt
                        ? `${Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

