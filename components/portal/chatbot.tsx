'use client'

import { useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ text: string; sender: 'user' | 'bot' }>>([])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return

    setMessages([...messages, { text: input, sender: 'user' }])
    setInput('')

    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          text: 'Merhaba! Size nasıl yardımcı olabilirim?',
          sender: 'bot',
        },
      ])
    }, 500)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--brand-primary-500)] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
        aria-label="Chatbot'u aç"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-[var(--neutral-200)] flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-[var(--neutral-200)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--brand-primary-500)]" />
          <h3 className="font-semibold">Destek Chatbot</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[var(--neutral-500)] hover:text-[var(--neutral-700)]"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-[var(--neutral-500)] mt-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Merhaba! Size nasıl yardımcı olabilirim?</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender === 'user'
                    ? 'bg-[var(--brand-primary-500)] text-white'
                    : 'bg-[var(--neutral-100)] text-[var(--neutral-700)]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--neutral-200)] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Mesajınızı yazın..."
          className="flex-1 px-3 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
        />
        <Button onClick={handleSend} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}


