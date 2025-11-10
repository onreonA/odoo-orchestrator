import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarAgent } from '@/lib/ai/agents/calendar-agent'

/**
 * POST /api/ai/calendar
 * Calendar Agent işlemleri
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    if (!action || !data) {
      return NextResponse.json({ error: 'Missing required fields: action, data' }, { status: 400 })
    }

    const agent = new CalendarAgent()

    switch (action) {
      case 'suggest-time':
        const suggestions = await agent.suggestOptimalTime(data)
        return NextResponse.json({ success: true, data: suggestions })

      case 'prepare-meeting':
        const preparation = await agent.prepareMeeting(data)
        return NextResponse.json({ success: true, data: preparation })

      case 'optimize-schedule':
        const optimized = await agent.optimizeDailySchedule(data.day, data.meetings || [])
        return NextResponse.json({ success: true, data: optimized })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: suggest-time, prepare-meeting, optimize-schedule' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Calendar Agent Error:', error)
    return NextResponse.json(
      { error: error.message || 'Calendar processing failed' },
      { status: 500 }
    )
  }
}



