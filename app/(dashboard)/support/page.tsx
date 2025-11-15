import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Headphones, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function SupportPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Kullanıcı bulunamadı</div>
  }

  // Get support tickets
  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

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
          <p className="text-[var(--neutral-600)] mt-1">Destek taleplerinizi görüntüleyin ve yönetin</p>
        </div>
        <Button size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Destek Talebi
        </Button>
      </div>

      {/* Support Tickets List */}
      {error ? (
        <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4 text-[var(--error)]">
          Hata: {error.message}
        </div>
      ) : tickets && tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket: any) => (
            <div
              key={ticket.id}
              className="bg-white rounded-xl p-6 border border-[var(--neutral-200)] hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--brand-primary-50)]">
                    <Headphones className="w-5 h-5 text-[var(--brand-primary-500)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{ticket.subject || 'Konu yok'}</h3>
                    <p className="text-sm text-[var(--neutral-600)]">{ticket.description || 'Açıklama yok'}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-[var(--neutral-500)]">
                <div>
                  <span>Öncelik: {ticket.priority || 'medium'}</span>
                </div>
                <div>{new Date(ticket.created_at).toLocaleDateString('tr-TR')}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-[var(--neutral-200)] text-center">
          <MessageSquare className="w-16 h-16 text-[var(--neutral-300)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz destek talebi yok</h3>
          <p className="text-[var(--neutral-600)] mb-6">İlk destek talebinizi oluşturun</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Destek Talebi
          </Button>
        </div>
      )}
    </div>
  )
}

