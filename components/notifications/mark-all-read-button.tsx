'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCheck, Loader2 } from 'lucide-react'

export function MarkAllReadButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
      })

      if (!response.ok) {
        const result = await response.json()
        alert(result.error || 'İşlem başarısız oldu')
        setLoading(false)
        return
      }

      router.refresh()
      setLoading(false)
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleMarkAllRead} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          İşleniyor...
        </>
      ) : (
        <>
          <CheckCheck className="w-4 h-4 mr-2" />
          Tümünü Okundu İşaretle
        </>
      )}
    </Button>
  )
}
