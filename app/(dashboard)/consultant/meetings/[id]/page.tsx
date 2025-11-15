import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Calendar,
  Clock,
  Building2,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MeetingPreparation } from '@/components/consultant/meeting-preparation'

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get meeting request
  const { data: meeting, error } = await supabase
    .from('meeting_requests')
    .select(
      `
      *,
      company:companies(id, name),
      consultant:profiles!meeting_requests_consultant_id_fkey(id, full_name, email),
      requested_by_user:profiles!meeting_requests_requested_by_fkey(id, full_name, email)
    `
    )
    .eq('id', id)
    .single()

  if (error || !meeting) {
    redirect('/consultant/meetings')
  }

  // Check if user has access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const hasAccess =
    meeting.consultant_id === user.id ||
    meeting.requested_by === user.id ||
    profile?.company_id === meeting.company_id ||
    profile?.role === 'super_admin'

  if (!hasAccess) {
    redirect('/dashboard')
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; color: string; label: string }> = {
      pending: { icon: ClockIcon, color: 'bg-orange-100 text-orange-700', label: 'Bekliyor' },
      approved: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Onaylandı' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Reddedildi' },
      cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-700', label: 'İptal Edildi' },
      completed: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700', label: 'Tamamlandı' },
    }
    return badges[status] || badges.pending
  }

  const getMeetingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      discovery: 'Discovery',
      support: 'Destek',
      review: 'İnceleme',
      training: 'Eğitim',
      other: 'Diğer',
    }
    return labels[type] || type
  }

  const statusBadge = getStatusBadge(meeting.status)
  const StatusIcon = statusBadge.icon

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Randevu Detayları</h1>
          <p className="text-gray-600 mt-1">Toplantı bilgileri ve durumu</p>
        </div>
        <Link href="/consultant/calendar">
          <Button variant="outline">Geri Dön</Button>
        </Link>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${statusBadge.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{statusBadge.label}</span>
        </div>
      </div>

      {/* Meeting Details */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-sm text-gray-500">Firma</div>
              <div className="font-semibold">{meeting.company?.name}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-sm text-gray-500">Danışman</div>
              <div className="font-semibold">{meeting.consultant?.full_name}</div>
              <div className="text-sm text-gray-500">{meeting.consultant?.email}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-sm text-gray-500">Tarih ve Saat</div>
              <div className="font-semibold">
                {format(new Date(meeting.requested_date), 'd MMMM yyyy, HH:mm', { locale: tr })}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-sm text-gray-500">Süre</div>
              <div className="font-semibold">{meeting.duration_minutes} dakika</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-sm text-gray-500">Toplantı Türü</div>
              <div className="font-semibold">{getMeetingTypeLabel(meeting.meeting_type)}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="text-sm text-gray-500">Talep Eden</div>
              <div className="font-semibold">{meeting.requested_by_user?.full_name}</div>
              <div className="text-sm text-gray-500">{meeting.requested_by_user?.email}</div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {meeting.notes && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Notlar</div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">{meeting.notes}</div>
          </div>
        )}

        {/* Rejection Reason */}
        {meeting.status === 'rejected' && meeting.rejection_reason && (
          <div>
            <div className="text-sm font-medium text-red-700 mb-2">Red Nedeni</div>
            <div className="bg-red-50 rounded-lg p-4 text-sm text-red-700">
              {meeting.rejection_reason}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Oluşturulma:</span>{' '}
              {format(new Date(meeting.created_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
            </div>
            {meeting.approved_at && (
              <div>
                <span className="font-medium">Onaylanma:</span>{' '}
                {format(new Date(meeting.approved_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
              </div>
            )}
            {meeting.rejected_at && (
              <div>
                <span className="font-medium">Red:</span>{' '}
                {format(new Date(meeting.rejected_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meeting Preparation */}
      {meeting.status === 'approved' && (
        <MeetingPreparation
          meetingId={meeting.id}
          canPrepare={meeting.consultant_id === user.id || profile?.role === 'super_admin'}
        />
      )}
    </div>
  )
}
