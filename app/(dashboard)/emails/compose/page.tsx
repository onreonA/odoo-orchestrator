'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send, Save, X, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { EmailService, EmailAccount } from '@/lib/services/email-service'

export default function ComposeEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const replyToId = searchParams.get('replyTo')
  const replyAll = searchParams.get('replyAll') === 'true'
  const forwardId = searchParams.get('forward')

  const [loading, setLoading] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [error, setError] = useState('')
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [replyEmail, setReplyEmail] = useState<any>(null)

  const [formData, setFormData] = useState({
    email_account_id: '',
    to_addresses: '',
    cc_addresses: '',
    bcc_addresses: '',
    subject: '',
    body_text: '',
  })

  useEffect(() => {
    async function loadAccounts() {
      const supabase = createClient()
      const { data } = await supabase.from('email_accounts').select('*').order('created_at')
      if (data) {
        setAccounts(data)
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, email_account_id: data[0].id }))
        }
      }
    }
    loadAccounts()
  }, [])

  useEffect(() => {
    async function loadReplyEmail() {
      if (replyToId || forwardId) {
        const response = await fetch(`/api/emails/${replyToId || forwardId}`)
        const result = await response.json()
        if (result.data) {
          setReplyEmail(result.data)
          if (replyToId) {
            // Reply
            setFormData({
              email_account_id: result.data.email_account_id,
              to_addresses: replyAll
                ? [
                    result.data.from_address,
                    ...(result.data.to_addresses || []),
                    ...(result.data.cc_addresses || []),
                  ]
                    .filter((email, index, self) => self.indexOf(email) === index)
                    .join(', ')
                : result.data.from_address,
              cc_addresses: replyAll ? result.data.cc_addresses?.join(', ') || '' : '',
              bcc_addresses: '',
              subject: `Re: ${result.data.subject}`,
              body_text: `\n\n--- Orijinal Mesaj ---\n${result.data.body_text || ''}`,
            })
          } else {
            // Forward
            setFormData({
              email_account_id: result.data.email_account_id,
              to_addresses: '',
              cc_addresses: '',
              bcc_addresses: '',
              subject: `Fwd: ${result.data.subject}`,
              body_text: `\n\n--- İletilen Mesaj ---\nKonu: ${result.data.subject}\nGönderen: ${result.data.from_address}\nTarih: ${new Date(result.data.created_at).toLocaleString('tr-TR')}\n\n${result.data.body_text || ''}`,
            })
          }
        }
      }
    }
    loadReplyEmail()
  }, [replyToId, forwardId, replyAll])

  const handleGenerateAIResponse = async () => {
    if (!replyEmail) {
      setError('Yanıtlanacak email bulunamadı')
      return
    }

    setGeneratingAI(true)
    setError('')

    try {
      const response = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-response',
          email: {
            subject: replyEmail.subject,
            body: replyEmail.body_text || replyEmail.body_html,
            from: replyEmail.from_address,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'AI cevap oluşturulamadı')
        setGeneratingAI(false)
        return
      }

      if (result.data?.response) {
        setFormData(prev => ({
          ...prev,
          body_text: result.data.response,
        }))
      }

      setGeneratingAI(false)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setGeneratingAI(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent, send: boolean = false) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const toAddresses = formData.to_addresses.split(',').map(email => email.trim()).filter(Boolean)
      if (toAddresses.length === 0) {
        setError('En az bir alıcı gerekli')
        setLoading(false)
        return
      }

      const emailData = {
        ...formData,
        to_addresses: toAddresses,
        cc_addresses: formData.cc_addresses
          ? formData.cc_addresses.split(',').map(email => email.trim()).filter(Boolean)
          : [],
        bcc_addresses: formData.bcc_addresses
          ? formData.bcc_addresses.split(',').map(email => email.trim()).filter(Boolean)
          : [],
        email_status: send ? 'sent' : 'draft',
      }

      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Email kaydedilemedi')
        setLoading(false)
        return
      }

      if (send) {
        router.push('/emails')
        router.refresh()
      } else {
        router.push(`/emails/${result.data.id}`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/emails">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {replyEmail && (
            <Button variant="outline" size="sm" onClick={handleGenerateAIResponse} disabled={generatingAI}>
              {generatingAI ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI ile Cevap Oluştur
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={e => handleSubmit(e, false)} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Taslak Olarak Kaydet
          </Button>
          <Button onClick={e => handleSubmit(e, true)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Gönder
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={e => handleSubmit(e, true)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* From */}
        {accounts.length > 0 && (
          <div>
            <label htmlFor="email_account_id" className="block text-sm font-medium mb-1">
              Gönderen
            </label>
            <select
              id="email_account_id"
              required
              value={formData.email_account_id}
              onChange={e => setFormData({ ...formData, email_account_id: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.display_name || account.email_address}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* To */}
        <div>
          <label htmlFor="to_addresses" className="block text-sm font-medium mb-1">
            Alıcı <span className="text-red-500">*</span>
          </label>
          <input
            id="to_addresses"
            type="text"
            required
            value={formData.to_addresses}
            onChange={e => setFormData({ ...formData, to_addresses: e.target.value })}
            placeholder="email@example.com, email2@example.com"
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* CC */}
        <div>
          <label htmlFor="cc_addresses" className="block text-sm font-medium mb-1">
            CC
          </label>
          <input
            id="cc_addresses"
            type="text"
            value={formData.cc_addresses}
            onChange={e => setFormData({ ...formData, cc_addresses: e.target.value })}
            placeholder="email@example.com"
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* BCC */}
        <div>
          <label htmlFor="bcc_addresses" className="block text-sm font-medium mb-1">
            BCC
          </label>
          <input
            id="bcc_addresses"
            type="text"
            value={formData.bcc_addresses}
            onChange={e => setFormData({ ...formData, bcc_addresses: e.target.value })}
            placeholder="email@example.com"
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            Konu <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            required
            value={formData.subject}
            onChange={e => setFormData({ ...formData, subject: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Body */}
        <div>
          <label htmlFor="body_text" className="block text-sm font-medium mb-1">
            Mesaj <span className="text-red-500">*</span>
          </label>
          <textarea
            id="body_text"
            required
            rows={12}
            value={formData.body_text}
            onChange={e => setFormData({ ...formData, body_text: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </div>
  )
}


