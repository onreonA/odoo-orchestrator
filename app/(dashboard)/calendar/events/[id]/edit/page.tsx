import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarService } from '@/lib/services/calendar-service'
import { EditEventForm } from '@/components/calendar/edit-event-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: PageProps) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const { data: event, error } = await CalendarService.getEventById(id)

  if (error || !event) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Etkinlik bulunamadı veya erişim izniniz yok.</p>
        </div>
      </div>
    )
  }

  // Check if user is the organizer
  if (event.organizer_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      redirect('/calendar')
    }
  }

  return <EditEventForm event={event} />
}


