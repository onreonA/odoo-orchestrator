import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailHandlerAgent } from '@/lib/ai/agents/email-handler-agent'

/**
 * POST /api/ai/email/categorize
 * Email'i kategorize et ve öncelik belirle
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
    const { action, email } = body

    if (!action || !email) {
      return NextResponse.json({ error: 'Missing required fields: action, email' }, { status: 400 })
    }

    const agent = new EmailHandlerAgent()

    switch (action) {
      case 'categorize':
        const category = await agent.categorizeEmail(email)
        return NextResponse.json({ success: true, data: category })

      case 'generate-response':
        const response = await agent.generateResponse(email, body.context)
        return NextResponse.json({ success: true, data: response })

      case 'detect-urgency':
        const urgency = await agent.detectUrgency(email)
        return NextResponse.json({ success: true, data: urgency })

      case 'batch-process':
        const batchResult = await agent.batchProcessEmails(email.emails || [])
        return NextResponse.json({ success: true, data: batchResult })

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: categorize, generate-response, detect-urgency, batch-process',
          },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Email Handler Agent Error:', error)
    return NextResponse.json({ error: error.message || 'Email processing failed' }, { status: 500 })
  }
}



