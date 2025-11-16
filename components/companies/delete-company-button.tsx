'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteCompanyButtonProps {
  companyId: string
}

export function DeleteCompanyButton({ companyId }: DeleteCompanyButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete company')
      }

      router.refresh()
      router.push('/companies')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete company'
      setError(errorMessage)
      setIsDeleting(false)
      setShowConfirm(false)
      window.alert(errorMessage)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowConfirm(false)
            setError(null)
          }}
          disabled={isDeleting}
        >
          İptal
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Sil
      </Button>
      {error && (
        <div className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
