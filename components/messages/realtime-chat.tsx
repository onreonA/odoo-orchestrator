'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/lib/services/messaging-service'
import { ChatMessages } from './chat-messages'

interface RealtimeChatProps {
  threadId: string
  initialMessages: Message[]
  currentUserId: string
  participantsMap: Map<string, { id: string; full_name?: string; email: string }>
}

export function RealtimeChat({
  threadId,
  initialMessages,
  currentUserId,
  participantsMap,
}: RealtimeChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async payload => {
          // Fetch the full message with sender info
          const { data: newMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            setMessages(prev => [...prev, newMessage as Message])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async payload => {
          // Update message in list
          setMessages(prev =>
            prev.map(msg => (msg.id === payload.new.id ? (payload.new as Message) : msg))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId, supabase])

  return (
    <ChatMessages
      messages={messages}
      currentUserId={currentUserId}
      participantsMap={participantsMap}
    />
  )
}
