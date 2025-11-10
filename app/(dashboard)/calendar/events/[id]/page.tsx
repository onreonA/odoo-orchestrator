import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Trash2, Calendar as CalendarIcon, MapPin, Video, Building2 } from 'lucide-react'
import { CalendarService } from '@/lib/services/calendar-service'
import { DeleteEventButton } from '@/components/calendar/delete-event-button'
import { MeetingPreparation } from '@/components/calendar/meeting-preparation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
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
          <Link href="/calendar" className="mt-4 inline-block">
            <Button variant="outline">Takvime Dön</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get company name if exists
  let companyName = null
  if (event.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', event.company_id)
      .single()
    companyName = company?.name
  }

  const startDate = new Date(event.start_time)
  const endDate = new Date(event.end_time)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/calendar">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-gray-600 mt-1">
              {startDate.toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/calendar/events/${event.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </Button>
          </Link>
          <DeleteEventButton eventId={event.id} />
        </div>
      </div>

      {/* Event Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Description */}
        {event.description && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Açıklama</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Time */}
        <div className="flex items-start gap-3">
          <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Tarih ve Saat</h3>
            <p className="text-gray-600">
              {event.all_day ? (
                <>
                  {startDate.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {' - Tüm gün'}
                </>
              ) : (
                <>
                  {startDate.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {' '}
                  {startDate.toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' - '}
                  {endDate.toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Lokasyon</h3>
              <p className="text-gray-600">{event.location}</p>
            </div>
          </div>
        )}

        {/* Meeting URL */}
        {event.meeting_url && (
          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Toplantı Linki</h3>
              <a
                href={event.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {event.meeting_url}
              </a>
            </div>
          </div>
        )}

        {/* Company */}
        {companyName && (
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Firma</h3>
              <p className="text-gray-600">{companyName}</p>
            </div>
          </div>
        )}

        {/* Event Type & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-1">Etkinlik Tipi</h3>
            <p className="text-gray-600 capitalize">
              {event.event_type === 'meeting' && 'Toplantı'}
              {event.event_type === 'call' && 'Görüşme'}
              {event.event_type === 'task' && 'Görev'}
              {event.event_type === 'reminder' && 'Hatırlatıcı'}
              {event.event_type === 'block' && 'Blok'}
              {event.event_type === 'other' && 'Diğer'}
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Durum</h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : event.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : event.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {event.status === 'scheduled' && 'Planlandı'}
              {event.status === 'confirmed' && 'Onaylandı'}
              {event.status === 'cancelled' && 'İptal Edildi'}
              {event.status === 'completed' && 'Tamamlandı'}
            </span>
          </div>
        </div>
      </div>

      {/* Meeting Preparation */}
      {event.start_time && new Date(event.start_time) > new Date() && (
        <MeetingPreparation event={event} />
      )}
    </div>
  )
}

