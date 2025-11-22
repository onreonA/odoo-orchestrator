import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MeetingRequestForm } from '@/components/consultant/meeting-request-form'

export default async function RequestMeetingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (!profile) {
    redirect('/login')
  }

  // Get user's company
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()

  // Get available consultants
  const { data: consultants } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('role', ['consultant', 'super_admin'])
    .order('full_name')

  // Get consultant calendars to check availability
  const consultantIds = consultants?.map(c => c.id) || []
  const { data: consultantCalendars } = await supabase
    .from('consultant_calendar')
    .select('consultant_id, privacy_settings, working_hours')
    .in('consultant_id', consultantIds)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Randevu Talep Et</h1>
        <p className="text-gray-600 mt-1">Danışmanımızdan randevu talep edin</p>
      </div>

      {/* Meeting Request Form */}
      <MeetingRequestForm
        userId={user.id}
        companyId={company?.id}
        consultants={consultants || []}
        consultantCalendars={consultantCalendars || []}
      />
    </div>
  )
}

