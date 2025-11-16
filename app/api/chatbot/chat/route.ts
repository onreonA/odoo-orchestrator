import { NextRequest, NextResponse } from 'next/server'
import { ChatbotService } from '@/lib/services/chatbot-service'

/**
 * POST /api/chatbot/chat
 * Generate chatbot response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const result = await ChatbotService.generateResponse(message, {
      conversationHistory,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
