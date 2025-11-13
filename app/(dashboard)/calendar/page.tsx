import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import { CalendarService } from '@/lib/services/calendar-service'
import { CalendarView } from '@/components/calendar/calendar-view'

export default async function CalendarPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current date
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1

  // Get events for current month
  const { data: events } = await CalendarService.getEventsForMonth(year, month)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Takvim</h1>
          <p className="text-gray-600 mt-1">Etkinliklerinizi yönetin ve planlayın</p>
        </div>
        <Link href="/calendar/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Etkinlik
          </Button>
        </Link>
      </div>

      {/* Calendar View */}
      {events && events.length > 0 ? (
        <CalendarView events={events} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Henüz etkinlik yok</p>
              <p className="text-sm mt-2">
                Yeni bir etkinlik oluşturmak için yukarıdaki butona tıklayın
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events List */}
      {events && events.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Yaklaşan Etkinlikler</h2>
          <div className="space-y-3">
            {events.slice(0, 5).map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(event.start_time).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {event.location && (
                    <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                  )}
                </div>
                <Link href={`/calendar/events/${event.id}`}>
                  <Button variant="outline" size="sm">
                    Detay
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          {events.length > 5 && (
            <div className="mt-4 text-center">
              <Link href="/calendar">
                <Button variant="outline">Tümünü Gör ({events.length})</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
