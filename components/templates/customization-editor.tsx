'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Save, Plus, Trash2, Edit2, Eye, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldEditor } from './field-editor'
import { WorkflowEditor } from './workflow-editor'
import { DashboardEditor } from './dashboard-editor'

interface Template {
  template_id: string
  name: string
  type: string
  structure: any
}

interface Customization {
  id: string
  name: string
  customizations: any
  version: string
  status: string
}

interface TemplateCustomizationEditorProps {
  template: Template
  userId: string
  companyId?: string
  existingCustomizations: Customization[]
}

export function TemplateCustomizationEditor({
  template,
  userId,
  companyId,
  existingCustomizations,
}: TemplateCustomizationEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'modules' | 'fields' | 'workflows' | 'dashboards'>(
    'modules'
  )
  const [customizations, setCustomizations] = useState<any>({
    modules: template.structure?.modules || [],
    custom_fields: template.structure?.custom_fields || [],
    workflows: template.structure?.workflows || [],
    dashboards: template.structure?.dashboards || [],
  })
  const [customizationName, setCustomizationName] = useState('')
  const [selectedCustomization, setSelectedCustomization] = useState<Customization | null>(null)

  // Load selected customization
  useEffect(() => {
    if (selectedCustomization) {
      setCustomizations(selectedCustomization.customizations)
      setCustomizationName(selectedCustomization.name)
    } else {
      // Reset to template structure
      setCustomizations({
        modules: template.structure?.modules || [],
        custom_fields: template.structure?.custom_fields || [],
        workflows: template.structure?.workflows || [],
        dashboards: template.structure?.dashboards || [],
      })
      setCustomizationName('')
    }
  }, [selectedCustomization, template])

  const handleSave = async () => {
    if (!customizationName.trim()) {
      setError('Lütfen özelleştirme adı girin')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = selectedCustomization
        ? `/api/templates/customizations/${selectedCustomization.id}`
        : '/api/templates/customizations'

      const method = selectedCustomization ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.template_id,
          base_template_id: template.template_id,
          name: customizationName,
          customizations,
          company_id: companyId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Özelleştirme kaydedilemedi')
      }

      const data = await response.json()
      router.refresh()
      setSelectedCustomization(data.customization)
      alert('Özelleştirme başarıyla kaydedildi!')
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    if (!selectedCustomization) {
      setError('Önce özelleştirmeyi kaydedin')
      return
    }

    if (!confirm('Bu özelleştirmeyi deploy etmek istediğinizden emin misiniz?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/templates/customizations/${selectedCustomization.id}/deploy`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Deployment başarısız')
      }

      alert('Deployment başlatıldı! Deployment sayfasına yönlendiriliyorsunuz...')
      router.push('/odoo/deployments')
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'modules' as const, label: 'Modüller', count: customizations.modules?.length || 0 },
    {
      id: 'fields' as const,
      label: 'Custom Fields',
      count: customizations.custom_fields?.length || 0,
    },
    { id: 'workflows' as const, label: 'Workflows', count: customizations.workflows?.length || 0 },
    {
      id: 'dashboards' as const,
      label: 'Dashboards',
      count: customizations.dashboards?.length || 0,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Existing Customizations */}
      {existingCustomizations.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Mevcut Özelleştirmeler</h3>
          <div className="space-y-2">
            {existingCustomizations.map(customization => (
              <div
                key={customization.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium">{customization.name}</div>
                  <div className="text-sm text-gray-500">
                    Versiyon {customization.version} • {customization.status}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCustomization(customization)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Yükle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customization Name */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Özelleştirme Adı *</label>
        <input
          type="text"
          value={customizationName}
          onChange={e => setCustomizationName(e.target.value)}
          placeholder="Örn: Mobilya Template - Özel Versiyon"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {selectedCustomization && (
          <p className="text-sm text-gray-500 mt-1">
            Mevcut özelleştirme: {selectedCustomization.name} (v{selectedCustomization.version})
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Modüller</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newModule = {
                      name: 'Yeni Modül',
                      technical_name: 'new_module',
                      category: 'other',
                      priority: 5,
                      phase: 1,
                    }
                    setCustomizations({
                      ...customizations,
                      modules: [...(customizations.modules || []), newModule],
                    })
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Modül Ekle
                </Button>
              </div>
              <div className="space-y-2">
                {(customizations.modules || []).map((module: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{module.name}</div>
                      <div className="text-sm text-gray-500">{module.technical_name}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomizations({
                          ...customizations,
                          modules: customizations.modules.filter(
                            (_: any, i: number) => i !== index
                          ),
                        })
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fields' && (
            <FieldEditor
              fields={customizations.custom_fields || []}
              onChange={fields => setCustomizations({ ...customizations, custom_fields: fields })}
            />
          )}

          {activeTab === 'workflows' && (
            <WorkflowEditor
              workflows={customizations.workflows || []}
              onChange={workflows => setCustomizations({ ...customizations, workflows })}
            />
          )}

          {activeTab === 'dashboards' && (
            <DashboardEditor
              dashboards={customizations.dashboards || []}
              onChange={dashboards => setCustomizations({ ...customizations, dashboards })}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          İptal
        </Button>
        {selectedCustomization && (
          <Button variant="outline" onClick={handleDeploy} disabled={loading}>
            Deploy Et
          </Button>
        )}
        <Button onClick={handleSave} disabled={loading || !customizationName.trim()}>
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  )
}

