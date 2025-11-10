'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Package,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Code,
  Workflow,
  FileText,
  Settings,
} from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description: string | null
  industry: string
  modules: Array<{
    name: string
    technical_name: string
    category: string
    config?: Record<string, any>
  }>
  configurations?: Array<{
    type: string
    name: string
    code?: string
    settings?: Record<string, any>
  }>
  workflows?: Array<{
    name: string
    steps: Array<{ name: string; action: string }>
  }>
  custom_fields?: Array<{
    model: string
    field_name: string
    field_type: string
  }>
  reports?: Array<{
    name: string
    template: string
    format: string
  }>
  usage_count: number
  created_at: string
}

export default function TemplateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState<Template | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/templates/${templateId}`)
      const result = await response.json()

      if (result.success) {
        setTemplate(result.data)
      } else {
        setError(result.error || 'Template yüklenemedi')
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Template bulunamadı'}</p>
        </div>
        <Link href="/templates">
          <Button variant="outline">Template Listesine Dön</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/templates">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <p className="text-gray-600 mt-1">
              {template.description || 'Template detayları'}
            </p>
          </div>
        </div>
        <Link href={`/templates/${template.id}/apply`}>
          <Button>Template'i Uygula</Button>
        </Link>
      </div>

      {/* Industry Badge */}
      <div>
        <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
          {template.industry === 'furniture' && 'Mobilya'}
          {template.industry === 'defense' && 'Savunma'}
          {template.industry === 'metal' && 'Metal'}
          {template.industry === 'ecommerce' && 'E-Ticaret'}
          {template.industry || 'Diğer'}
        </span>
      </div>

      {/* Modules */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Modüller ({template.modules?.length || 0})
        </h2>
        {template.modules && template.modules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.modules.map((module, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="font-medium mb-1">{module.name}</div>
                <div className="text-sm text-gray-600 mb-2">
                  {module.technical_name}
                </div>
                {module.category && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {module.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Modül bilgisi yok</p>
        )}
      </div>

      {/* Configurations */}
      {template.configurations && template.configurations.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Konfigürasyonlar ({template.configurations.length})
          </h2>
          <div className="space-y-4">
            {template.configurations.map((config, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="font-medium mb-1">{config.name}</div>
                <div className="text-sm text-gray-600 mb-2">
                  Tip: {config.type}
                </div>
                {config.code && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      Kodu Görüntüle
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {config.code}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflows */}
      {template.workflows && template.workflows.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            İş Akışları ({template.workflows.length})
          </h2>
          <div className="space-y-4">
            {template.workflows.map((workflow, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="font-medium mb-2">{workflow.name}</div>
                {workflow.steps && workflow.steps.length > 0 && (
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    {workflow.steps.map((step, stepIdx) => (
                      <li key={stepIdx}>{step.name}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Fields */}
      {template.custom_fields && template.custom_fields.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Özel Alanlar ({template.custom_fields.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.custom_fields.map((field, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="font-medium mb-1">{field.field_name}</div>
                <div className="text-sm text-gray-600">
                  Model: {field.model} | Tip: {field.field_type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      {template.reports && template.reports.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Raporlar ({template.reports.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.reports.map((report, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="font-medium mb-1">{report.name}</div>
                <div className="text-sm text-gray-600">
                  Format: {report.format} | Template: {report.template}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Stats */}
      {template.usage_count > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <p className="text-blue-800">
              Bu template <strong>{template.usage_count}</strong> kez kullanıldı
            </p>
          </div>
        </div>
      )}

      {/* Apply Button */}
      <div className="flex justify-end">
        <Link href={`/templates/${template.id}/apply`}>
          <Button size="lg">Template'i Firmaya Uygula</Button>
        </Link>
      </div>
    </div>
  )
}



