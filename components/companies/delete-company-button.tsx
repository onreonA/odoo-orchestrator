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
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Silme işlemi başarısız')
        setLoading(false)
        setShowConfirm(false)
        return
      }

      // Redirect to companies list
      router.push('/companies')
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Bir hata oluştu')
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          İptal
        </Button>
        <Button
          variant="danger"
          leftIcon={<Trash2 />}
          onClick={handleDelete}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Siliniyor...' : 'Evet, Sil'}
        </Button>
      </div>
    )
  }

  return (
    <Button variant="danger" leftIcon={<Trash2 />} onClick={handleDelete} disabled={loading}>
      Sil
    </Button>
  )
}



