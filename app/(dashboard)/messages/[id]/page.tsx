import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send } from 'lucide-react'
import { MessagingService } from '@/lib/services/messaging-service'
import { RealtimeChat } from '@/components/messages/realtime-chat'
import { ChatInput } from '@/components/messages/chat-input'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: PageProps) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const { data: thread, error } = await MessagingService.getThreadById(id)

  if (error || !thread) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Sohbet bulunamadı veya erişim izniniz yok.</p>
          <Link href="/messages" className="mt-4 inline-block">
            <Button variant="outline">Geri Dön</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check if user is a participant
  if (!thread.participants.includes(user.id)) {
    redirect('/messages')
  }

  // Get messages
  const { data: messages } = await MessagingService.getMessages(thread.id, { limit: 100 })

  // Get participant profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', thread.participants)

  const participantsMap = new Map(profiles?.map(p => [p.id, p]) || [])

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/messages">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">
                {thread.title || `Sohbet ${thread.id.slice(0, 8)}`}
              </h1>
              <p className="text-sm text-gray-600">
                {thread.participants.length} katılımcı
                {thread.company_id && ' • Firma sohbeti'}
                {thread.project_id && ' • Proje sohbeti'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <RealtimeChat
          threadId={thread.id}
          initialMessages={messages || []}
          currentUserId={user.id}
          participantsMap={participantsMap}
        />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <ChatInput threadId={thread.id} />
      </div>
    </div>
  )
}
