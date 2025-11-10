'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Reply, ReplyAll, Forward, Star, Trash2, Archive, MoreVertical, Loader2 } from 'lucide-react'
import { Email } from '@/lib/services/email-service'

interface EmailActionsProps {
  email: Email
}

export function EmailActions({ email }: EmailActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: string, value?: any) => {
    setLoading(action)
    try {
      const response = await fetch(`/api/emails/${email.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [action]: value }),
      })

      if (!response.ok) {
        const result = await response.json()
        alert(result.error || 'İşlem başarısız oldu')
        setLoading(null)
        return
      }

      router.refresh()
      setLoading(null)
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu')
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bu emaili silmek istediğinize emin misiniz?')) {
      return
    }

    setLoading('delete')
    try {
      const response = await fetch(`/api/emails/${email.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        alert(result.error || 'Silme başarısız oldu')
        setLoading(null)
        return
      }

      router.push('/emails')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu')
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/emails/compose?replyTo=${email.id}`)}
      >
        <Reply className="w-4 h-4 mr-2" />
        Yanıtla
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/emails/compose?replyTo=${email.id}&replyAll=true`)}
      >
        <ReplyAll className="w-4 h-4 mr-2" />
        Tümüne Yanıtla
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/emails/compose?forward=${email.id}`)}
      >
        <Forward className="w-4 h-4 mr-2" />
        İlet
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('starred', !email.starred)}
        disabled={loading === 'starred'}
      >
        {loading === 'starred' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Star
            className={`w-4 h-4 mr-2 ${email.starred ? 'fill-yellow-500 text-yellow-500' : ''}`}
          />
        )}
        {email.starred ? 'Yıldızı Kaldır' : 'Yıldızla'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('email_status', 'archived')}
        disabled={loading === 'archive'}
      >
        {loading === 'archive' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Archive className="w-4 h-4 mr-2" />
        )}
        Arşivle
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        disabled={loading === 'delete'}
      >
        {loading === 'delete' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4 mr-2" />
        )}
        Sil
      </Button>
    </div>
  )
}


