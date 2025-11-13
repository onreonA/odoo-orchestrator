import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Star, Filter, Search, Inbox, Archive, Trash2 } from 'lucide-react'
import { EmailService } from '@/lib/services/email-service'

export default async function EmailsPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get emails
  const { data: emails } = await EmailService.getEmails({
    userId: user.id,
    status: 'received',
    limit: 50,
  })

  // Get email accounts
  const { data: accounts } = await EmailService.getEmailAccounts(user.id)

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Email</h2>
          <Link href="/emails/compose">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Yeni
            </Button>
          </Link>
        </div>

        <nav className="space-y-1">
          <Link
            href="/emails"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Inbox className="w-4 h-4" />
            <span>Gelen Kutusu</span>
            {emails && emails.filter(e => !e.read).length > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {emails.filter(e => !e.read).length}
              </span>
            )}
          </Link>
          <Link
            href="/emails?starred=true"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Star className="w-4 h-4" />
            <span>Yıldızlı</span>
          </Link>
          <Link
            href="/emails?status=archived"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Archive className="w-4 h-4" />
            <span>Arşiv</span>
          </Link>
          <Link
            href="/emails?status=deleted"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Çöp Kutusu</span>
          </Link>
        </nav>

        {/* Email Accounts */}
        {accounts && accounts.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Hesaplar</h3>
            <div className="space-y-1">
              {accounts.map(account => (
                <Link
                  key={account.id}
                  href={`/emails?emailAccountId=${account.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{account.email_address}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link href="/emails/accounts" className="block pt-4 border-t border-gray-200">
          <Button variant="outline" size="sm" className="w-full">
            Hesapları Yönet
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Gelen Kutusu</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtrele
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Ara
              </Button>
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {emails && emails.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {emails.map(email => (
                <Link
                  key={email.id}
                  href={`/emails/${email.id}`}
                  className={`block p-4 hover:bg-gray-50 transition-colors ${
                    !email.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">
                          {email.from_name || email.from_address}
                        </span>
                        {email.starred && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {email.ai_category && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              email.ai_category === 'urgent'
                                ? 'bg-red-100 text-red-800'
                                : email.ai_category === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : email.ai_category === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {email.ai_category === 'urgent' && 'Acil'}
                            {email.ai_category === 'high' && 'Yüksek'}
                            {email.ai_category === 'medium' && 'Orta'}
                            {email.ai_category === 'low' && 'Düşük'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate mb-1">
                        {email.subject}
                      </p>
                      {email.ai_summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">{email.ai_summary}</p>
                      )}
                      {!email.ai_summary && email.body_text && (
                        <p className="text-sm text-gray-600 line-clamp-2">{email.body_text}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(email.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Mail className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Gelen kutunuz boş</h3>
              <p className="text-gray-600 mb-6">
                Email hesabınızı bağlayarak başlayın veya yeni bir email yazın
              </p>
              <div className="flex gap-2">
                <Link href="/emails/accounts">
                  <Button variant="outline">Hesap Ekle</Button>
                </Link>
                <Link href="/emails/compose">
                  <Button>Yeni Email</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
