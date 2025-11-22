'use client'

import { GitCommit, Calendar, User, Tag } from 'lucide-react'

interface Version {
  id: string
  version: string
  changelog: string | null
  created_at: string
  created_by_user?: {
    full_name: string
    email: string
  }
  is_current: boolean
}

interface ChangelogViewProps {
  templateId: string
  versions: Version[]
}

export function ChangelogView({ templateId, versions }: ChangelogViewProps) {
  const sortedVersions = [...versions].sort((a, b) => {
    // Sort by version number (semantic versioning)
    const versionA = a.version.split('.').map(Number)
    const versionB = b.version.split('.').map(Number)

    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
      const numA = versionA[i] || 0
      const numB = versionB[i] || 0
      if (numA !== numB) {
        return numB - numA // Descending order (newest first)
      }
    }
    return 0
  })

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <GitCommit className="w-5 h-5" />
        Changelog
      </h2>

      {sortedVersions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Henüz changelog kaydı yok</div>
      ) : (
        <div className="space-y-6">
          {sortedVersions.map((version, index) => (
            <div
              key={version.id}
              className={`
                relative pl-8 pb-6
                ${index < sortedVersions.length - 1 ? 'border-l-2 border-gray-200' : ''}
              `}
            >
              {/* Version Badge */}
              <div className="absolute left-0 top-0 -translate-x-1/2">
                <div
                  className={`
                    w-4 h-4 rounded-full border-2
                    ${version.is_current ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}
                  `}
                />
              </div>

              {/* Version Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold text-lg">v{version.version}</span>
                  {version.is_current && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(version.created_at).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {version.created_by_user && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {version.created_by_user.full_name}
                    </div>
                  )}
                </div>
              </div>

              {/* Changelog Content */}
              {version.changelog ? (
                <div className="bg-gray-50 rounded-lg p-4 mt-2">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {version.changelog}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic mt-2">Changelog bilgisi yok</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



