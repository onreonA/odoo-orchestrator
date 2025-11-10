import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Trash2, Settings, CheckCircle2, XCircle } from 'lucide-react'
import { EmailService } from '@/lib/services/email-service'
import { DeleteAccountButton } from '@/components/emails/delete-account-button'

export default async function EmailAccountsPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get email accounts
  const { data: accounts } = await EmailService.getEmailAccounts(user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Hesapları</h1>
          <p className="text-gray-600 mt-1">Email hesaplarınızı yönetin ve senkronize edin</p>
        </div>
        <Link href="/emails/accounts/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Hesap Ekle
          </Button>
        </Link>
      </div>

      {/* Accounts List */}
      {accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map(account => (
            <div
              key={account.id}
              className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{account.display_name || account.email_address}</h3>
                    <p className="text-sm text-gray-600">{account.email_address}</p>
                    {account.provider && (
                      <p className="text-xs text-gray-500 mt-1">
                        {account.provider === 'gmail' && 'Gmail'}
                        {account.provider === 'outlook' && 'Outlook'}
                        {account.provider === 'imap' && 'IMAP'}
                        {account.provider === 'smtp' && 'SMTP'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.sync_enabled ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Senkronizasyon:</span>
                  <span className={`font-medium ${account.sync_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {account.sync_enabled ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                {account.sync_enabled && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Sıklık:</span>
                    <span className="font-medium">{account.sync_frequency} dakika</span>
                  </div>
                )}
                {account.last_synced_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Son Senkronizasyon:</span>
                    <span className="font-medium">
                      {new Date(account.last_synced_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {account.last_sync_status && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Durum:</span>
                    <span
                      className={`font-medium ${
                        account.last_sync_status === 'success'
                          ? 'text-green-600'
                          : account.last_sync_status === 'failed'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {account.last_sync_status === 'success' && 'Başarılı'}
                      {account.last_sync_status === 'failed' && 'Başarısız'}
                      {account.last_sync_status === 'syncing' && 'Senkronize Ediliyor'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <Link href={`/emails/accounts/${account.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Ayarlar
                  </Button>
                </Link>
                <DeleteAccountButton accountId={account.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz email hesabı yok</h3>
          <p className="text-gray-600 mb-6">
            Email hesabınızı ekleyerek email'lerinizi yönetmeye başlayın
          </p>
          <Link href="/emails/accounts/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              İlk Hesabı Ekle
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}


