'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Code,
  FileCode,
  Workflow,
  Shield,
  FileText,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { ConfigurationCodeViewer } from '@/components/configurations/configuration-code-viewer'
import { ConfigurationReviewPanel } from '@/components/configurations/configuration-review-panel'
import { ConfigurationDeploymentStatus } from '@/components/configurations/configuration-deployment-status'
import { ConfigurationVersionHistory } from '@/components/configurations/configuration-version-history'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Configuration {
  id: string
  company_id: string
  type: 'model' | 'view' | 'workflow' | 'security' | 'report'
  name: string
  natural_language_input?: string
  requirements?: any
  generated_code?: string
  file_path?: string
  status: 'draft' | 'pending_review' | 'needs_changes' | 'approved' | 'rejected' | 'deployed'
  version?: number
  created_by?: string
  created_at: string
  updated_at: string
  companies?: {
    name: string
  }
}

export default function ConfigurationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const configurationId = params.id as string
  const [configuration, setConfiguration] = useState<Configuration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    fetchConfiguration()
    fetchUserRole()
  }, [configurationId])

  const fetchUserRole = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile) {
        setUserRole(profile.role)
      }
    }
  }

  const fetchConfiguration = async () => {
    try {
      const response = await fetch(`/api/configurations/${configurationId}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Konfigürasyon bulunamadı')
      }

      const data = await response.json()
      setConfiguration(data.configuration)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!configuration?.natural_language_input) {
      alert('Lütfen önce doğal dil açıklaması ekleyin')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch(`/api/configurations/${configurationId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naturalLanguageInput: configuration.natural_language_input,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Kod üretilemedi')
      }

      await fetchConfiguration()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const getTypeIcon = (type: Configuration['type']) => {
    switch (type) {
      case 'model':
        return <Code className="w-6 h-6 text-blue-500" />
      case 'view':
        return <FileCode className="w-6 h-6 text-green-500" />
      case 'workflow':
        return <Workflow className="w-6 h-6 text-purple-500" />
      case 'security':
        return <Shield className="w-6 h-6 text-red-500" />
      case 'report':
        return <FileText className="w-6 h-6 text-orange-500" />
      default:
        return <Code className="w-6 h-6 text-gray-500" />
    }
  }

  const getStatusIcon = (status: Configuration['status']) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'pending_review':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'needs_changes':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: Configuration['status']) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-700'
      case 'approved':
        return 'bg-blue-100 text-blue-700'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-700'
      case 'needs_changes':
        return 'bg-orange-100 text-orange-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: Configuration['status']) => {
    switch (status) {
      case 'draft':
        return 'Taslak'
      case 'pending_review':
        return 'İncelemede'
      case 'needs_changes':
        return 'Değişiklik Gerekli'
      case 'approved':
        return 'Onaylandı'
      case 'rejected':
        return 'Reddedildi'
      case 'deployed':
        return 'Deploy Edildi'
      default:
        return status
    }
  }

  const getLanguage = (type: Configuration['type']) => {
    switch (type) {
      case 'model':
        return 'python'
      case 'view':
      case 'workflow':
      case 'security':
      case 'report':
        return 'xml'
      default:
        return 'python'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error || !configuration) {
    return (
      <div className="space-y-6">
        <Link href="/configurations">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft />}>
            Geri
          </Button>
        </Link>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Hata!</strong>
          <span className="block sm:inline"> {error || 'Konfigürasyon bulunamadı'}</span>
        </div>
      </div>
    )
  }

  const canEdit = userRole === 'super_admin' || userRole === 'consultant'
  const canReview = userRole === 'super_admin' || userRole === 'consultant'
  const canDeploy = userRole === 'super_admin' || userRole === 'consultant'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/configurations">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft />}>
              Geri
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getTypeIcon(configuration.type)}
            <div>
              <h1 className="text-3xl font-bold">{configuration.name}</h1>
              <p className="text-gray-600 mt-1">
                {configuration.companies?.name || 'Firma bilgisi yok'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(configuration.status)}
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(configuration.status)}`}
          >
            {getStatusLabel(configuration.status)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center gap-2">
          {!configuration.generated_code && configuration.natural_language_input && (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              leftIcon={generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
            >
              {generating ? 'Kod Üretiliyor...' : 'AI ile Kod Üret'}
            </Button>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Tip</div>
          <div className="text-lg font-semibold mt-1 capitalize">{configuration.type}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Versiyon</div>
          <div className="text-lg font-semibold mt-1">v{configuration.version || 1}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Oluşturulma</div>
          <div className="text-lg font-semibold mt-1">
            {format(new Date(configuration.created_at), 'dd MMM yyyy', { locale: tr })}
          </div>
        </div>
      </div>

      {/* Natural Language Input */}
      {configuration.natural_language_input && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Doğal Dil Açıklaması</h3>
          <p className="text-gray-700">{configuration.natural_language_input}</p>
        </div>
      )}

      {/* Generated Code */}
      <ConfigurationCodeViewer
        code={configuration.generated_code || null}
        filePath={configuration.file_path || null}
        language={getLanguage(configuration.type)}
      />

      {/* Review Panel */}
      <ConfigurationReviewPanel
        configurationId={configurationId}
        currentStatus={configuration.status}
        canReview={canReview}
        onReviewSubmitted={fetchConfiguration}
      />

      {/* Deployment Status */}
      <ConfigurationDeploymentStatus
        configurationId={configurationId}
        currentStatus={configuration.status}
        canDeploy={canDeploy}
        onDeploy={fetchConfiguration}
      />

      {/* Version History */}
      <ConfigurationVersionHistory configurationId={configurationId} />
    </div>
  )
}




