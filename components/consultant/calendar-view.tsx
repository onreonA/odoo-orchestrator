'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { tr } from 'date-fns/locale'

interface Meeting {
  id: string
  requested_date: string
  duration_minutes: number
  meeting_type: string
  company: { name: string }
  status: string
}

interface ConsultantCalendarViewProps {
  consultantId: string
  calendar: any
  upcomingMeetings: Meeting[]
}

export function ConsultantCalendarView({
  consultantId,
  calendar,
  upcomingMeetings,
}: ConsultantCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get meetings for the current month
  const getMeetingsForDate = (date: Date) => {
    return upcomingMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.requested_date)
      return isSameDay(meetingDate, date)
    })
  }

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  // Get first day of week for the month
  const firstDayOfWeek = monthStart.getDay()
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'MMMM yyyy', { locale: tr })}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, index) => (
          <div key={index} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month start */}
        {daysBeforeMonth.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Days of the month */}
        {daysInMonth.map(day => {
          const meetings = getMeetingsForDate(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={`
                aspect-square border border-gray-200 rounded-lg p-2
                ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}
                ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}
                hover:bg-gray-50 transition-colors cursor-pointer
              `}
            >
              <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
              {meetings.length > 0 && (
                <div className="space-y-1">
                  {meetings.slice(0, 2).map(meeting => (
                    <div
                      key={meeting.id}
                      className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate"
                      title={`${meeting.company.name} - ${format(new Date(meeting.requested_date), 'HH:mm')}`}
                    >
                      {format(new Date(meeting.requested_date), 'HH:mm')}
                    </div>
                  ))}
                  {meetings.length > 2 && (
                    <div className="text-xs text-gray-500">+{meetings.length - 2} daha</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded" />
          <span>Bugün</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 rounded" />
          <span>Toplantı</span>
        </div>
      </div>
    </div>
  )
}
