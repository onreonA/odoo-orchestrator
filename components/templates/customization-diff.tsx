'use client'

import { GitCompare, Plus, Minus, Edit2, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface CustomizationDiffProps {
  templateId: string
  customizationId: string
  baseTemplateId?: string
}

interface DiffResult {
  modules: {
    added: any[]
    removed: any[]
    modified: any[]
  }
  custom_fields: {
    added: any[]
    removed: any[]
    modified: any[]
  }
  workflows: {
    added: any[]
    removed: any[]
    modified: any[]
  }
  dashboards: {
    added: any[]
    removed: any[]
    modified: any[]
  }
}

export function CustomizationDiff({
  templateId,
  customizationId,
  baseTemplateId,
}: CustomizationDiffProps) {
  const [loading, setLoading] = useState(true)
  const [diff, setDiff] = useState<DiffResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDiff = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get customization
        const customizationResponse = await fetch(
          `/api/templates/customizations/${customizationId}`
        )
        if (!customizationResponse.ok) {
          throw new Error('Customization bulunamadı')
        }
        const customizationData = await customizationResponse.json()
        const customization = customizationData.customization

        // Get base template
        const templateIdToUse = baseTemplateId || customization.base_template_id || templateId
        const templateResponse = await fetch(`/api/templates/${templateIdToUse}`)
        if (!templateResponse.ok) {
          throw new Error('Template bulunamadı')
        }
        const templateData = await templateResponse.json()
        const baseTemplate = templateData.template

        // Compare structures
        const baseStructure = baseTemplate.structure || {}
        const customStructure = customization.customizations || {}

        const diffResult: DiffResult = {
          modules: compareArrays(
            baseStructure.modules || [],
            customStructure.modules || [],
            'technical_name'
          ),
          custom_fields: compareArrays(
            baseStructure.custom_fields || [],
            customStructure.custom_fields || [],
            'field_name'
          ),
          workflows: compareArrays(
            baseStructure.workflows || [],
            customStructure.workflows || [],
            'name'
          ),
          dashboards: compareArrays(
            baseStructure.dashboards || [],
            customStructure.dashboards || [],
            'name'
          ),
        }

        setDiff(diffResult)
      } catch (err: any) {
        setError(err.message || 'Diff hesaplanamadı')
      } finally {
        setLoading(false)
      }
    }

    fetchDiff()
  }, [templateId, customizationId, baseTemplateId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!diff) {
    return null
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <GitCompare className="w-5 h-5" />
        Customization Diff
      </h2>

      <div className="space-y-6">
        {/* Modules */}
        {hasChanges(diff.modules) && <DiffSection title="Modüller" diff={diff.modules} />}

        {/* Custom Fields */}
        {hasChanges(diff.custom_fields) && (
          <DiffSection title="Custom Fields" diff={diff.custom_fields} />
        )}

        {/* Workflows */}
        {hasChanges(diff.workflows) && <DiffSection title="Workflows" diff={diff.workflows} />}

        {/* Dashboards */}
        {hasChanges(diff.dashboards) && <DiffSection title="Dashboards" diff={diff.dashboards} />}

        {!hasChanges(diff.modules) &&
          !hasChanges(diff.custom_fields) &&
          !hasChanges(diff.workflows) &&
          !hasChanges(diff.dashboards) && (
            <div className="text-center py-8 text-gray-500">Base template ile fark yok</div>
          )}
      </div>
    </div>
  )
}

function DiffSection({ title, diff }: { title: string; diff: any }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-3">
        {/* Added */}
        {diff.added && diff.added.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 mb-2">
              <Plus className="w-4 h-4" />
              Eklenen ({diff.added.length})
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
              {diff.added.map((item: any, index: number) => (
                <div key={index} className="text-sm text-green-800">
                  + {item.name || item.technical_name || item.field_name || JSON.stringify(item)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Removed */}
        {diff.removed && diff.removed.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-red-700 mb-2">
              <Minus className="w-4 h-4" />
              Kaldırılan ({diff.removed.length})
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {diff.removed.map((item: any, index: number) => (
                <div key={index} className="text-sm text-red-800">
                  - {item.name || item.technical_name || item.field_name || JSON.stringify(item)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modified */}
        {diff.modified && diff.modified.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
              <Edit2 className="w-4 h-4" />
              Değiştirilen ({diff.modified.length})
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
              {diff.modified.map((item: any, index: number) => (
                <div key={index} className="text-sm text-blue-800">
                  ~ {item.name || item.technical_name || item.field_name || JSON.stringify(item)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function compareArrays(arr1: any[], arr2: any[], key: string) {
  const map1 = new Map(arr1.map(item => [item[key], item]))
  const map2 = new Map(arr2.map(item => [item[key], item]))

  const added = arr2.filter(item => !map1.has(item[key]))
  const removed = arr1.filter(item => !map2.has(item[key]))
  const modified = arr2.filter(item => {
    const item1 = map1.get(item[key])
    return item1 && JSON.stringify(item1) !== JSON.stringify(item)
  })

  return { added, removed, modified }
}

function hasChanges(diff: any): boolean {
  return (
    (diff.added && diff.added.length > 0) ||
    (diff.removed && diff.removed.length > 0) ||
    (diff.modified && diff.modified.length > 0)
  )
}
