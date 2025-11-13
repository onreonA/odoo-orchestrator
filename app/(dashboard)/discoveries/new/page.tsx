'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Upload, Mic, FileAudio, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewDiscoveryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])

  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('companies').select('id, name').order('name')
      if (data) {
        setCompanies(data)
        if (data.length > 0 && !companyId) {
          setCompanyId(data[0].id)
        }
      }
    }
    loadCompanies()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type - Mac voice notes (.m4a) are supported
      const validAudioTypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/mp4', // m4a files use this MIME type
        'audio/x-m4a', // Alternative m4a MIME type
        'audio/m4a',
        'audio/ogg',
        'audio/webm',
      ]
      const validExtensions = /\.(mp3|wav|m4a|ogg|webm)$/i

      // Mac voice notes (.m4a) might have empty or incorrect MIME type
      // So we check extension first
      const isValidExtension = validExtensions.test(file.name)
      const isValidType =
        file.type === '' || validAudioTypes.includes(file.type) || isValidExtension

      if (!isValidType) {
        setError(
          'Lütfen geçerli bir ses dosyası seçin (mp3, wav, m4a, ogg, webm). Mac sesli notları (.m4a) desteklenmektedir.'
        )
        setAudioFile(null)
        return
      }

      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('Dosya boyutu çok büyük. Maksimum 100MB olmalıdır.')
        setAudioFile(null)
        return
      }

      setAudioFile(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!audioFile) {
      setError('Lütfen bir ses dosyası seçin')
      setLoading(false)
      return
    }

    if (!companyId) {
      setError('Lütfen bir firma seçin')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Oturum açmanız gerekiyor')
        setLoading(false)
        router.push('/login')
        return
      }

      // Create form data
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('companyId', companyId)

      // Upload and analyze
      console.log('[Discovery UI] Starting upload...', {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        companyId,
      })

      const response = await fetch('/api/ai/discovery', {
        method: 'POST',
        body: formData,
      })

      console.log('[Discovery UI] Response status:', response.status)

      const result = await response.json()
      console.log('[Discovery UI] Response data:', {
        success: result.success,
        hasId: !!result.data?.id,
        error: result.error,
        warning: result.data?.warning,
        fullData: result.data,
      })

      if (!response.ok) {
        const errorMessage = result.error || result.details || 'Discovery başarısız oldu'
        console.error('[Discovery UI] Error:', errorMessage)

        // Show user-friendly error message
        if (result.details) {
          setError(`❌ ${errorMessage}\n\n${result.details}`)
        } else {
          setError(`❌ ${errorMessage}`)
        }
        setLoading(false)
        return
      }

      if (!result.success) {
        const errorMessage = result.error || result.details || 'Discovery başarısız oldu'
        console.error('[Discovery UI] Error:', errorMessage)

        // Show user-friendly error message
        if (result.details) {
          setError(`❌ ${errorMessage}\n\n${result.details}`)
        } else {
          setError(`❌ ${errorMessage}`)
        }
        setLoading(false)
        return
      }

      // Check for database save warning
      if (result.data?.warning) {
        console.warn('[Discovery UI] Warning:', result.data.warning)
        setError(
          `⚠️ ${result.data.warning}. Discovery verileri kaydedilemedi ama analiz tamamlandı.`
        )
        setLoading(false)
        // Still show success but warn user
        setTimeout(() => {
          router.push('/discoveries')
          router.refresh()
        }, 3000)
        return
      }

      // Redirect to discovery result page or list if no ID
      if (result.data?.id) {
        console.log('[Discovery UI] Redirecting to discovery:', result.data.id)
        router.push(`/discoveries/${result.data.id}`)
        router.refresh()
      } else {
        console.log('[Discovery UI] No ID, redirecting to list')
        setError('Discovery tamamlandı ancak veritabanına kaydedilemedi. Lütfen tekrar deneyin.')
        setLoading(false)
        setTimeout(() => {
          router.push('/discoveries')
          router.refresh()
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Discovery Başlat</h1>
        <p className="text-gray-600 mt-1">Firma analizi için toplantı ses kaydını yükleyin</p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 border border-gray-200 space-y-6"
      >
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Company Selection */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium mb-1">
            Firma Seçin <span className="text-red-500">*</span>
          </label>
          <select
            id="company"
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Firma seçin</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Ses Kaydı <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <label
              htmlFor="audio-file"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {audioFile ? (
                  <>
                    <FileAudio className="w-12 h-12 text-blue-500 mb-2" />
                    <p className="text-sm font-medium text-gray-700">{audioFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Dosyaya tıklayın</span> veya sürükleyip
                      bırakın
                    </p>
                    <p className="text-xs text-gray-500">MP3, WAV, M4A, OGG (MAX. 100MB)</p>
                  </>
                )}
              </div>
              <input
                id="audio-file"
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                onChange={handleFileChange}
                className="hidden"
                required
              />
            </label>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mic className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Nasıl Çalışır?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600">
                <li>Ses kaydınızı yükleyin</li>
                <li>AI otomatik olarak transkript oluşturur</li>
                <li>Firma süreçleri analiz edilir</li>
                <li>Odoo modül önerileri yapılır</li>
                <li>Detaylı rapor oluşturulur</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
          <Link href="/companies">
            <Button variant="outline" type="button" disabled={loading}>
              İptal
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !audioFile || !companyId}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analiz Ediliyor...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Discovery Başlat
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
