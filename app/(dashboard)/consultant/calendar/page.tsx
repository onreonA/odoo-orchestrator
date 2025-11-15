import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, Clock, Settings, Users } from 'lucide-react'
import { ConsultantCalendarView } from '@/components/consultant/calendar-view'
import { AvailabilityManager } from '@/components/consultant/availability-manager'
import { PrivacySettings } from '@/components/consultant/privacy-settings'
import { MeetingRequestList } from '@/components/consultant/meeting-request-list'
import { CalendarSyncSettings } from '@/components/consultant/calendar-sync-settings'

export default async function ConsultantCalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Check if user is consultant or super_admin
  if (profile?.role !== 'consultant' && profile?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  // Get consultant calendar
  const { data: consultantCalendar } = await supabase
    .from('consultant_calendar')
    .select('*')
    .eq('consultant_id', user.id)
    .single()

  // Get pending meeting requests
  const { data: pendingRequests } = await supabase
    .from('meeting_requests')
    .select(
      `
      *,
      company:companies(id, name),
      requested_by_user:profiles!meeting_requests_requested_by_fkey(id, full_name, email)
    `
    )
    .eq('consultant_id', user.id)
    .eq('status', 'pending')
    .order('requested_date', { ascending: true })

  // Get upcoming meetings
  const { data: upcomingMeetings } = await supabase
    .from('meeting_requests')
    .select(
      `
      *,
      company:companies(id, name),
      requested_by_user:profiles!meeting_requests_requested_by_fkey(id, full_name, email)
    `
    )
    .eq('consultant_id', user.id)
    .eq('status', 'approved')
    .gte('requested_date', new Date().toISOString())
    .order('requested_date', { ascending: true })
    .limit(10)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Danışman Takvimi
          </h1>
          <p className="text-gray-600 mt-1">
            Takviminizi yönetin ve randevu taleplerini görüntüleyin
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bekleyen Talepler</p>
              <p className="text-3xl font-bold mt-2">{pendingRequests?.length || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Yaklaşan Toplantılar</p>
              <p className="text-3xl font-bold mt-2">{upcomingMeetings?.length || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Takvim Durumu</p>
              <p className="text-lg font-semibold mt-2">
                {consultantCalendar ? 'Aktif' : 'Ayarlanmamış'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <Settings className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <ConsultantCalendarView
            consultantId={user.id}
            calendar={consultantCalendar}
            upcomingMeetings={upcomingMeetings || []}
          />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Availability Manager */}
          <AvailabilityManager consultantId={user.id} calendar={consultantCalendar} />

          {/* Privacy Settings */}
          <PrivacySettings consultantId={user.id} calendar={consultantCalendar} />

          {/* Calendar Sync Settings */}
          <CalendarSyncSettings consultantId={user.id} calendar={consultantCalendar} />
        </div>
      </div>

      {/* Meeting Requests */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Randevu Talepleri</h2>
        <MeetingRequestList
          consultantId={user.id}
          pendingRequests={pendingRequests || []}
          upcomingMeetings={upcomingMeetings || []}
        />
      </div>
    </div>
  )
}
