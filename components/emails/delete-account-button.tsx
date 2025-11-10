'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteAccountButtonProps {
  accountId: string
}

export function DeleteAccountButton({ accountId }: DeleteAccountButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/emails/accounts/${accountId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        alert(result.error || 'Silme başarısız oldu')
        setLoading(false)
        setConfirming(false)
        return
      }

      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={loading}>
          İptal
        </Button>
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Siliniyor...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Evet, Sil
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
      <Trash2 className="w-4 h-4 mr-2" />
      Sil
    </Button>
  )
}


