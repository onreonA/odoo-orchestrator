'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateVersionFormProps {
  templateId: string
  templateStructure: any
  currentVersion: string
  userId: string
}

export function CreateVersionForm({
  templateId,
  templateStructure,
  currentVersion,
  userId,
}: CreateVersionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    version: '',
    changelog: '',
  })

  // Calculate next version
  const calculateNextVersion = () => {
    const parts = currentVersion.split('.')
    if (parts.length === 3) {
      const major = parseInt(parts[0])
      const minor = parseInt(parts[1])
      const patch = parseInt(parts[2])
      return `${major}.${minor + 1}.0` // Increment minor version
    }
    return '1.0.0'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.version.trim()) {
      setError('Lütfen versiyon numarası girin')
      return
    }

    // Validate version format (semantic versioning)
    const versionRegex = /^\d+\.\d+\.\d+$/
    if (!versionRegex.test(formData.version)) {
      setError('Versiyon formatı geçersiz. Örnek: 1.0.0')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/templates/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          version: formData.version,
          changelog: formData.changelog || null,
          structure: templateStructure,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Versiyon oluşturulamadı')
      }

      const data = await response.json()
      router.push(`/templates/library/${templateId}/versions`)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Version Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Versiyon Numarası *
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={formData.version}
              onChange={e => setFormData({ ...formData, version: e.target.value })}
              placeholder={calculateNextVersion()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({ ...formData, version: calculateNextVersion() })}
            >
              Önerilen: {calculateNextVersion()}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Semantic versioning formatı kullanın (örn: 1.0.0, 1.1.0, 2.0.0)
          </p>
        </div>

        {/* Changelog */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Changelog</label>
          <textarea
            value={formData.changelog}
            onChange={e => setFormData({ ...formData, changelog: e.target.value })}
            rows={6}
            placeholder="Bu versiyondaki değişiklikleri açıklayın..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Current Version Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Mevcut Versiyon:</span> v{currentVersion}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            İptal
          </Button>
          <Button type="submit" disabled={loading || !formData.version.trim()}>
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Versiyon Oluştur
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

