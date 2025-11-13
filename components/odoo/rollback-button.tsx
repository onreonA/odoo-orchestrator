'use client'

import { useState } from 'react'
import { RotateCcw, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RollbackButtonProps {
  deploymentId: string
}

export function RollbackButton({ deploymentId }: RollbackButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRollback = async () => {
    if (!confirm("Bu deployment'ı geri almak istediğinizden emin misiniz?")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/odoo/deployments/${deploymentId}/rollback`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Rollback failed')
      }

      router.refresh()
      alert('Deployment başarıyla geri alındı')
    } catch (error: any) {
      alert(`Rollback hatası: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRollback}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
      Rollback
    </button>
  )
}
