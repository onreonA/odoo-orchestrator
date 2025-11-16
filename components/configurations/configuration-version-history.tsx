'use client'

import { useState, useEffect } from 'react'
import { GitBranch, Clock, User, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Version {
  id: string
  version_number: number
  generated_code: string
  changes_summary?: string
  deployed_at?: string
  deployed_by?: string
  deployed_by_user?: {
    full_name?: string
    email?: string
  }
  profiles?: {
    full_name?: string
    email?: string
  }
  created_at: string
}

interface ConfigurationVersionHistoryProps {
  configurationId: string
}

export function ConfigurationVersionHistory({ configurationId }: ConfigurationVersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [configurationId])

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/configurations/${configurationId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeployedByUser = (version: Version) => {
    if (version.deployed_by_user) {
      return version.deployed_by_user.full_name || version.deployed_by_user.email || 'Bilinmiyor'
    }
    if (version.profiles) {
      return version.profiles.full_name || version.profiles.email || 'Bilinmiyor'
    }
    return 'Bilinmiyor'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="text-center text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <GitBranch className="w-5 h-5" />
        Versiyon Geçmişi
      </h3>

      {versions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <GitBranch className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Henüz versiyon yok</p>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map(version => (
            <div
              key={version.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">v{version.version_number}</span>
                  {version.deployed_at && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Deploy Edildi
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(version.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                </span>
              </div>

              {version.changes_summary && (
                <p className="text-sm text-gray-600 mb-2">{version.changes_summary}</p>
              )}

              {version.deployed_at && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <User className="w-3 h-3" />
                  <span>
                    {getDeployedByUser(version)} tarafından{' '}
                    {format(new Date(version.deployed_at), 'dd MMM yyyy HH:mm', { locale: tr })}{' '}
                    tarihinde deploy edildi
                  </span>
                </div>
              )}

              <button
                onClick={() =>
                  setExpandedVersion(expandedVersion === version.id ? null : version.id)
                }
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {expandedVersion === version.id ? 'Kodu Gizle' : 'Kodu Göster'}
              </button>

              {expandedVersion === version.id && (
                <div className="mt-4 p-4 bg-gray-900 rounded-lg overflow-x-auto">
                  <pre className="text-sm text-gray-100 font-mono">
                    <code>{version.generated_code}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

