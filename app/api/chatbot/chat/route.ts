/**
 * Chatbot Chat API
 * 
 * AI Chatbot için chat endpoint'i
 */

import { NextRequest, NextResponse } from 'next/server'
import { ChatbotService } from '@/lib/services/chatbot-service'

/**
 * POST /api/chatbot/chat
 * Chat mesajına yanıt oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory, companyId, projectId } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const { data, error } = await ChatbotService.generateResponse(message, {
      companyId,
      projectId,
      conversationHistory,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

