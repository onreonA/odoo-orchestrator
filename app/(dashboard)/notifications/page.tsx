import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bell, Check, CheckCheck, Mail, Calendar, MessageSquare, Building2, FolderKanban } from 'lucide-react'
import { MessagingService } from '@/lib/services/messaging-service'
import { MarkAllReadButton } from '@/components/notifications/mark-all-read-button'

export default async function NotificationsPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get notifications
  const { data: notifications } = await MessagingService.getNotifications(user.id, {
    limit: 100,
  })

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5" />
      case 'email':
        return <Mail className="w-5 h-5" />
      case 'calendar':
        return <Calendar className="w-5 h-5" />
      case 'project':
        return <FolderKanban className="w-5 h-5" />
      case 'mention':
        return <MessageSquare className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 text-blue-600'
      case 'email':
        return 'bg-purple-100 text-purple-600'
      case 'calendar':
        return 'bg-green-100 text-green-600'
      case 'project':
        return 'bg-orange-100 text-orange-600'
      case 'mention':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bildirimler</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {/* Notifications List */}
      {notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map(notification => (
            <a
              key={notification.id}
              href={notification.action_url || '#'}
              className={`block p-4 rounded-xl border transition-colors ${
                ('read' in notification && notification.read) ||
                ('status' in notification && notification.status === 'read')
                  ? 'bg-white border-gray-200 hover:bg-gray-50'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(
                    notification.notification_type
                  )}`}
                >
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {(!('read' in notification) || !notification.read) &&
                        (!('status' in notification) || notification.status !== 'read') && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz bildirim yok</h3>
          <p className="text-gray-600">Yeni bildirimler burada görünecek</p>
        </div>
      )}
    </div>
  )
}

