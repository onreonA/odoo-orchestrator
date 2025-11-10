/**
 * Decision Making API
 * 
 * Otonom karar verme endpoint'leri
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DecisionMakingService } from '@/lib/services/decision-making-service'

/**
 * POST /api/ai/decide
 * Karar ver veya öneri oluştur
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
    const { action, context } = body

    if (!context) {
      return NextResponse.json({ error: 'Context required' }, { status: 400 })
    }

    switch (action) {
      case 'make-decision':
        const decision = DecisionMakingService.makeDecision(user.id, context)
        if (!decision) {
          return NextResponse.json({ success: false, error: 'No decision pattern found' })
        }
        return NextResponse.json({ success: true, data: decision })

      case 'execute-automatic':
        const result = await DecisionMakingService.executeAutomaticDecision(user.id, context)
        return NextResponse.json(result)

      case 'generate-suggestion':
        const suggestion = DecisionMakingService.generateSuggestion(user.id, context)
        if (!suggestion) {
          return NextResponse.json({ success: false, error: 'No suggestion available' })
        }
        return NextResponse.json({ success: true, data: suggestion })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

