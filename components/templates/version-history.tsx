'use client'

import { useState } from 'react'
import { GitBranch, Clock, User, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Version {
  id: string
  version: string
  changelog: string | null
  is_current: boolean
  created_at: string
  created_by_user: {
    id: string
    full_name: string
    email: string
  } | null
}

interface VersionHistoryProps {
  templateId: string
  versions: Version[]
  canCreateVersions: boolean
}

export function VersionHistory({ templateId, versions, canCreateVersions }: VersionHistoryProps) {
  const [rollingBack, setRollingBack] = useState<string | null>(null)

  const handleRollback = async (versionId: string, version: string) => {
    if (!confirm(`v${version} versiyonuna geri dönmek istediğinizden emin misiniz?`)) {
      return
    }

    setRollingBack(versionId)
    try {
      const response = await fetch(`/api/templates/versions/${versionId}/rollback`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Rollback başarısız')
      }

      alert('Rollback başarılı! Sayfa yenileniyor...')
      window.location.reload()
    } catch (error: any) {
      alert(error.message || 'Rollback sırasında bir hata oluştu')
    } finally {
      setRollingBack(null)
    }
  }

  const handleDeploy = async (versionId: string) => {
    if (!confirm('Bu versiyonu aktif versiyon olarak ayarlamak istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/templates/versions/${versionId}/deploy`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Deployment başarısız')
      }

      alert('Versiyon aktif hale getirildi! Sayfa yenileniyor...')
      window.location.reload()
    } catch (error: any) {
      alert(error.message || 'Deployment sırasında bir hata oluştu')
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <GitBranch className="w-5 h-5" />
        Versiyon Geçmişi
      </h2>

      {versions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Henüz versiyon oluşturulmamış</div>
      ) : (
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className={`
                border rounded-lg p-4 transition-colors
                ${version.is_current ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-lg">v{version.version}</span>
                    {version.is_current && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Aktif
                      </span>
                    )}
                  </div>
                  {version.changelog ? (
                    <p className="text-sm text-gray-700 mb-2">{version.changelog}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic mb-2">Changelog yok</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(version.created_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
                    </div>
                    {version.created_by_user && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.created_by_user.full_name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!version.is_current && canCreateVersions && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleDeploy(version.id)}>
                        Aktif Yap
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRollback(version.id, version.version)}
                        disabled={rollingBack === version.id}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        {rollingBack === version.id ? 'Geri dönülüyor...' : 'Geri Dön'}
                      </Button>
                    </>
                  )}
                  <Link href={`/templates/library/${templateId}/versions/${version.id}`}>
                    <Button variant="outline" size="sm">
                      Detay
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}





