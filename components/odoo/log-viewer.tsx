'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Info, AlertTriangle, Bug, ChevronDown, ChevronUp } from 'lucide-react'

interface DeploymentLog {
  id: string
  deploymentId: string
  level: 'debug' | 'info' | 'warning' | 'error'
  message: string
  details?: any
  createdAt: string
}

interface LogViewerProps {
  deploymentId: string
  initialLogs?: DeploymentLog[]
  autoRefresh?: boolean
}

export function LogViewer({ deploymentId, initialLogs = [], autoRefresh = true }: LogViewerProps) {
  const [logs, setLogs] = useState<DeploymentLog[]>(initialLogs)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'debug' | 'info' | 'warning' | 'error'>('all')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (initialLogs.length === 0) {
      fetchLogs()
    }
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchLogs()
    }, 3000) // Refresh every 3 seconds

    return () => clearInterval(interval)
  }, [deploymentId, autoRefresh])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('level', filter)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/odoo/deployments/${deploymentId}/logs?${params}`)
      const data = await response.json()
      if (data.logs) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'debug':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.level === filter)

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Deployment Logs</h3>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Yenileniyor...' : 'Yenile'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {(['all', 'error', 'warning', 'info', 'debug'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                filter === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {level === 'all' ? 'Tümü' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Henüz log kaydı yok</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map(log => {
              const isExpanded = expandedLogs.has(log.id)
              const hasDetails = log.details && Object.keys(log.details).length > 0

              return (
                <div
                  key={log.id}
                  className={`p-4 border-l-4 ${getLevelColor(log.level)} transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-900 break-words">{log.message}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>

                      {hasDetails && (
                        <button
                          onClick={() => toggleLogExpansion(log.id)}
                          className="mt-2 flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Detayları Gizle
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              Detayları Göster
                            </>
                          )}
                        </button>
                      )}

                      {isExpanded && hasDetails && (
                        <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                          <pre className="text-xs text-gray-700 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
