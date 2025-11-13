'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CalendarEvent } from '@/lib/services/calendar-service'

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

type ViewType = 'month' | 'week' | 'day'

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>('month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Bugün
          </Button>
        </div>

        {/* View Selector */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewType('month')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewType === 'month' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ay
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewType === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Hafta
          </button>
          <button
            onClick={() => setViewType('day')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewType === 'day' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Gün
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewType === 'month' && (
        <MonthlyView year={year} month={month} events={events} onEventClick={onEventClick} />
      )}
      {viewType === 'week' && (
        <WeeklyView currentDate={currentDate} events={events} onEventClick={onEventClick} />
      )}
      {viewType === 'day' && (
        <DailyView currentDate={currentDate} events={events} onEventClick={onEventClick} />
      )}
    </div>
  )
}

// Monthly View Component
function MonthlyView({
  year,
  month,
  events,
  onEventClick,
}: {
  year: number
  month: number
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay()) // Start from Sunday

  const days: Date[] = []
  const currentDate = new Date(startDate)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const eventDate = new Date(event.start_time).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === month
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isTodayDate = isToday(day)
          const isCurrentMonthDate = isCurrentMonth(day)

          return (
            <div
              key={index}
              className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                !isCurrentMonthDate ? 'bg-gray-50' : 'bg-white'
              } ${isTodayDate ? 'bg-blue-50' : ''}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isTodayDate
                    ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                    : isCurrentMonthDate
                      ? 'text-gray-900'
                      : 'text-gray-400'
                }`}
              >
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <Link
                    key={event.id}
                    href={`/calendar/events/${event.id}`}
                    onClick={e => {
                      if (onEventClick) {
                        e.preventDefault()
                        onEventClick(event)
                      }
                    }}
                    className="block text-xs p-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 truncate"
                    title={event.title}
                  >
                    {event.start_time && !event.all_day && (
                      <span className="font-medium">
                        {new Date(event.start_time).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                      </span>
                    )}
                    {event.title}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3} daha</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Weekly View Component
function WeeklyView({
  currentDate,
  events,
  onEventClick,
}: {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()) // Start from Sunday

  const weekDays: Date[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push(day)
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const eventDate = new Date(event.start_time).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  const getEventPosition = (event: CalendarEvent): { top: number; height: number } => {
    const start = new Date(event.start_time)
    const end = new Date(event.end_time)
    const top = (start.getHours() + start.getMinutes() / 60) * 60 // pixels per hour
    const height = ((end.getTime() - start.getTime()) / (1000 * 60)) * 1 // 1px per minute
    return { top, height: Math.max(height, 30) }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-3 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
          Saat
        </div>
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200 last:border-r-0"
          >
            <div>{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</div>
            <div className="text-lg font-semibold">{day.getDate()}</div>
          </div>
        ))}
      </div>

      {/* Time Slots */}
      <div className="grid grid-cols-8">
        {/* Time Column */}
        <div className="border-r border-gray-200">
          {hours.map(hour => (
            <div
              key={hour}
              className="h-16 border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-xs text-gray-500">{hour}:00</span>
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {weekDays.map(day => {
          const dayEvents = getEventsForDay(day)
          return (
            <div
              key={day.toISOString()}
              className="border-r border-gray-200 last:border-r-0 relative"
            >
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b border-gray-100" />
              ))}
              {/* Events */}
              <div className="absolute inset-0 pointer-events-none">
                {dayEvents.map(event => {
                  const { top, height } = getEventPosition(event)
                  return (
                    <Link
                      key={event.id}
                      href={`/calendar/events/${event.id}`}
                      onClick={e => {
                        if (onEventClick) {
                          e.preventDefault()
                          onEventClick(event)
                        }
                      }}
                      className="absolute left-1 right-1 pointer-events-auto bg-blue-100 text-blue-800 rounded p-1 text-xs hover:bg-blue-200 transition-colors"
                      style={{ top: `${top}px`, height: `${height}px` }}
                      title={event.title}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-75">
                        {new Date(event.start_time).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Daily View Component
function DailyView({
  currentDate,
  events,
  onEventClick,
}: {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}) {
  const dateStr = currentDate.toISOString().split('T')[0]
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.start_time).toISOString().split('T')[0]
    return eventDate === dateStr
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventPosition = (event: CalendarEvent): { top: number; height: number } => {
    const start = new Date(event.start_time)
    const end = new Date(event.end_time)
    const top = (start.getHours() + start.getMinutes() / 60) * 60 // pixels per hour
    const height = ((end.getTime() - start.getTime()) / (1000 * 60)) * 1 // 1px per minute
    return { top, height: Math.max(height, 30) }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Day Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </h3>
        <p className="text-sm text-gray-600">{dayEvents.length} etkinlik</p>
      </div>

      {/* Time Slots */}
      <div className="grid grid-cols-12">
        {/* Time Column */}
        <div className="col-span-2 border-r border-gray-200">
          {hours.map(hour => (
            <div
              key={hour}
              className="h-16 border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
            >
              <span className="text-xs text-gray-500">{hour}:00</span>
            </div>
          ))}
        </div>

        {/* Events Column */}
        <div className="col-span-10 relative">
          {hours.map(hour => (
            <div key={hour} className="h-16 border-b border-gray-100" />
          ))}
          {/* Events */}
          <div className="absolute inset-0 p-2">
            {dayEvents.map(event => {
              const { top, height } = getEventPosition(event)
              return (
                <Link
                  key={event.id}
                  href={`/calendar/events/${event.id}`}
                  onClick={e => {
                    if (onEventClick) {
                      e.preventDefault()
                      onEventClick(event)
                    }
                  }}
                  className="absolute left-2 right-2 bg-blue-100 text-blue-800 rounded-lg p-3 hover:bg-blue-200 transition-colors shadow-sm"
                  style={{ top: `${top + 8}px`, height: `${height}px` }}
                >
                  <div className="font-medium mb-1">{event.title}</div>
                  <div className="text-sm opacity-75">
                    {new Date(event.start_time).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(event.end_time).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {event.location && (
                    <div className="text-xs opacity-60 mt-1">📍 {event.location}</div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
