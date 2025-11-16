'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw, Trash2, Settings, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface SyncDetailActionsProps {
  syncId: string
}

export function SyncDetailActions({ syncId }: SyncDetailActionsProps) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch(`/api/calendar/syncs/${syncId}/sync`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Senkronizasyon başarısız oldu')
        setSyncing(false)
        return
      }

      router.refresh()
      setSyncing(false)
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu')
      setSyncing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/calendar/syncs/${syncId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        alert(result.error || 'Silme başarısız oldu')
        setDeleting(false)
        return
      }

      router.push('/calendar/syncs')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu')
      setDeleting(false)
    }
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmDelete(false)}
          disabled={deleting}
        >
          İptal
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? (
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
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
        {syncing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Senkronize Ediliyor...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Senkronize Et
          </>
        )}
      </Button>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
        <Trash2 className="w-4 h-4 mr-2" />
        Sil
      </Button>
    </div>
  )
}
