/**
 * Learning API
 * 
 * Kullanıcı davranışlarını öğrenme endpoint'leri
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LearningService } from '@/lib/services/learning-service'

/**
 * POST /api/ai/learn/decision
 * Karar kaydet
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'record-decision':
        const { context, decision, outcome } = data
        const decisionRecord = LearningService.recordDecision(user.id, context, decision, outcome)
        return NextResponse.json({ success: true, data: decisionRecord })

      case 'learn-communication':
        const { email } = data
        const style = LearningService.learnCommunicationStyle(user.id, email)
        return NextResponse.json({ success: true, data: style })

      case 'learn-priority':
        const { tasks } = data
        const priorityPattern = LearningService.learnPriorityPattern(user.id, tasks)
        return NextResponse.json({ success: true, data: priorityPattern })

      case 'learn-time-preferences':
        const { meetings } = data
        const timePrefs = LearningService.learnTimePreferences(user.id, meetings)
        return NextResponse.json({ success: true, data: timePrefs })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/ai/learn/patterns
 * Öğrenilmiş pattern'leri getir
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contextType = searchParams.get('contextType')

    const patterns = LearningService.getDecisionPatterns(user.id, contextType || undefined)

    return NextResponse.json({ success: true, data: patterns })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

