import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare, Users, Building2, FolderKanban } from 'lucide-react'
import { MessagingService } from '@/lib/services/messaging-service'

export default async function MessagesPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get threads
  const { data: threads } = await MessagingService.getThreads(user.id)

  // Get companies for filtering
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .order('name')

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-gray-50 p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mesajlar</h2>
          <Link href="/messages/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Yeni
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <Link
            href="/messages"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Tümü</span>
          </Link>
          <Link
            href="/messages?threadType=direct"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Direkt Mesajlar</span>
          </Link>
          <Link
            href="/messages?threadType=company"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            <span>Firma Sohbetleri</span>
          </Link>
          <Link
            href="/messages?threadType=project"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FolderKanban className="w-4 h-4" />
            <span>Proje Sohbetleri</span>
          </Link>
        </div>

        {/* Company Filter */}
        {companies && companies.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Firmalar</h3>
            <div className="space-y-1">
              {companies.map(company => (
                <Link
                  key={company.id}
                  href={`/messages?companyId=${company.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{company.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold">Mesajlar</h1>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto">
          {threads && threads.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {threads.map(thread => (
                <Link
                  key={thread.id}
                  href={`/messages/${thread.id}`}
                  className={`block p-4 hover:bg-gray-50 transition-colors ${
                    (thread.unread_count || 0) > 0 ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {thread.title || `Thread ${thread.id.slice(0, 8)}`}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            thread.thread_type === 'direct'
                              ? 'bg-purple-100 text-purple-800'
                              : thread.thread_type === 'company'
                                ? 'bg-blue-100 text-blue-800'
                                : thread.thread_type === 'project'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {thread.thread_type === 'direct' && 'Direkt'}
                          {thread.thread_type === 'company' && 'Firma'}
                          {thread.thread_type === 'project' && 'Proje'}
                          {thread.thread_type === 'group' && 'Grup'}
                        </span>
                        {(thread.unread_count || 0) > 0 && (
                          <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>
                      {thread.last_message_preview && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {thread.last_message_preview}
                        </p>
                      )}
                    </div>
                    {thread.last_message_at && (
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(thread.last_message_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Henüz mesaj yok</h3>
              <p className="text-gray-600 mb-6">Yeni bir sohbet başlatın</p>
              <Link href="/messages/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Sohbet Başlat
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


