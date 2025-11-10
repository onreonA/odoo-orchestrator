'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function NotificationsBell() {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Get initial unread count
    async function loadUnreadCount() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: notifications } = await supabase
        .from('notifications')
        .select('id, read, status')
        .eq('user_id', user.id)

      const unread =
        notifications?.filter(n => {
          if ('read' in n && n.read === false) return true
          if ('status' in n && n.status === 'unread') return true
          return false
        }).length || 0
      setUnreadCount(unread)
    }

    loadUnreadCount()

    // Subscribe to new notifications for current user
    async function setupSubscription() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadUnreadCount()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadUnreadCount()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanup = setupSubscription()

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [supabase])

  return (
    <Link href="/notifications" className="relative">
      <Bell className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

