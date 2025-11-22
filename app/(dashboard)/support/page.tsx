import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, HelpCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function SupportPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Kullanıcı bulunamadı</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()
  const companyId = profile?.company_id

  let query = supabase.from('support_tickets').select('*')

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data: tickets, error } = await query.order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Destek</h1>
          <p className="text-[var(--neutral-600)] mt-1">Destek taleplerinizi yönetin</p>
        </div>
        <Link href="/support/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Destek Talebi
          </Button>
        </Link>
      </div>

      {/* Tickets List */}
      {error ? (
        <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4 text-[var(--error)]">
          Hata: {error.message}
        </div>
      ) : tickets && tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket: any) => (
            <Link
              key={ticket.id}
              href={`/support/${ticket.id}`}
              className="bg-white rounded-xl p-6 border border-[var(--neutral-200)] hover:shadow-lg transition-all block"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-[var(--brand-primary-50)]">
                    <MessageSquare className="w-6 h-6 text-[var(--brand-primary-500)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{ticket.subject}</h3>
                    <p className="text-sm text-[var(--neutral-600)] mb-2">
                      {ticket.description || 'Açıklama yok'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[var(--neutral-500)]">
                      <span>#{ticket.id.slice(0, 8)}</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(ticket.status)}`}
                >
                  {ticket.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-[var(--neutral-200)] text-center">
          <HelpCircle className="w-16 h-16 text-[var(--neutral-300)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz destek talebi yok</h3>
          <p className="text-[var(--neutral-600)] mb-6">
            İlk destek talebinizi oluşturarak başlayın
          </p>
          <Link href="/support/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Destek Talebi
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}



