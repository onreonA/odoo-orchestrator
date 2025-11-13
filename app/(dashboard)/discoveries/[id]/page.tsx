import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Download, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function DiscoveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: discovery, error } = await supabase
    .from('discoveries')
    .select(
      `
      *,
      company:companies(id, name, industry),
      project:projects(id, name)
    `
    )
    .eq('id', id)
    .single()

  if (error || !discovery) {
    notFound()
  }

  const extractedInfo = discovery.ai_summary as any
  const processes = (discovery.extracted_processes as string[]) || []
  const painPoints = (discovery.pain_points as string[]) || []
  const opportunities = (discovery.opportunities as string[]) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discovery Sonuçları</h1>
          <p className="text-gray-600 mt-1">
            {discovery.company?.name || 'Firma'} - {discovery.meeting_type || 'İlk Toplantı'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Raporu İndir
          </Button>
          <Link href={`/companies/${discovery.company_id}`}>
            <Button variant="outline" size="sm">
              Firmaya Dön
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3">
          {discovery.analysis_status === 'completed' ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : discovery.analysis_status === 'analyzing' ? (
            <Clock className="w-6 h-6 text-blue-500" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          )}
          <div>
            <div className="font-medium">
              Durum:{' '}
              {discovery.analysis_status === 'completed'
                ? 'Tamamlandı'
                : discovery.analysis_status === 'analyzing'
                  ? 'Analiz Ediliyor'
                  : 'Beklemede'}
            </div>
            <div className="text-sm text-gray-600">
              Tamamlanma: %{discovery.completion_percentage || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Transcript */}
      {discovery.transcript && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Toplantı Transkripti
          </h2>
          <div className="prose max-w-none">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{discovery.transcript}</p>
          </div>
        </div>
      )}

      {/* Extracted Information */}
      {extractedInfo && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Çıkarılan Bilgiler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {extractedInfo.company_info && (
              <div>
                <h3 className="font-medium mb-2">Firma Bilgileri</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {Object.entries(extractedInfo.company_info).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {processes && processes.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Tespit Edilen Süreçler</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {processes.map((process: string, idx: number) => (
                    <li key={idx}>• {process}</li>
                  ))}
                </ul>
              </div>
            )}

            {painPoints && painPoints.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Sorunlar</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {painPoints.map((point: string, idx: number) => (
                    <li key={idx}>• {point}</li>
                  ))}
                </ul>
              </div>
            )}

            {opportunities && opportunities.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Fırsatlar</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {opportunities.map((opp: string, idx: number) => (
                    <li key={idx}>• {opp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Module Suggestions - Get from processes table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Önerilen Odoo Modülleri</h2>
        <div className="text-sm text-gray-600">
          Modül önerileri süreç analizi tamamlandıktan sonra görüntülenecek.
        </div>
      </div>
    </div>
  )
}
