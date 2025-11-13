'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Send, Loader2, Paperclip, Sparkles, X } from 'lucide-react'

interface ChatInputProps {
  threadId: string
}

export function ChatInput({ threadId }: ChatInputProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<
    Array<{ name: string; url: string; size: number; type: string }>
  >([])
  const [aiMode, setAiMode] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('threadId', threadId)

      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Dosya yüklenemedi')
        setUploading(false)
        return
      }

      setAttachments(prev => [...prev, result.data])
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu')
      setUploading(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!content.trim() && attachments.length === 0) || loading) return

    // Check if message starts with @AI
    if (content.trim().startsWith('@AI') || content.trim().startsWith('@ai')) {
      setAiMode(true)
      setLoading(true)
      try {
        const response = await fetch('/api/messages/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId,
            message: content.trim().replace(/^@AI\s*/i, ''),
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          alert(result.error || 'AI cevabı alınamadı')
          setLoading(false)
          setAiMode(false)
          return
        }

        setContent('')
        setAiMode(false)
        router.refresh()
        setLoading(false)
      } catch (err: any) {
        alert(err.message || 'Bir hata oluştu')
        setLoading(false)
        setAiMode(false)
      }
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/messages/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Mesaj gönderilemedi')
        setLoading(false)
        return
      }

      setContent('')
      setAttachments([])
      router.refresh()
      setLoading(false)
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
            >
              <Paperclip className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 truncate max-w-[200px]">{attachment.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
            disabled={uploading}
          />
          <label
            htmlFor="file-input"
            className="flex-shrink-0 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            title="Dosya Ekle"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5 text-gray-600" />
            )}
          </label>
          <div className="flex-1 relative">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !aiMode) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder={
                aiMode
                  ? 'AI yanıt bekleniyor...'
                  : 'Mesaj yazın... (@AI ile AI asistanına soru sorun, Enter ile gönder)'
              }
              rows={1}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none pr-20"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={aiMode}
            />
            {content.trim().startsWith('@AI') || content.trim().startsWith('@ai') ? (
              <div className="absolute right-2 top-2 flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <Sparkles className="w-3 h-3" />
                AI Modu
              </div>
            ) : null}
          </div>
        </div>
        <Button
          type="submit"
          disabled={(!content.trim() && attachments.length === 0) || loading || uploading || aiMode}
        >
          {loading || aiMode ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
