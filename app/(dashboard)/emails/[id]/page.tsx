import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Reply,
  ReplyAll,
  Forward,
  Star,
  Trash2,
  Archive,
  MoreVertical,
} from 'lucide-react'
import { EmailService } from '@/lib/services/email-service'
import { EmailActions } from '@/components/emails/email-actions'
import { EmailAIInsights } from '@/components/emails/email-ai-insights'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EmailDetailPage({ params }: PageProps) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const { data: email, error } = await EmailService.getEmailById(id)

  if (error || !email) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Email bulunamadı veya erişim izniniz yok.</p>
          <Link href="/emails" className="mt-4 inline-block">
            <Button variant="outline">Gelen Kutusuna Dön</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Verify ownership
  const { data: account } = await EmailService.getEmailAccountById(email.email_account_id)
  if (!account || account.user_id !== user.id) {
    redirect('/emails')
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
        <EmailActions email={email} />
      </div>

      {/* Email Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Subject */}
        <div>
          <h1 className="text-2xl font-bold mb-4">{email.subject}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-900">Gönderen:</span>{' '}
              {email.from_name || email.from_address}
            </div>
            <div>
              <span className="font-medium text-gray-900">Tarih:</span>{' '}
              {new Date(email.created_at).toLocaleString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          {email.to_addresses && email.to_addresses.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Alıcılar:</span>{' '}
              {email.to_addresses.join(', ')}
            </div>
          )}
          {email.cc_addresses && email.cc_addresses.length > 0 && (
            <div className="mt-1 text-sm text-gray-600">
              <span className="font-medium text-gray-900">CC:</span> {email.cc_addresses.join(', ')}
            </div>
          )}
        </div>

        {/* AI Insights */}
        {email.ai_category && <EmailAIInsights email={email} />}

        {/* Body */}
        <div className="border-t border-gray-200 pt-6">
          {email.body_html ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: email.body_html }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-gray-900">{email.body_text}</div>
          )}
        </div>

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium mb-3">Ekler</h3>
            <div className="space-y-2">
              {email.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{attachment.name}</div>
                    <div className="text-sm text-gray-600">
                      {(attachment.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* AI Draft Response */}
        {email.ai_draft_response && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium mb-3">AI Cevap Önerisi</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="whitespace-pre-wrap text-gray-900 mb-4">
                {email.ai_draft_response}
              </div>
              <Link href={`/emails/compose?replyTo=${email.id}`}>
                <Button size="sm">Bu Cevabı Kullan</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
