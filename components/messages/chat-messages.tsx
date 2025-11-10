'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/lib/services/messaging-service'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Paperclip, Download, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface ChatMessagesProps {
  messages: Message[]
  currentUserId: string
  participantsMap: Map<string, { id: string; full_name?: string; email: string }>
}

export function ChatMessages({ messages, currentUserId, participantsMap }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getSenderName = (senderId: string) => {
    const participant = participantsMap.get(senderId)
    return participant?.full_name || participant?.email || 'Bilinmeyen'
  }

  const isSameSender = (current: Message, previous: Message | undefined) => {
    return previous && current.sender_id === previous.sender_id
  }

  const shouldShowDate = (current: Message, previous: Message | undefined) => {
    if (!previous) return true
    const currentDate = new Date(current.created_at)
    const previousDate = new Date(previous.created_at)
    return currentDate.toDateString() !== previousDate.toDateString()
  }

  return (
    <div className="p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>Henüz mesaj yok. İlk mesajı gönderin!</p>
        </div>
      ) : (
        messages.map((message, index) => {
          const previous = index > 0 ? messages[index - 1] : undefined
          const showDate = shouldShowDate(message, previous)
          const showSender = !isSameSender(message, previous)
          const isOwn = message.sender_id === currentUserId

          return (
            <div key={message.id}>
              {showDate && (
                <div className="text-center text-xs text-gray-500 my-4">
                  {format(new Date(message.created_at), 'd MMMM yyyy', { locale: tr })}
                </div>
              )}
              <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                {showSender && (
                  <div className={`flex-shrink-0 ${isOwn ? 'order-2' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {getSenderName(message.sender_id)
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  </div>
                )}
                {!showSender && <div className="w-8" />}
                <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                  {showSender && (
                    <div className={`text-xs text-gray-600 mb-1 ${isOwn ? 'text-right' : ''}`}>
                      {getSenderName(message.sender_id)}
                    </div>
                  )}
                  <div
                    className={`inline-block rounded-lg px-4 py-2 max-w-[70%] ${
                      message.message_type === 'ai_response'
                        ? 'bg-purple-100 border-2 border-purple-300 text-purple-900'
                        : isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    {message.message_type === 'ai_response' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-200">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-700">AI Asistanı</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                              isOwn
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            <Paperclip className="w-4 h-4" />
                            <span className="truncate flex-1">{attachment.name}</span>
                            <Download className="w-4 h-4" />
                          </a>
                        ))}
                      </div>
                    )}
                    
                    <div
                      className={`text-xs mt-1 ${
                        message.message_type === 'ai_response'
                          ? 'text-purple-600'
                          : isOwn
                            ? 'text-blue-100'
                            : 'text-gray-500'
                      }`}
                    >
                      {format(new Date(message.created_at), 'HH:mm')}
                    </div>
                    {message.ai_enhanced && message.message_type !== 'ai_response' && (
                      <div className="text-xs text-gray-500 mt-1">
                        ✨ AI ile geliştirildi
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}

