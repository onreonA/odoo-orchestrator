'use client'

import { useState } from 'react'
import { GitCompare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Version {
  id: string
  version: string
  changelog: string | null
  is_current: boolean
}

interface VersionComparisonProps {
  templateId: string
  versions: Version[]
}

export function VersionComparison({ templateId, versions }: VersionComparisonProps) {
  const [version1, setVersion1] = useState<string>(versions[0]?.id || '')
  const [version2, setVersion2] = useState<string>(
    versions.find(v => v.is_current)?.id || versions[0]?.id || ''
  )
  const [comparing, setComparing] = useState(false)
  const [comparison, setComparison] = useState<any>(null)

  const handleCompare = async () => {
    if (!version1 || !version2 || version1 === version2) {
      alert('Lütfen farklı iki versiyon seçin')
      return
    }

    setComparing(true)
    try {
      const response = await fetch(
        `/api/templates/versions/compare?version1=${version1}&version2=${version2}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Karşılaştırma başarısız')
      }

      const data = await response.json()
      setComparison(data.comparison)
    } catch (error: any) {
      alert(error.message || 'Karşılaştırma sırasında bir hata oluştu')
    } finally {
      setComparing(false)
    }
  }

  const getVersionLabel = (versionId: string) => {
    const version = versions.find(v => v.id === versionId)
    return version ? `v${version.version}${version.is_current ? ' (Aktif)' : ''}` : ''
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <GitCompare className="w-5 h-5" />
        Versiyon Karşılaştırma
      </h2>

      <div className="space-y-4">
        {/* Version Selection */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Versiyon 1</label>
            <select
              value={version1}
              onChange={e => setVersion1(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>
                  {getVersionLabel(v.id)}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-6">
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Versiyon 2</label>
            <select
              value={version2}
              onChange={e => setVersion2(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>
                  {getVersionLabel(v.id)}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-6">
            <Button
              onClick={handleCompare}
              disabled={comparing || !version1 || !version2 || version1 === version2}
            >
              {comparing ? 'Karşılaştırılıyor...' : 'Karşılaştır'}
            </Button>
          </div>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-4">Karşılaştırma Sonuçları</h3>
            <div className="space-y-4">
              {/* Modules Comparison */}
              {comparison.modules && (
                <div>
                  <h4 className="font-medium mb-2">Modüller</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-600">Eklenen</div>
                        <div className="text-green-700">
                          {comparison.modules.added?.length || 0}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Kaldırılan</div>
                        <div className="text-red-700">
                          {comparison.modules.removed?.length || 0}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Değişen</div>
                        <div className="text-blue-700">
                          {comparison.modules.modified?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Fields Comparison */}
              {comparison.custom_fields && (
                <div>
                  <h4 className="font-medium mb-2">Custom Fields</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-600">Eklenen</div>
                        <div className="text-green-700">
                          {comparison.custom_fields.added?.length || 0}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Kaldırılan</div>
                        <div className="text-red-700">
                          {comparison.custom_fields.removed?.length || 0}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Değişen</div>
                        <div className="text-blue-700">
                          {comparison.custom_fields.modified?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Workflows Comparison */}
              {comparison.workflows && (
                <div>
                  <h4 className="font-medium mb-2">Workflows</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-600">Eklenen</div>
                        <div className="text-green-700">
                          {comparison.workflows.added?.length || 0}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Kaldırılan</div>
                        <div className="text-red-700">
                          {comparison.workflows.removed?.length || 0}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600">Değişen</div>
                        <div className="text-blue-700">
                          {comparison.workflows.modified?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}





