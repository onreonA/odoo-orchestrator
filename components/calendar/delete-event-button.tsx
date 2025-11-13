'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteEventButtonProps {
  eventId: string
}

export function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        alert(result.error || 'Etkinlik silinemedi')
        setLoading(false)
        setConfirming(false)
        return
      }

      router.push('/calendar')
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
          {loading ? 'Siliniyor...' : 'Evet, Sil'}
        </Button>
      </div>
    )
  }

  return (
    <Button variant="danger" onClick={handleDelete} disabled={loading}>
      <Trash2 className="w-4 h-4 mr-2" />
      Sil
    </Button>
  )
}
