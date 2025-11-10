import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EmailService } from '@/lib/services/email-service'
import { EmailAccountSettings } from '@/components/emails/email-account-settings'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EmailAccountSettingsPage({ params }: PageProps) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const { data: account, error } = await EmailService.getEmailAccountById(id)

  if (error || !account) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Email hesabı bulunamadı.</p>
          <Link href="/emails/accounts" className="mt-4 inline-block">
            <Button variant="outline">Geri Dön</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check ownership
  if (account.user_id !== user.id) {
    redirect('/emails/accounts')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/emails/accounts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{account.display_name || account.email_address}</h1>
          <p className="text-gray-600 mt-1">Email hesabı ayarları</p>
        </div>
      </div>

      {/* Settings */}
      <EmailAccountSettings account={account} />
    </div>
  )
}


